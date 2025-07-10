import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../features/auth/authOptions';
import { loadRegistryEntries, getRegistryStats, SeoRegistryFilter } from '../../../../lib/seo/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access SEO registry'
      });
    }

    // Check if user is admin (for now, restrict to admins)
    const isAdmin = session.user.email.includes('admin') || 
                   session.user.email === 'developer@legalaisaas.com';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'Only administrators can access SEO registry'
      });
    }

    console.log('📋 Registry list request from:', session.user.email);

    // Parse query parameters for filtering
    const filter: SeoRegistryFilter = {};
    
    if (req.query.category && req.query.category !== 'all') {
      filter.category = req.query.category as string;
    }
    
    if (req.query.language && req.query.language !== 'all') {
      filter.language = req.query.language as string;
    }
    
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status as 'success' | 'error';
    }
    
    if (req.query.dateFrom) {
      filter.dateFrom = req.query.dateFrom as string;
    }
    
    if (req.query.dateTo) {
      filter.dateTo = req.query.dateTo as string;
    }

    // Load registry entries
    const entries = await loadRegistryEntries(filter);
    
    // Get statistics if requested
    let stats;
    if (req.query.includeStats === 'true') {
      stats = await getRegistryStats();
    }

    console.log('✅ Registry entries loaded:', {
      totalEntries: entries.length,
      filter,
      includeStats: !!stats,
    });

    res.status(200).json({
      success: true,
      results: entries,
      stats,
      meta: {
        totalResults: entries.length,
        filter,
        timestamp: new Date().toISOString(),
        requestedBy: session.user.email,
      }
    });

  } catch (error) {
    console.error('❌ Registry list failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to load registry entries',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  }
}