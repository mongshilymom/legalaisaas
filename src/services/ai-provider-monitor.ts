import { claudeAPI } from '@/services/claude-api';
import { perplexityService } from '@/lib/ai/callPerplexity';
import { geminiService } from '@/lib/ai/callGemini';
import { openaiService } from '@/lib/ai/callOpenAI';

interface ProviderMetrics {
  providerId: string;
  name: string;
  status: 'healthy' | 'degraded' | 'failed' | 'maintenance';
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
  averageTokensPerRequest: number;
  costPerRequest: number;
  healthScore: number;
  capabilities: string[];
  limits: {
    maxTokens: number;
    rateLimit: number;
    dailyQuota: number;
    usedQuota: number;
  };
}

interface HealthCheckResult {
  providerId: string;
  success: boolean;
  responseTime: number;
  error?: string;
  timestamp: Date;
  metrics?: {
    tokensUsed: number;
    cost: number;
  };
}

interface LoadBalancingDecision {
  selectedProvider: string;
  reason: string;
  alternatives: string[];
  expectedResponseTime: number;
  confidence: number;
}

class AIProviderMonitor {
  private providers: Map<string, ProviderMetrics> = new Map();
  private healthCheckInterval = 5 * 60 * 1000; // 5 minutes
  private healthCheckHistory: Map<string, HealthCheckResult[]> = new Map();
  private maxHistorySize = 100;

  constructor() {
    this.initializeProviders();
    this.startHealthMonitoring();
    this.startPerformanceTracking();
  }

  private initializeProviders(): void {
    const initialProviders: ProviderMetrics[] = [
      {
        providerId: 'claude',
        name: 'Claude (Anthropic)',
        status: 'healthy',
        uptime: 99.9,
        responseTime: 1500,
        errorRate: 0.5,
        throughput: 45,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0,
        averageTokensPerRequest: 2500,
        costPerRequest: 0.015,
        healthScore: 95,
        capabilities: ['reasoning', 'analysis', 'multilingual', 'code'],
        limits: {
          maxTokens: 200000,
          rateLimit: 1000,
          dailyQuota: 100000,
          usedQuota: 0
        }
      },
      {
        providerId: 'perplexity',
        name: 'Perplexity',
        status: 'healthy',
        uptime: 99.5,
        responseTime: 2000,
        errorRate: 1.0,
        throughput: 35,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0,
        averageTokensPerRequest: 3000,
        costPerRequest: 0.020,
        healthScore: 88,
        capabilities: ['real-time', 'search', 'analysis', 'citations'],
        limits: {
          maxTokens: 128000,
          rateLimit: 600,
          dailyQuota: 50000,
          usedQuota: 0
        }
      },
      {
        providerId: 'gemini',
        name: 'Gemini (Google)',
        status: 'healthy',
        uptime: 99.7,
        responseTime: 1800,
        errorRate: 0.8,
        throughput: 40,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0,
        averageTokensPerRequest: 2800,
        costPerRequest: 0.012,
        healthScore: 92,
        capabilities: ['multimodal', 'long-context', 'reasoning', 'code'],
        limits: {
          maxTokens: 1048576,
          rateLimit: 1500,
          dailyQuota: 150000,
          usedQuota: 0
        }
      },
      {
        providerId: 'openai',
        name: 'OpenAI GPT-4',
        status: 'healthy',
        uptime: 99.8,
        responseTime: 2200,
        errorRate: 0.3,
        throughput: 50,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
        totalRequests: 0,
        successfulRequests: 0,
        averageTokensPerRequest: 3200,
        costPerRequest: 0.030,
        healthScore: 94,
        capabilities: ['reasoning', 'analysis', 'code', 'creativity'],
        limits: {
          maxTokens: 128000,
          rateLimit: 500,
          dailyQuota: 75000,
          usedQuota: 0
        }
      }
    ];

    initialProviders.forEach(provider => {
      this.providers.set(provider.providerId, provider);
      this.healthCheckHistory.set(provider.providerId, []);
    });
  }

  private startHealthMonitoring(): void {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.healthCheckInterval);

    // Immediate health check
    this.performHealthChecks();
  }

  private startPerformanceTracking(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.providers.keys()).map(providerId => 
      this.performSingleHealthCheck(providerId)
    );

    const results = await Promise.allSettled(healthCheckPromises);
    
    results.forEach((result, index) => {
      const providerId = Array.from(this.providers.keys())[index];
      const provider = this.providers.get(providerId);
      
      if (!provider) return;

      if (result.status === 'fulfilled') {
        this.processHealthCheckResult(result.value);
      } else {
        this.handleHealthCheckFailure(providerId, result.reason);
      }
    });
  }

  private async performSingleHealthCheck(providerId: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      let success = false;
      let tokensUsed = 0;
      let cost = 0;

      switch (providerId) {
        case 'claude':
          success = await claudeAPI.validateConnection();
          break;
        case 'perplexity':
          success = await perplexityService.healthCheck();
          break;
        case 'gemini':
          success = await geminiService.healthCheck();
          break;
        case 'openai':
          success = await openaiService.healthCheck();
          break;
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }

      const responseTime = Date.now() - startTime;
      
      return {
        providerId,
        success,
        responseTime,
        timestamp: new Date(),
        metrics: {
          tokensUsed,
          cost
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        providerId,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  private processHealthCheckResult(result: HealthCheckResult): void {
    const provider = this.providers.get(result.providerId);
    if (!provider) return;

    // Update provider metrics
    provider.responseTime = this.calculateMovingAverage(
      provider.responseTime,
      result.responseTime,
      0.3
    );
    provider.lastHealthCheck = result.timestamp;

    if (result.success) {
      provider.consecutiveFailures = 0;
      provider.status = this.determineProviderStatus(provider);
    } else {
      provider.consecutiveFailures++;
      provider.status = provider.consecutiveFailures > 3 ? 'failed' : 'degraded';
    }

    // Update health score
    provider.healthScore = this.calculateHealthScore(provider);

    // Store health check history
    this.storeHealthCheckHistory(result);

    console.log(`Health check ${result.providerId}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.responseTime}ms)`);
  }

  private handleHealthCheckFailure(providerId: string, error: any): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    provider.consecutiveFailures++;
    provider.status = 'failed';
    provider.lastHealthCheck = new Date();
    provider.healthScore = Math.max(0, provider.healthScore - 20);

    console.error(`Health check failed for ${providerId}:`, error);
  }

  private determineProviderStatus(provider: ProviderMetrics): 'healthy' | 'degraded' | 'failed' {
    if (provider.responseTime > 5000) return 'degraded';
    if (provider.errorRate > 10) return 'degraded';
    if (provider.healthScore < 50) return 'failed';
    if (provider.healthScore < 80) return 'degraded';
    return 'healthy';
  }

  private calculateHealthScore(provider: ProviderMetrics): number {
    let score = 100;

    // Response time factor (max 30 points deduction)
    const responseTimePenalty = Math.min(30, (provider.responseTime / 1000) * 5);
    score -= responseTimePenalty;

    // Error rate factor (max 40 points deduction)
    const errorRatePenalty = Math.min(40, provider.errorRate * 4);
    score -= errorRatePenalty;

    // Consecutive failures factor (max 20 points deduction)
    const failurePenalty = Math.min(20, provider.consecutiveFailures * 5);
    score -= failurePenalty;

    // Uptime factor (max 10 points deduction)
    const uptimePenalty = Math.max(0, (100 - provider.uptime) * 0.1);
    score -= uptimePenalty;

    return Math.max(0, Math.round(score));
  }

  private calculateMovingAverage(current: number, newValue: number, weight: number): number {
    return (current * (1 - weight)) + (newValue * weight);
  }

  private storeHealthCheckHistory(result: HealthCheckResult): void {
    const history = this.healthCheckHistory.get(result.providerId) || [];
    history.push(result);
    
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
    
    this.healthCheckHistory.set(result.providerId, history);
  }

  private updatePerformanceMetrics(): void {
    for (const [providerId, provider] of this.providers.entries()) {
      const history = this.healthCheckHistory.get(providerId) || [];
      
      if (history.length === 0) continue;

      const recentHistory = history.slice(-20); // Last 20 checks
      const successCount = recentHistory.filter(h => h.success).length;
      const totalCount = recentHistory.length;

      provider.uptime = (successCount / totalCount) * 100;
      provider.errorRate = ((totalCount - successCount) / totalCount) * 100;
      
      // Update throughput based on successful requests
      const recentSuccessful = recentHistory.filter(h => h.success);
      if (recentSuccessful.length > 0) {
        const avgResponseTime = recentSuccessful.reduce((sum, h) => sum + h.responseTime, 0) / recentSuccessful.length;
        provider.throughput = Math.round(60000 / avgResponseTime); // Requests per minute
      }
    }
  }

  // Public methods for load balancing
  selectBestProvider(
    requirements: {
      capabilities?: string[];
      maxResponseTime?: number;
      minHealthScore?: number;
      excludeProviders?: string[];
    } = {}
  ): LoadBalancingDecision {
    const {
      capabilities = [],
      maxResponseTime = 5000,
      minHealthScore = 70,
      excludeProviders = []
    } = requirements;

    // Filter providers based on requirements
    const eligibleProviders = Array.from(this.providers.values())
      .filter(provider => {
        if (excludeProviders.includes(provider.providerId)) return false;
        if (provider.status === 'failed') return false;
        if (provider.responseTime > maxResponseTime) return false;
        if (provider.healthScore < minHealthScore) return false;
        if (capabilities.length > 0) {
          const hasRequiredCapabilities = capabilities.every(cap => 
            provider.capabilities.includes(cap)
          );
          if (!hasRequiredCapabilities) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by composite score: health score + response time + cost
        const scoreA = this.calculateProviderScore(a);
        const scoreB = this.calculateProviderScore(b);
        return scoreB - scoreA;
      });

    if (eligibleProviders.length === 0) {
      return {
        selectedProvider: 'none',
        reason: 'No providers meet the requirements',
        alternatives: [],
        expectedResponseTime: 0,
        confidence: 0
      };
    }

    const selectedProvider = eligibleProviders[0];
    const alternatives = eligibleProviders.slice(1, 3).map(p => p.providerId);

    return {
      selectedProvider: selectedProvider.providerId,
      reason: `Best overall score: ${this.calculateProviderScore(selectedProvider)}`,
      alternatives,
      expectedResponseTime: selectedProvider.responseTime,
      confidence: selectedProvider.healthScore
    };
  }

  private calculateProviderScore(provider: ProviderMetrics): number {
    // Composite score based on health, performance, and cost
    const healthFactor = provider.healthScore * 0.4;
    const performanceFactor = (5000 - provider.responseTime) / 50 * 0.3; // Response time factor
    const costFactor = (0.1 - provider.costPerRequest) * 1000 * 0.2; // Cost factor
    const uptimeFactor = provider.uptime * 0.1;

    return Math.round(healthFactor + performanceFactor + costFactor + uptimeFactor);
  }

  // Provider management methods
  getProviderMetrics(providerId?: string): ProviderMetrics | ProviderMetrics[] {
    if (providerId) {
      return this.providers.get(providerId) || {} as ProviderMetrics;
    }
    return Array.from(this.providers.values());
  }

  getProviderHistory(providerId: string, limit: number = 50): HealthCheckResult[] {
    const history = this.healthCheckHistory.get(providerId) || [];
    return history.slice(-limit);
  }

  updateProviderQuota(providerId: string, tokensUsed: number, cost: number): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    provider.totalRequests++;
    provider.limits.usedQuota += tokensUsed;
    provider.successfulRequests++;
    
    // Update moving averages
    provider.averageTokensPerRequest = this.calculateMovingAverage(
      provider.averageTokensPerRequest,
      tokensUsed,
      0.1
    );
    
    provider.costPerRequest = this.calculateMovingAverage(
      provider.costPerRequest,
      cost,
      0.1
    );
  }

  setProviderMaintenance(providerId: string, inMaintenance: boolean): void {
    const provider = this.providers.get(providerId);
    if (!provider) return;

    provider.status = inMaintenance ? 'maintenance' : 'healthy';
    console.log(`Provider ${providerId} ${inMaintenance ? 'entered' : 'exited'} maintenance mode`);
  }

  getSystemHealth(): {
    overallHealth: number;
    availableProviders: number;
    totalProviders: number;
    averageResponseTime: number;
    aggregatedThroughput: number;
    topProvider: string;
  } {
    const allProviders = Array.from(this.providers.values());
    const healthyProviders = allProviders.filter(p => p.status === 'healthy');
    
    const overallHealth = allProviders.reduce((sum, p) => sum + p.healthScore, 0) / allProviders.length;
    const averageResponseTime = allProviders.reduce((sum, p) => sum + p.responseTime, 0) / allProviders.length;
    const aggregatedThroughput = allProviders.reduce((sum, p) => sum + p.throughput, 0);
    
    const topProvider = allProviders.sort((a, b) => b.healthScore - a.healthScore)[0]?.providerId || 'none';

    return {
      overallHealth: Math.round(overallHealth),
      availableProviders: healthyProviders.length,
      totalProviders: allProviders.length,
      averageResponseTime: Math.round(averageResponseTime),
      aggregatedThroughput: Math.round(aggregatedThroughput),
      topProvider
    };
  }

  // Analytics and reporting
  generateProviderReport(providerId: string, days: number = 7): any {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    const history = this.healthCheckHistory.get(providerId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentHistory = history.filter(h => h.timestamp > cutoffDate);

    const successCount = recentHistory.filter(h => h.success).length;
    const totalCount = recentHistory.length;
    const uptime = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    const responseTimes = recentHistory.map(h => h.responseTime);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
      : 0;

    return {
      providerId,
      name: provider.name,
      period: `${days} days`,
      metrics: {
        currentStatus: provider.status,
        healthScore: provider.healthScore,
        uptime: Math.round(uptime * 100) / 100,
        averageResponseTime: Math.round(avgResponseTime),
        totalRequests: provider.totalRequests,
        successRate: Math.round((provider.successfulRequests / provider.totalRequests) * 100) || 0,
        quotaUsage: Math.round((provider.limits.usedQuota / provider.limits.dailyQuota) * 100) || 0
      },
      trends: {
        healthTrend: this.calculateTrend(recentHistory, 'success'),
        responseTrend: this.calculateTrend(recentHistory, 'responseTime')
      },
      recommendations: this.generateProviderRecommendations(provider, recentHistory)
    };
  }

  private calculateTrend(history: HealthCheckResult[], metric: keyof HealthCheckResult): 'improving' | 'stable' | 'degrading' {
    if (history.length < 10) return 'stable';

    const firstHalf = history.slice(0, Math.floor(history.length / 2));
    const secondHalf = history.slice(Math.floor(history.length / 2));

    let firstValue: number, secondValue: number;

    if (metric === 'success') {
      firstValue = firstHalf.filter(h => h.success).length / firstHalf.length;
      secondValue = secondHalf.filter(h => h.success).length / secondHalf.length;
    } else {
      firstValue = firstHalf.reduce((sum, h) => sum + (h.responseTime || 0), 0) / firstHalf.length;
      secondValue = secondHalf.reduce((sum, h) => sum + (h.responseTime || 0), 0) / secondHalf.length;
    }

    const threshold = metric === 'success' ? 0.05 : 200; // 5% for success rate, 200ms for response time
    const difference = secondValue - firstValue;

    if (metric === 'success') {
      return Math.abs(difference) < threshold ? 'stable' : (difference > 0 ? 'improving' : 'degrading');
    } else {
      return Math.abs(difference) < threshold ? 'stable' : (difference < 0 ? 'improving' : 'degrading');
    }
  }

  private generateProviderRecommendations(provider: ProviderMetrics, history: HealthCheckResult[]): string[] {
    const recommendations: string[] = [];

    if (provider.healthScore < 80) {
      recommendations.push('Consider reducing load on this provider');
    }

    if (provider.responseTime > 3000) {
      recommendations.push('Monitor response time - consider optimizing requests');
    }

    if (provider.limits.usedQuota > provider.limits.dailyQuota * 0.8) {
      recommendations.push('Approaching quota limit - consider upgrading or load balancing');
    }

    if (provider.consecutiveFailures > 0) {
      recommendations.push('Recent failures detected - monitor closely');
    }

    return recommendations;
  }
}

export const aiProviderMonitor = new AIProviderMonitor();
export type { ProviderMetrics, HealthCheckResult, LoadBalancingDecision };
export default AIProviderMonitor;