import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { getCachedGrowthStats, invalidateCache } from '../../../lib/logs/growthTracker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const isAdmin = session.user.email.includes('admin') || 
                   session.user.email === 'developer@legalaisaas.com';
    
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    switch (req.method) {
      case 'GET':
        const growthData = await getCachedGrowthStats();
        res.status(200).json(growthData);
        break;

      case 'POST':
        // Force refresh cache
        invalidateCache();
        const refreshedData = await getCachedGrowthStats();
        res.status(200).json(refreshedData);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Growth stats API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch growth statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}