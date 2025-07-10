import { NextApiRequest, NextApiResponse } from 'next';
import { invalidateCache, getCachedGrowthStats } from '../../../lib/logs/growthTracker';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting growth stats update...');
    
    // Invalidate existing cache
    invalidateCache();
    
    // Generate fresh statistics
    const freshStats = await getCachedGrowthStats();
    
    // Log the update for monitoring
    console.log('Growth stats updated successfully:', {
      totalUsers: freshStats.userGrowth.totalUsers,
      recentUsers: freshStats.userGrowth.recentUsers,
      totalApiCalls: freshStats.modelUsage.totalApiCalls,
      conversionRate: freshStats.upselling.conversionRate,
      churnRate: freshStats.churn.churnRate,
      timestamp: freshStats.lastUpdated
    });

    // Optional: Save to database for historical tracking
    // await saveGrowthStatsToHistory(freshStats);

    res.status(200).json({ 
      success: true, 
      message: 'Growth stats updated successfully',
      timestamp: freshStats.lastUpdated,
      stats: {
        totalUsers: freshStats.userGrowth.totalUsers,
        recentUsers: freshStats.userGrowth.recentUsers,
        conversionRate: freshStats.upselling.conversionRate.toFixed(2) + '%'
      }
    });
  } catch (error) {
    console.error('Growth stats update error:', error);
    res.status(500).json({ 
      error: 'Failed to update growth statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Optional: Function to save growth stats history to database
async function saveGrowthStatsToHistory(stats: any) {
  // This would save historical data to your database
  // Example:
  // await db.growthStatsHistory.create({
  //   data: {
  //     totalUsers: stats.userGrowth.totalUsers,
  //     recentUsers: stats.userGrowth.recentUsers,
  //     conversionRate: stats.upselling.conversionRate,
  //     churnRate: stats.churn.churnRate,
  //     totalApiCalls: stats.modelUsage.totalApiCalls,
  //     revenueImpact: stats.upselling.revenueImpact,
  //     createdAt: new Date()
  //   }
  // });
}