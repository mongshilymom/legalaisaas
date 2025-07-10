import { NextApiRequest, NextApiResponse } from 'next';
import { claudeCache } from '@/services/claude-cache';
import { cacheAnalytics } from '@/services/cache-analytics';
import { strategyLogService } from '@/services/strategy-log-service';
import { sanitizeInput } from '@/utils/sanitizeInput';

interface AIProvider {
  name: 'claude' | 'perplexity' | 'gemini' | 'openai';
  endpoint: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastHealthCheck: Date;
  responseTime: number;
  errorRate: number;
  priority: number;
}

interface StrategyRequest {
  userId: string;
  contractId: string;
  contractText: string;
  summary: string;
  riskPoints: string[];
  mode?: 'auto' | 'claude' | 'perplexity' | 'gemini' | 'openai';
  priority?: 'low' | 'medium' | 'high';
  useCache?: boolean;
  fallbackEnabled?: boolean;
  language?: string;
  jurisdiction?: string;
}

interface StrategyResponse {
  success: boolean;
  data?: {
    result: any;
    provider: string;
    cached: boolean;
    responseTime: number;
    confidence: number;
    fallbackUsed?: boolean;
    alternatives?: string[];
  };
  error?: string;
  timestamp: string;
}

class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private healthCheckInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeProviders();
    this.startHealthMonitoring();
  }

  private initializeProviders(): void {
    const defaultProviders: AIProvider[] = [
      {
        name: 'claude',
        endpoint: '/api/claude/strategic-report',
        status: 'healthy',
        lastHealthCheck: new Date(),
        responseTime: 1500,
        errorRate: 0,
        priority: 1
      },
      {
        name: 'perplexity',
        endpoint: '/lib/ai/callPerplexity',
        status: 'healthy',
        lastHealthCheck: new Date(),
        responseTime: 2000,
        errorRate: 0,
        priority: 2
      },
      {
        name: 'gemini',
        endpoint: '/lib/ai/callGemini',
        status: 'healthy',
        lastHealthCheck: new Date(),
        responseTime: 1800,
        errorRate: 0,
        priority: 3
      },
      {
        name: 'openai',
        endpoint: '/lib/ai/callOpenAI',
        status: 'healthy',
        lastHealthCheck: new Date(),
        responseTime: 2200,
        errorRate: 0,
        priority: 4
      }
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.name, provider);
    });
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    for (const [name, provider] of this.providers.entries()) {
      try {
        const startTime = Date.now();
        
        // Perform lightweight health check
        const isHealthy = await this.checkProviderHealth(provider);
        const responseTime = Date.now() - startTime;

        provider.responseTime = responseTime;
        provider.lastHealthCheck = new Date();
        provider.status = isHealthy ? 'healthy' : 'degraded';
        
        if (responseTime > 5000) {
          provider.status = 'degraded';
        }

        console.log(`Health check ${name}: ${provider.status} (${responseTime}ms)`);
      } catch (error) {
        provider.status = 'failed';
        provider.errorRate = Math.min(provider.errorRate + 0.1, 1.0);
        console.error(`Health check failed for ${name}:`, error);
      }
    }
  }

  private async checkProviderHealth(provider: AIProvider): Promise<boolean> {
    // Implement actual health check logic here
    // For now, simulate health check
    return Math.random() > 0.1; // 90% uptime simulation
  }

  getBestProvider(excludeProviders: string[] = []): AIProvider | null {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => 
        provider.status === 'healthy' && 
        !excludeProviders.includes(provider.name)
      )
      .sort((a, b) => {
        // Sort by priority first, then by response time
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.responseTime - b.responseTime;
      });

    return availableProviders[0] || null;
  }

  getProviderByName(name: string): AIProvider | null {
    return this.providers.get(name) || null;
  }

  updateProviderStatus(name: string, status: AIProvider['status'], responseTime?: number): void {
    const provider = this.providers.get(name);
    if (provider) {
      provider.status = status;
      if (responseTime !== undefined) {
        provider.responseTime = responseTime;
      }
      provider.lastHealthCheck = new Date();
    }
  }

  getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, provider] of this.providers.entries()) {
      stats[name] = {
        status: provider.status,
        responseTime: provider.responseTime,
        errorRate: provider.errorRate,
        lastCheck: provider.lastHealthCheck,
        priority: provider.priority
      };
    }

    return stats;
  }
}

const aiProviderManager = new AIProviderManager();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StrategyResponse>
) {
  const timestamp = new Date().toISOString();

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp
    });
  }

  try {
    const {
      userId,
      contractId,
      contractText,
      summary,
      riskPoints,
      mode = 'auto',
      priority = 'medium',
      useCache = true,
      fallbackEnabled = true,
      language = 'ko',
      jurisdiction
    }: StrategyRequest = req.body;

    // Validate required fields
    if (!userId || !contractId || !contractText || !summary || !riskPoints) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        timestamp
      });
    }

    // Sanitize inputs
    const sanitizedUserId = sanitizeInput(userId);
    const sanitizedContractId = sanitizeInput(contractId);
    const sanitizedSummary = sanitizeInput(summary);
    const sanitizedRiskPoints = riskPoints.map(risk => sanitizeInput(risk));

    const startTime = Date.now();
    let result: any;
    let providerUsed: string;
    let cached = false;
    let fallbackUsed = false;
    let confidence = 0;
    let alternatives: string[] = [];

    // Determine AI provider to use
    let targetProvider: AIProvider | null;
    
    if (mode === 'auto') {
      targetProvider = aiProviderManager.getBestProvider();
      if (!targetProvider) {
        return res.status(503).json({
          success: false,
          error: 'No healthy AI providers available',
          timestamp
        });
      }
    } else {
      targetProvider = aiProviderManager.getProviderByName(mode);
      if (!targetProvider || targetProvider.status === 'failed') {
        if (fallbackEnabled) {
          targetProvider = aiProviderManager.getBestProvider([mode]);
          fallbackUsed = true;
        } else {
          return res.status(503).json({
            success: false,
            error: `Selected AI provider '${mode}' is not available`,
            timestamp
          });
        }
      }
    }

    if (!targetProvider) {
      return res.status(503).json({
        success: false,
        error: 'No available AI providers',
        timestamp
      });
    }

    providerUsed = targetProvider.name;

    // Try to get cached result first
    if (useCache) {
      try {
        const cacheKey = generateCacheKey(sanitizedSummary, sanitizedRiskPoints, language, jurisdiction);
        const cachedResult = await claudeCache.get(
          cacheKey,
          `You are a legal strategist analyzing ${language} contracts for ${jurisdiction || 'general'} jurisdiction.`,
          {
            requestType: 'strategic-report',
            contractType: 'general',
            language,
            jurisdiction,
            userId: sanitizedUserId
          }
        );

        if (cachedResult) {
          cached = true;
          result = JSON.parse(cachedResult.content);
          confidence = 95; // High confidence for cached results
        }
      } catch (cacheError) {
        console.warn('Cache lookup failed, proceeding with AI call:', cacheError);
      }
    }

    // If not cached, call AI provider
    if (!cached) {
      try {
        const providerResult = await callAIProvider(targetProvider, {
          userId: sanitizedUserId,
          contractId: sanitizedContractId,
          contractText,
          summary: sanitizedSummary,
          riskPoints: sanitizedRiskPoints,
          language,
          jurisdiction
        });

        result = providerResult.result;
        confidence = providerResult.confidence || 85;

        // Update provider performance metrics
        const responseTime = Date.now() - startTime;
        aiProviderManager.updateProviderStatus(
          targetProvider.name,
          'healthy',
          responseTime
        );

        // Cache the result if successful
        if (useCache && result) {
          try {
            const cacheKey = generateCacheKey(sanitizedSummary, sanitizedRiskPoints, language, jurisdiction);
            await claudeCache.set(
              cacheKey,
              {
                content: JSON.stringify(result),
                model: targetProvider.name,
                usage: { input_tokens: 0, output_tokens: 0 }
              },
              `You are a legal strategist analyzing ${language} contracts for ${jurisdiction || 'general'} jurisdiction.`,
              {
                requestType: 'strategic-report',
                contractType: 'general',
                language,
                jurisdiction,
                userId: sanitizedUserId
              },
              24 * 60 * 60 * 1000 // 24 hours TTL
            );
          } catch (cacheError) {
            console.warn('Failed to cache result:', cacheError);
          }
        }

      } catch (providerError) {
        console.error(`Provider ${targetProvider.name} failed:`, providerError);
        
        // Update provider status
        aiProviderManager.updateProviderStatus(targetProvider.name, 'failed');

        // Try fallback if enabled
        if (fallbackEnabled && !fallbackUsed) {
          const fallbackProvider = aiProviderManager.getBestProvider([targetProvider.name]);
          
          if (fallbackProvider) {
            try {
              const fallbackResult = await callAIProvider(fallbackProvider, {
                userId: sanitizedUserId,
                contractId: sanitizedContractId,
                contractText,
                summary: sanitizedSummary,
                riskPoints: sanitizedRiskPoints,
                language,
                jurisdiction
              });

              result = fallbackResult.result;
              confidence = (fallbackResult.confidence || 85) * 0.9; // Slightly lower confidence for fallback
              providerUsed = fallbackProvider.name;
              fallbackUsed = true;

            } catch (fallbackError) {
              console.error('Fallback provider also failed:', fallbackError);
              throw new Error('All AI providers failed');
            }
          } else {
            throw new Error('No fallback providers available');
          }
        } else {
          throw providerError;
        }
      }
    }

    // Log the strategy generation
    try {
      await strategyLogService.createLog({
        userId: sanitizedUserId,
        analysisRequestId: sanitizedContractId,
        strategyType: 'strategic-report',
        strategySummary: typeof result === 'object' ? result.summary || 'Strategic analysis completed' : 'Strategic analysis completed',
        fullReport: result,
        confidence,
        language,
        jurisdiction,
        tags: [providerUsed, cached ? 'cached' : 'fresh', priority],
        metadata: {
          contractType: 'general',
          processingTime: Date.now() - startTime,
          provider: providerUsed,
          cached,
          fallbackUsed
        }
      });
    } catch (logError) {
      console.warn('Failed to log strategy:', logError);
    }

    // Get alternative providers for recommendation
    const availableProviders = Array.from(aiProviderManager.getProviderStats().keys())
      .filter(name => name !== providerUsed);
    alternatives = availableProviders.slice(0, 2);

    const responseTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      data: {
        result,
        provider: providerUsed,
        cached,
        responseTime,
        confidence,
        fallbackUsed,
        alternatives
      },
      timestamp
    });

  } catch (error) {
    console.error('❌ AI 라우팅 오류:', error);
    
    // Log error analytics
    cacheAnalytics.getMetrics(1); // Trigger error tracking
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI 전략 분석 중 오류 발생',
      timestamp
    });
  }
}

async function callAIProvider(
  provider: AIProvider,
  params: {
    userId: string;
    contractId: string;
    contractText: string;
    summary: string;
    riskPoints: string[];
    language: string;
    jurisdiction?: string;
  }
): Promise<{ result: any; confidence?: number }> {
  switch (provider.name) {
    case 'claude':
      return await callClaudeStrategicReport(params);
    
    case 'perplexity':
      const { callPerplexityReport } = await import('@/lib/ai/callPerplexity');
      const perplexityResult = await callPerplexityReport(params.contractText);
      return { result: perplexityResult, confidence: 80 };
    
    case 'gemini':
      const { callGeminiSummary } = await import('@/lib/ai/callGemini');
      const geminiResult = await callGeminiSummary(params.contractText);
      return { result: geminiResult, confidence: 75 };
    
    case 'openai':
      const { callOpenAIAnalysis } = await import('@/lib/ai/callOpenAI');
      const openaiResult = await callOpenAIAnalysis(params);
      return { result: openaiResult, confidence: 82 };
    
    default:
      throw new Error(`Unknown AI provider: ${provider.name}`);
  }
}

async function callClaudeStrategicReport(params: {
  userId: string;
  contractId: string;
  summary: string;
  riskPoints: string[];
  language: string;
  jurisdiction?: string;
}): Promise<{ result: any; confidence: number }> {
  // Use the existing Claude strategic report endpoint
  const response = await fetch('/api/claude/strategic-report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contractSummary: params.summary,
      analysisResults: `위험 요소: ${params.riskPoints.join(', ')}`,
      userSelectedRisks: params.riskPoints,
      contractType: 'general',
      userPlan: 'Professional',
      language: params.language,
      userId: params.userId
    })
  });

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Claude API failed');
  }

  return {
    result: result.data.strategicReport,
    confidence: result.data.confidence
  };
}

function generateCacheKey(summary: string, riskPoints: string[], language: string, jurisdiction?: string): string {
  const content = {
    summary: summary.toLowerCase().trim(),
    risks: riskPoints.map(r => r.toLowerCase().trim()).sort().join(','),
    language,
    jurisdiction: jurisdiction || 'general'
  };
  
  return JSON.stringify(content);
}

// Export provider manager for external use
export { aiProviderManager };