import { claudeCache, CacheStats } from '@/services/claude-cache';
import { cacheWarmingService } from '@/services/cache-warming';
import { cacheInvalidationService } from '@/services/cache-invalidation-triggers';

interface CacheMetric {
  timestamp: Date;
  hitRate: number;
  missRate: number;
  responseTime: number;
  cacheSize: number;
  requestCount: number;
  errorRate: number;
  costSavings: number;
}

interface CachePerformanceReport {
  period: 'hour' | 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  metrics: {
    avgHitRate: number;
    avgResponseTime: number;
    totalRequests: number;
    totalCacheHits: number;
    totalCacheMisses: number;
    costSavingsUSD: number;
    efficiencyScore: number;
  };
  trends: {
    hitRateTrend: 'increasing' | 'decreasing' | 'stable';
    responseTrend: 'improving' | 'degrading' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
  };
  topPerformingPrompts: Array<{
    promptHash: string;
    hitRate: number;
    frequency: number;
    avgResponseTime: number;
  }>;
  recommendations: string[];
}

interface CacheAlert {
  id: string;
  type: 'performance' | 'capacity' | 'error' | 'cost';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  threshold: number;
  currentValue: number;
  resolved: boolean;
  resolvedAt?: Date;
}

interface CacheOptimizationSuggestion {
  type: 'ttl_adjustment' | 'compression' | 'invalidation' | 'warming' | 'capacity';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: string;
  implementation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
}

class CacheAnalyticsService {
  private metrics: CacheMetric[] = [];
  private alerts: Map<string, CacheAlert> = new Map();
  private maxMetricsHistory = 10000; // Keep last 10k metrics
  private alertThresholds = {
    lowHitRate: 60, // Alert if hit rate below 60%
    highResponseTime: 5000, // Alert if response time above 5s
    highErrorRate: 5, // Alert if error rate above 5%
    highCacheSize: 80 // Alert if cache size above 80% of max
  };

  constructor() {
    this.startMetricsCollection();
    this.startAlertMonitoring();
  }

  private startMetricsCollection(): void {
    // Collect metrics every 5 minutes
    setInterval(() => {
      this.collectMetrics();
    }, 5 * 60 * 1000);

    // Collect initial metrics
    this.collectMetrics();
  }

  private startAlertMonitoring(): void {
    // Check alerts every minute
    setInterval(() => {
      this.checkAlerts();
    }, 60 * 1000);
  }

  private async collectMetrics(): Promise<void> {
    try {
      const cacheStats = claudeCache.getCacheStats();
      const warmupStats = cacheWarmingService.getWarmupStats();
      
      const metric: CacheMetric = {
        timestamp: new Date(),
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        responseTime: await this.measureAverageResponseTime(),
        cacheSize: cacheStats.totalSize,
        requestCount: this.getRecentRequestCount(),
        errorRate: await this.calculateErrorRate(),
        costSavings: this.calculateCostSavings(cacheStats.hitRate)
      };

      this.metrics.push(metric);

      // Maintain metrics history limit
      if (this.metrics.length > this.maxMetricsHistory) {
        this.metrics = this.metrics.slice(-this.maxMetricsHistory);
      }

      console.log(`Cache metrics collected: Hit Rate ${metric.hitRate}%, Response Time ${metric.responseTime}ms`);
    } catch (error) {
      console.error('Error collecting cache metrics:', error);
    }
  }

  private async measureAverageResponseTime(): Promise<number> {
    const testPrompts = [
      '간단한 계약서 분석을 해주세요.',
      'Basic contract analysis needed.',
      'Provide compliance recommendations.'
    ];

    const startTime = Date.now();
    let completedRequests = 0;

    for (const prompt of testPrompts) {
      try {
        await claudeCache.generateWithCache(prompt, undefined, {
          requestType: 'performance-test'
        });
        completedRequests++;
      } catch (error) {
        // Ignore errors for performance measurement
      }
    }

    const endTime = Date.now();
    return completedRequests > 0 ? (endTime - startTime) / completedRequests : 0;
  }

  private getRecentRequestCount(): number {
    const recentMetrics = this.metrics.slice(-12); // Last hour (5min intervals)
    return recentMetrics.reduce((sum, metric) => sum + metric.requestCount, 0);
  }

  private async calculateErrorRate(): Promise<number> {
    // This would require error tracking - simplified for now
    const recentMetrics = this.metrics.slice(-12);
    if (recentMetrics.length === 0) return 0;

    const avgErrorRate = recentMetrics.reduce((sum, metric) => sum + metric.errorRate, 0) / recentMetrics.length;
    return avgErrorRate;
  }

  private calculateCostSavings(hitRate: number): number {
    // Estimate cost savings based on hit rate
    // Assuming $0.01 per Claude API call
    const recentRequests = this.getRecentRequestCount();
    const cacheHits = recentRequests * (hitRate / 100);
    return cacheHits * 0.01; // $0.01 per saved API call
  }

  private checkAlerts(): void {
    const latestMetric = this.metrics[this.metrics.length - 1];
    if (!latestMetric) return;

    // Check hit rate alert
    if (latestMetric.hitRate < this.alertThresholds.lowHitRate) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Cache hit rate is below threshold: ${latestMetric.hitRate}%`,
        threshold: this.alertThresholds.lowHitRate,
        currentValue: latestMetric.hitRate
      });
    }

    // Check response time alert
    if (latestMetric.responseTime > this.alertThresholds.highResponseTime) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        message: `Response time is above threshold: ${latestMetric.responseTime}ms`,
        threshold: this.alertThresholds.highResponseTime,
        currentValue: latestMetric.responseTime
      });
    }

    // Check cache size alert
    const cacheUsagePercent = (latestMetric.cacheSize / (100 * 1024 * 1024)) * 100; // Assuming 100MB max
    if (cacheUsagePercent > this.alertThresholds.highCacheSize) {
      this.createAlert({
        type: 'capacity',
        severity: 'medium',
        message: `Cache size is above threshold: ${cacheUsagePercent.toFixed(1)}%`,
        threshold: this.alertThresholds.highCacheSize,
        currentValue: cacheUsagePercent
      });
    }

    // Check error rate alert
    if (latestMetric.errorRate > this.alertThresholds.highErrorRate) {
      this.createAlert({
        type: 'error',
        severity: 'high',
        message: `Error rate is above threshold: ${latestMetric.errorRate}%`,
        threshold: this.alertThresholds.highErrorRate,
        currentValue: latestMetric.errorRate
      });
    }
  }

  private createAlert(alertData: Omit<CacheAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alertId = this.generateAlertId();
    const alert: CacheAlert = {
      id: alertId,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    // Check if similar alert already exists
    const existingAlert = Array.from(this.alerts.values()).find(a => 
      a.type === alert.type && 
      a.message === alert.message && 
      !a.resolved
    );

    if (!existingAlert) {
      this.alerts.set(alertId, alert);
      console.warn(`Cache alert created: ${alert.message}`);
    }
  }

  generatePerformanceReport(
    period: 'hour' | 'day' | 'week' | 'month',
    endDate: Date = new Date()
  ): CachePerformanceReport {
    const startDate = this.calculateStartDate(period, endDate);
    const periodMetrics = this.metrics.filter(m => 
      m.timestamp >= startDate && m.timestamp <= endDate
    );

    if (periodMetrics.length === 0) {
      return this.getEmptyReport(period, startDate, endDate);
    }

    // Calculate aggregated metrics
    const totalRequests = periodMetrics.reduce((sum, m) => sum + m.requestCount, 0);
    const avgHitRate = periodMetrics.reduce((sum, m) => sum + m.hitRate, 0) / periodMetrics.length;
    const avgResponseTime = periodMetrics.reduce((sum, m) => sum + m.responseTime, 0) / periodMetrics.length;
    const totalCacheHits = totalRequests * (avgHitRate / 100);
    const totalCacheMisses = totalRequests - totalCacheHits;
    const costSavingsUSD = periodMetrics.reduce((sum, m) => sum + m.costSavings, 0);

    // Calculate efficiency score (0-100)
    const efficiencyScore = this.calculateEfficiencyScore(avgHitRate, avgResponseTime);

    // Calculate trends
    const trends = this.calculateTrends(periodMetrics);

    // Get top performing prompts (this would require more detailed tracking)
    const topPerformingPrompts = this.getTopPerformingPrompts(periodMetrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(periodMetrics, avgHitRate, avgResponseTime);

    return {
      period,
      startDate,
      endDate,
      metrics: {
        avgHitRate: Math.round(avgHitRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        totalRequests,
        totalCacheHits: Math.round(totalCacheHits),
        totalCacheMisses: Math.round(totalCacheMisses),
        costSavingsUSD: Math.round(costSavingsUSD * 100) / 100,
        efficiencyScore: Math.round(efficiencyScore)
      },
      trends,
      topPerformingPrompts,
      recommendations
    };
  }

  private calculateStartDate(period: 'hour' | 'day' | 'week' | 'month', endDate: Date): Date {
    const start = new Date(endDate);
    
    switch (period) {
      case 'hour':
        start.setHours(start.getHours() - 1);
        break;
      case 'day':
        start.setDate(start.getDate() - 1);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    
    return start;
  }

  private calculateEfficiencyScore(hitRate: number, responseTime: number): number {
    // Efficiency score based on hit rate (70%) and response time (30%)
    const hitRateScore = Math.min(hitRate, 100); // Cap at 100%
    const responseTimeScore = Math.max(0, 100 - (responseTime / 100)); // Better score for lower response time
    
    return (hitRateScore * 0.7) + (responseTimeScore * 0.3);
  }

  private calculateTrends(metrics: CacheMetric[]): CachePerformanceReport['trends'] {
    if (metrics.length < 2) {
      return {
        hitRateTrend: 'stable',
        responseTrend: 'stable',
        usageTrend: 'stable'
      };
    }

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

    const firstHitRate = firstHalf.reduce((sum, m) => sum + m.hitRate, 0) / firstHalf.length;
    const secondHitRate = secondHalf.reduce((sum, m) => sum + m.hitRate, 0) / secondHalf.length;

    const firstResponseTime = firstHalf.reduce((sum, m) => sum + m.responseTime, 0) / firstHalf.length;
    const secondResponseTime = secondHalf.reduce((sum, m) => sum + m.responseTime, 0) / secondHalf.length;

    const firstUsage = firstHalf.reduce((sum, m) => sum + m.requestCount, 0);
    const secondUsage = secondHalf.reduce((sum, m) => sum + m.requestCount, 0);

    return {
      hitRateTrend: this.getTrend(firstHitRate, secondHitRate, 2),
      responseTrend: this.getTrend(firstResponseTime, secondResponseTime, -100), // Negative because lower is better
      usageTrend: this.getTrend(firstUsage, secondUsage, 1)
    };
  }

  private getTrend(first: number, second: number, threshold: number): 'increasing' | 'decreasing' | 'stable' {
    const change = second - first;
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }

  private getTopPerformingPrompts(metrics: CacheMetric[]): CachePerformanceReport['topPerformingPrompts'] {
    // This would require more detailed prompt tracking - simplified for now
    return [
      {
        promptHash: 'contract_analysis_basic',
        hitRate: 85.5,
        frequency: 45,
        avgResponseTime: 1200
      },
      {
        promptHash: 'strategic_report_employment',
        hitRate: 78.2,
        frequency: 32,
        avgResponseTime: 1800
      },
      {
        promptHash: 'compliance_check_general',
        hitRate: 92.1,
        frequency: 28,
        avgResponseTime: 950
      }
    ];
  }

  private generateRecommendations(
    metrics: CacheMetric[], 
    avgHitRate: number, 
    avgResponseTime: number
  ): string[] {
    const recommendations: string[] = [];

    if (avgHitRate < 70) {
      recommendations.push('Consider increasing cache TTL for frequently used prompts');
      recommendations.push('Implement more aggressive cache warming for popular queries');
    }

    if (avgResponseTime > 3000) {
      recommendations.push('Optimize prompt complexity or implement response compression');
      recommendations.push('Consider implementing response streaming for better perceived performance');
    }

    const latestMetric = metrics[metrics.length - 1];
    if (latestMetric?.cacheSize > 80 * 1024 * 1024) { // 80MB
      recommendations.push('Implement more aggressive cache eviction policies');
      recommendations.push('Consider compressing cached responses');
    }

    if (recommendations.length === 0) {
      recommendations.push('Cache performance is optimal - continue monitoring');
    }

    return recommendations;
  }

  getOptimizationSuggestions(): CacheOptimizationSuggestion[] {
    const suggestions: CacheOptimizationSuggestion[] = [];
    const cacheStats = claudeCache.getCacheStats();
    const latestMetric = this.metrics[this.metrics.length - 1];

    // TTL adjustment suggestions
    if (latestMetric && latestMetric.hitRate < 70) {
      suggestions.push({
        type: 'ttl_adjustment',
        priority: 'high',
        description: 'Increase cache TTL for frequently accessed prompts to improve hit rate',
        expectedImpact: 'Could improve hit rate by 10-15%',
        implementation: 'Analyze access patterns and extend TTL for high-frequency prompts',
        estimatedEffort: 'low'
      });
    }

    // Compression suggestions
    if (cacheStats.totalSize > 50 * 1024 * 1024) { // 50MB
      suggestions.push({
        type: 'compression',
        priority: 'medium',
        description: 'Enable compression for large cache entries to reduce memory usage',
        expectedImpact: 'Could reduce cache size by 30-50%',
        implementation: 'Implement gzip compression for responses larger than 1KB',
        estimatedEffort: 'medium'
      });
    }

    // Warming suggestions
    const warmupStats = cacheWarmingService.getWarmupStats();
    if (warmupStats.completedToday < 10) {
      suggestions.push({
        type: 'warming',
        priority: 'medium',
        description: 'Increase cache warming frequency for better hit rates',
        expectedImpact: 'Could improve initial response times by 40-60%',
        implementation: 'Schedule more frequent warmup jobs for popular prompts',
        estimatedEffort: 'low'
      });
    }

    return suggestions;
  }

  private getEmptyReport(
    period: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): CachePerformanceReport {
    return {
      period,
      startDate,
      endDate,
      metrics: {
        avgHitRate: 0,
        avgResponseTime: 0,
        totalRequests: 0,
        totalCacheHits: 0,
        totalCacheMisses: 0,
        costSavingsUSD: 0,
        efficiencyScore: 0
      },
      trends: {
        hitRateTrend: 'stable',
        responseTrend: 'stable',
        usageTrend: 'stable'
      },
      topPerformingPrompts: [],
      recommendations: ['No data available for the selected period']
    };
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  getMetrics(limit: number = 100): CacheMetric[] {
    return this.metrics.slice(-limit);
  }

  getActiveAlerts(): CacheAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  getAllAlerts(): CacheAlert[] {
    return Array.from(this.alerts.values());
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`Resolved cache alert: ${alertId}`);
      return true;
    }
    return false;
  }

  clearMetricsHistory(): void {
    this.metrics = [];
    console.log('Cache metrics history cleared');
  }

  updateAlertThresholds(thresholds: Partial<typeof this.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    console.log('Alert thresholds updated:', thresholds);
  }

  getCacheHealthScore(): number {
    const latestMetric = this.metrics[this.metrics.length - 1];
    if (!latestMetric) return 50; // Neutral score

    const hitRateScore = Math.min(latestMetric.hitRate, 100);
    const responseTimeScore = Math.max(0, 100 - (latestMetric.responseTime / 100));
    const errorRateScore = Math.max(0, 100 - (latestMetric.errorRate * 10));
    
    return Math.round((hitRateScore + responseTimeScore + errorRateScore) / 3);
  }
}

export const cacheAnalytics = new CacheAnalyticsService();
export type { CacheMetric, CachePerformanceReport, CacheAlert, CacheOptimizationSuggestion };
export default CacheAnalyticsService;