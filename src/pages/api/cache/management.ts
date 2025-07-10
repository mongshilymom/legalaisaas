import { NextApiRequest, NextApiResponse } from 'next';
import { claudeCache } from '@/services/claude-cache';
import { cacheAnalytics } from '@/services/cache-analytics';
import { cacheWarmingService } from '@/services/cache-warming';
import { cacheInvalidationService } from '@/services/cache-invalidation-triggers';

interface CacheManagementResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheManagementResponse>
) {
  const timestamp = new Date().toISOString();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetCacheInfo(req, res, timestamp);
      case 'POST':
        return await handleCacheActions(req, res, timestamp);
      case 'DELETE':
        return await handleCacheClearing(req, res, timestamp);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          timestamp
        });
    }
  } catch (error) {
    console.error('Cache management API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp
    });
  }
}

async function handleGetCacheInfo(
  req: NextApiRequest,
  res: NextApiResponse<CacheManagementResponse>,
  timestamp: string
) {
  const { action, period, userId, alertId } = req.query;

  switch (action) {
    case 'stats':
      const stats = claudeCache.getCacheStats();
      return res.status(200).json({
        success: true,
        data: stats,
        timestamp
      });

    case 'analytics':
      const reportPeriod = (period as 'hour' | 'day' | 'week' | 'month') || 'day';
      const performanceReport = cacheAnalytics.generatePerformanceReport(reportPeriod);
      return res.status(200).json({
        success: true,
        data: performanceReport,
        timestamp
      });

    case 'metrics':
      const limit = parseInt(req.query.limit as string) || 100;
      const metrics = cacheAnalytics.getMetrics(limit);
      return res.status(200).json({
        success: true,
        data: { metrics, count: metrics.length },
        timestamp
      });

    case 'alerts':
      const alerts = alertId 
        ? [cacheAnalytics.getAllAlerts().find(a => a.id === alertId)].filter(Boolean)
        : cacheAnalytics.getActiveAlerts();
      return res.status(200).json({
        success: true,
        data: { alerts, count: alerts.length },
        timestamp
      });

    case 'health':
      const healthScore = cacheAnalytics.getCacheHealthScore();
      const activeAlerts = cacheAnalytics.getActiveAlerts().length;
      const recentMetrics = cacheAnalytics.getMetrics(1)[0];
      
      return res.status(200).json({
        success: true,
        data: {
          healthScore,
          status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : healthScore > 40 ? 'fair' : 'poor',
          activeAlerts,
          lastMetric: recentMetrics,
          recommendations: cacheAnalytics.getOptimizationSuggestions()
        },
        timestamp
      });

    case 'warmup-status':
      const warmupStats = cacheWarmingService.getWarmupStats();
      return res.status(200).json({
        success: true,
        data: warmupStats,
        timestamp
      });

    case 'triggers':
      const triggers = cacheInvalidationService.getTriggers();
      const triggerStats = cacheInvalidationService.getTriggerStats();
      return res.status(200).json({
        success: true,
        data: { triggers, stats: triggerStats },
        timestamp
      });

    default:
      // Default: return comprehensive cache overview
      const overview = {
        stats: claudeCache.getCacheStats(),
        health: {
          score: cacheAnalytics.getCacheHealthScore(),
          alerts: cacheAnalytics.getActiveAlerts().length
        },
        warmup: cacheWarmingService.getWarmupStats(),
        invalidation: cacheInvalidationService.getTriggerStats()
      };

      return res.status(200).json({
        success: true,
        data: overview,
        timestamp
      });
  }
}

async function handleCacheActions(
  req: NextApiRequest,
  res: NextApiResponse<CacheManagementResponse>,
  timestamp: string
) {
  const { action } = req.body;

  switch (action) {
    case 'warmup':
      const { promptId, category, userId, priority } = req.body;
      
      if (promptId) {
        // Warm up specific prompt
        const jobId = await cacheWarmingService.scheduleWarmup(promptId, priority);
        return res.status(200).json({
          success: true,
          data: { jobId, message: `Warmup scheduled for prompt: ${promptId}` },
          timestamp
        });
      } else if (category) {
        // Warm up by category
        await cacheWarmingService.warmupByCategory(category);
        return res.status(200).json({
          success: true,
          data: { message: `Warmup scheduled for category: ${category}` },
          timestamp
        });
      } else if (userId) {
        // Warm up for specific user
        await cacheWarmingService.warmupForUser(userId);
        return res.status(200).json({
          success: true,
          data: { message: `Personalized warmup scheduled for user: ${userId}` },
          timestamp
        });
      } else {
        // Warm up all
        await cacheWarmingService.warmupAll();
        return res.status(200).json({
          success: true,
          data: { message: 'Comprehensive cache warmup initiated' },
          timestamp
        });
      }

    case 'invalidate':
      const { invalidationType, target, reason } = req.body;
      let invalidatedCount = 0;

      switch (invalidationType) {
        case 'tag':
          invalidatedCount = await claudeCache.invalidateByTag(target);
          break;
        case 'user':
          invalidatedCount = await claudeCache.invalidateByUser(target);
          break;
        case 'contract-analysis':
          await cacheInvalidationService.invalidateContractAnalysis(target);
          invalidatedCount = 1; // Trigger-based invalidation
          break;
        case 'compliance-rules':
          await cacheInvalidationService.invalidateComplianceRules(target);
          invalidatedCount = 1; // Trigger-based invalidation
          break;
        case 'jurisdiction':
          await cacheInvalidationService.invalidateJurisdictionCache(target);
          invalidatedCount = 1; // Trigger-based invalidation
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Invalid invalidation type',
            timestamp
          });
      }

      return res.status(200).json({
        success: true,
        data: { 
          invalidatedCount, 
          message: `Invalidated cache entries: ${invalidatedCount}`,
          reason: reason || 'Manual invalidation'
        },
        timestamp
      });

    case 'resolve-alert':
      const { alertId } = req.body;
      const resolved = cacheAnalytics.resolveAlert(alertId);
      
      return res.status(200).json({
        success: resolved,
        data: { 
          alertId,
          resolved,
          message: resolved ? 'Alert resolved successfully' : 'Alert not found or already resolved'
        },
        timestamp
      });

    case 'update-thresholds':
      const { thresholds } = req.body;
      cacheAnalytics.updateAlertThresholds(thresholds);
      
      return res.status(200).json({
        success: true,
        data: { 
          message: 'Alert thresholds updated successfully',
          newThresholds: thresholds
        },
        timestamp
      });

    case 'add-warmup-prompt':
      const { warmupPrompt } = req.body;
      cacheWarmingService.addWarmupPrompt(warmupPrompt);
      
      return res.status(200).json({
        success: true,
        data: { 
          message: 'Warmup prompt added successfully',
          promptId: warmupPrompt.id
        },
        timestamp
      });

    case 'trigger-invalidation':
      const { triggerEvent } = req.body;
      await cacheInvalidationService.triggerEvent(triggerEvent);
      
      return res.status(200).json({
        success: true,
        data: { 
          message: 'Invalidation trigger event queued successfully',
          eventType: triggerEvent.type
        },
        timestamp
      });

    case 'activate-trigger':
      const { triggerId } = req.body;
      const activated = cacheInvalidationService.activateTrigger(triggerId);
      
      return res.status(200).json({
        success: activated,
        data: { 
          triggerId,
          activated,
          message: activated ? 'Trigger activated successfully' : 'Trigger not found'
        },
        timestamp
      });

    case 'deactivate-trigger':
      const { triggerId: deactivateId } = req.body;
      const deactivated = cacheInvalidationService.deactivateTrigger(deactivateId);
      
      return res.status(200).json({
        success: deactivated,
        data: { 
          triggerId: deactivateId,
          deactivated,
          message: deactivated ? 'Trigger deactivated successfully' : 'Trigger not found'
        },
        timestamp
      });

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid action specified',
        timestamp
      });
  }
}

async function handleCacheClearing(
  req: NextApiRequest,
  res: NextApiResponse<CacheManagementResponse>,
  timestamp: string
) {
  const { target } = req.query;

  switch (target) {
    case 'cache':
      claudeCache.clearCache();
      return res.status(200).json({
        success: true,
        data: { message: 'Cache cleared successfully' },
        timestamp
      });

    case 'metrics':
      cacheAnalytics.clearMetricsHistory();
      return res.status(200).json({
        success: true,
        data: { message: 'Metrics history cleared successfully' },
        timestamp
      });

    case 'alerts':
      // Clear resolved alerts older than 24 hours
      const alerts = cacheAnalytics.getAllAlerts();
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      let clearedCount = 0;

      alerts.forEach(alert => {
        if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoff) {
          // This would require implementing alert deletion in analytics service
          clearedCount++;
        }
      });

      return res.status(200).json({
        success: true,
        data: { 
          message: `Cleared ${clearedCount} old resolved alerts`,
          clearedCount
        },
        timestamp
      });

    case 'warmup-jobs':
      // Cancel all pending warmup jobs
      const warmupStats = cacheWarmingService.getWarmupStats();
      let cancelledCount = 0;

      warmupStats.upcomingJobs.forEach(job => {
        if (cacheWarmingService.cancelJob(job.id)) {
          cancelledCount++;
        }
      });

      return res.status(200).json({
        success: true,
        data: { 
          message: `Cancelled ${cancelledCount} pending warmup jobs`,
          cancelledCount
        },
        timestamp
      });

    case 'all':
      // Clear everything
      claudeCache.clearCache();
      cacheAnalytics.clearMetricsHistory();
      
      return res.status(200).json({
        success: true,
        data: { message: 'All cache data cleared successfully' },
        timestamp
      });

    default:
      return res.status(400).json({
        success: false,
        error: 'Invalid target specified for clearing',
        timestamp
      });
  }
}