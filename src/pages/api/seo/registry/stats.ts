import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../features/auth/authOptions';
import { getRegistryStats, exportRegistryData, cleanupOldEntries, SeoRegistryFilter } from '../../../../lib/seo/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access SEO registry statistics'
      });
    }

    // Check if user is admin
    const isAdmin = session.user.email.includes('admin') || 
                   session.user.email === 'developer@legalaisaas.com';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'Only administrators can access SEO registry statistics'
      });
    }

    switch (req.method) {
      case 'GET':
        // Get registry statistics
        console.log('📊 Registry stats request from:', session.user.email);
        
        const stats = await getRegistryStats();
        
        res.status(200).json({
          success: true,
          data: stats,
          meta: {
            timestamp: new Date().toISOString(),
            requestedBy: session.user.email,
          }
        });
        break;

      case 'POST':
        // Handle registry management actions
        const { action } = req.body;
        
        switch (action) {
          case 'export':
            console.log('📤 Registry export request from:', session.user.email);
            
            const { format = 'json', filter } = req.body;
            
            if (!['json', 'csv'].includes(format)) {
              return res.status(400).json({
                error: 'Invalid export format',
                message: 'Supported formats: json, csv'
              });
            }

            const exportData = await exportRegistryData(format as 'json' | 'csv', filter as SeoRegistryFilter);
            
            res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="seo-registry-${new Date().toISOString().split('T')[0]}.${format}"`);
            res.status(200).send(exportData);
            break;

          case 'cleanup':
            console.log('🧹 Registry cleanup request from:', session.user.email);
            
            const { olderThanDays = 90 } = req.body;
            const deletedCount = await cleanupOldEntries(olderThanDays);
            
            res.status(200).json({
              success: true,
              message: `Cleaned up ${deletedCount} old entries`,
              data: {
                deletedCount,
                olderThanDays,
              },
              meta: {
                timestamp: new Date().toISOString(),
                performedBy: session.user.email,
              }
            });
            break;

          default:
            res.status(400).json({
              error: 'Invalid action',
              message: 'Valid actions are: export, cleanup',
            });
            break;
        }
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
        break;
    }

  } catch (error) {
    console.error('❌ Registry stats API error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Registry statistics failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString(),
      }
    });
  }
}