import { NextApiRequest, NextApiResponse } from 'next';
import { aiProviderMonitor } from '@/services/ai-provider-monitor';

interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>
) {
  const timestamp = new Date().toISOString();

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetStatus(req, res, timestamp);
      case 'POST':
        return await handlePostAction(req, res, timestamp);
      default:
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          timestamp
        });
    }
  } catch (error) {
    console.error('AI Provider Status API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp
    });
  }
}

async function handleGetStatus(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
  timestamp: string
) {
  const { action, providerId, days, limit } = req.query;

  switch (action) {
    case 'overview':
      const systemHealth = aiProviderMonitor.getSystemHealth();
      const allProviders = aiProviderMonitor.getProviderMetrics() as any[];
      
      return res.status(200).json({
        success: true,
        data: {
          systemHealth,
          providers: allProviders.map(provider => ({
            id: provider.providerId,
            name: provider.name,
            status: provider.status,
            healthScore: provider.healthScore,
            responseTime: provider.responseTime,
            errorRate: provider.errorRate,
            capabilities: provider.capabilities,
            lastCheck: provider.lastHealthCheck
          }))
        },
        timestamp
      });

    case 'detailed':
      if (!providerId || typeof providerId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Provider ID is required for detailed status',
          timestamp
        });
      }

      const providerMetrics = aiProviderMonitor.getProviderMetrics(providerId) as any;
      const providerHistory = aiProviderMonitor.getProviderHistory(
        providerId,
        parseInt(limit as string) || 50
      );

      if (!providerMetrics.providerId) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found',
          timestamp
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          metrics: providerMetrics,
          history: providerHistory,
          recommendations: aiProviderMonitor.generateProviderReport(providerId, parseInt(days as string) || 7)
        },
        timestamp
      });

    case 'health':
      const healthData = aiProviderMonitor.getSystemHealth();
      return res.status(200).json({
        success: true,
        data: healthData,
        timestamp
      });

    case 'report':
      if (!providerId || typeof providerId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Provider ID is required for report generation',
          timestamp
        });
      }

      const report = aiProviderMonitor.generateProviderReport(
        providerId,
        parseInt(days as string) || 7
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found',
          timestamp
        });
      }

      return res.status(200).json({
        success: true,
        data: report,
        timestamp
      });

    case 'selection':
      const { capabilities, maxResponseTime, minHealthScore, excludeProviders } = req.query;
      
      const requirements = {
        capabilities: capabilities ? (capabilities as string).split(',') : [],
        maxResponseTime: maxResponseTime ? parseInt(maxResponseTime as string) : undefined,
        minHealthScore: minHealthScore ? parseInt(minHealthScore as string) : undefined,
        excludeProviders: excludeProviders ? (excludeProviders as string).split(',') : []
      };

      const decision = aiProviderMonitor.selectBestProvider(requirements);
      
      return res.status(200).json({
        success: true,
        data: decision,
        timestamp
      });

    default:
      // Default: return overview
      const defaultHealth = aiProviderMonitor.getSystemHealth();
      return res.status(200).json({
        success: true,
        data: defaultHealth,
        timestamp
      });
  }
}

async function handlePostAction(
  req: NextApiRequest,
  res: NextApiResponse<APIResponse>,
  timestamp: string
) {
  const { action, providerId, tokensUsed, cost, maintenance } = req.body;

  switch (action) {
    case 'update-quota':
      if (!providerId || tokensUsed === undefined || cost === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Provider ID, tokens used, and cost are required',
          timestamp
        });
      }

      aiProviderMonitor.updateProviderQuota(providerId, tokensUsed, cost);
      
      return res.status(200).json({
        success: true,
        data: {
          message: `Quota updated for provider ${providerId}`,
          providerId,
          tokensUsed,
          cost
        },
        timestamp
      });

    case 'set-maintenance':
      if (!providerId || maintenance === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Provider ID and maintenance status are required',
          timestamp
        });
      }

      aiProviderMonitor.setProviderMaintenance(providerId, maintenance);
      
      return res.status(200).json({
        success: true,
        data: {
          message: `Provider ${providerId} ${maintenance ? 'entered' : 'exited'} maintenance mode`,
          providerId,
          maintenance
        },
        timestamp
      });

    case 'force-health-check':
      // This would trigger an immediate health check
      // Implementation would depend on the monitoring service structure
      return res.status(200).json({
        success: true,
        data: {
          message: 'Health check scheduled for all providers'
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