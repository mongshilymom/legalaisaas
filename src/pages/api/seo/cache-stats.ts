import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { getSeoCacheStats, clearSeoCache, cleanupCache } from '../../../lib/cache/seoCache';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication for admin-only endpoint
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access cache statistics'
      });
    }

    // Check if user is admin
    const isAdmin = session.user.email.includes('admin') || 
                   session.user.email === 'developer@legalaisaas.com';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'Only administrators can access cache statistics'
      });
    }

    switch (req.method) {
      case 'GET':
        // Get cache statistics
        console.log('📊 Fetching SEO cache statistics...');
        const stats = await getSeoCacheStats();
        
        res.status(200).json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
        break;

      case 'POST':
        // Handle cache management actions
        const { action } = req.body;
        
        switch (action) {
          case 'cleanup':
            console.log('🧹 Cleaning up SEO cache...');
            await cleanupCache();
            const cleanupStats = await getSeoCacheStats();
            
            res.status(200).json({
              success: true,
              message: 'Cache cleanup completed',
              data: cleanupStats,
              timestamp: new Date().toISOString(),
            });
            break;

          case 'clear':
            console.log('🗑️ Clearing all SEO cache...');
            const cleared = await clearSeoCache();
            
            if (cleared) {
              res.status(200).json({
                success: true,
                message: 'Cache cleared successfully',
                timestamp: new Date().toISOString(),
              });
            } else {
              res.status(500).json({
                success: false,
                error: 'Failed to clear cache',
                timestamp: new Date().toISOString(),
              });
            }
            break;

          default:
            res.status(400).json({
              error: 'Invalid action',
              message: 'Valid actions are: cleanup, clear',
            });
            break;
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }

  } catch (error) {
    console.error('❌ Cache stats API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Cache statistics failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}