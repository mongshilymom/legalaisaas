/**
 * Legal AI SaaS - Claude Cache System Usage Examples
 * 
 * This file demonstrates how to use the comprehensive Claude caching system
 * including cache management, invalidation triggers, warming, and analytics.
 */

import { claudeCache } from '@/services/claude-cache';
import { cacheAnalytics } from '@/services/cache-analytics';
import { cacheWarmingService } from '@/services/cache-warming';
import { cacheInvalidationService } from '@/services/cache-invalidation-triggers';

// Example 1: Basic Cache Usage
async function basicCacheUsageExample() {
  console.log('=== Basic Cache Usage Example ===');

  // Generate a cached response
  const response = await claudeCache.generateWithCache(
    '근로계약서의 주요 리스크를 분석해주세요.',
    'You are a legal expert providing contract analysis.',
    {
      requestType: 'strategic-report',
      contractType: '근로계약서',
      language: 'ko',
      userId: 'user123'
    },
    {
      temperature: 0.7,
      maxTokens: 2000,
      customTTL: 24 * 60 * 60 * 1000 // 24 hours
    }
  );

  console.log('Generated response:', response.content.substring(0, 100) + '...');
  
  // Get cache statistics
  const stats = claudeCache.getCacheStats();
  console.log('Cache stats:', {
    totalEntries: stats.totalEntries,
    hitRate: stats.hitRate,
    totalSize: Math.round(stats.totalSize / 1024) + ' KB'
  });
}

// Example 2: Cache Warming Strategy
async function cacheWarmingExample() {
  console.log('=== Cache Warming Example ===');

  // Add a custom warmup prompt
  cacheWarmingService.addWarmupPrompt({
    id: 'custom_employment_analysis',
    prompt: '고용 계약서에서 중요한 법적 고려사항을 분석해주세요.',
    systemPrompt: 'You are a senior employment law expert.',
    metadata: {
      requestType: 'strategic-report',
      contractType: 'employment',
      language: 'ko',
      priority: 'high'
    },
    schedule: {
      frequency: 'daily',
      time: '09:00'
    }
  });

  // Schedule immediate warmup
  const jobId = await cacheWarmingService.scheduleWarmup('custom_employment_analysis', 'high');
  console.log('Warmup job scheduled:', jobId);

  // Warm up cache for specific user
  await cacheWarmingService.warmupForUser('user123');
  console.log('User-specific warmup completed');

  // Get warmup statistics
  const warmupStats = cacheWarmingService.getWarmupStats();
  console.log('Warmup stats:', {
    totalPrompts: warmupStats.totalPrompts,
    activeJobs: warmupStats.activeJobs,
    completedToday: warmupStats.completedToday
  });
}

// Example 3: Cache Invalidation Triggers
async function cacheInvalidationExample() {
  console.log('=== Cache Invalidation Example ===');

  // Trigger contract analysis invalidation
  await cacheInvalidationService.invalidateContractAnalysis('근로계약서');
  console.log('Contract analysis cache invalidated');

  // Trigger compliance rules update
  await cacheInvalidationService.invalidateComplianceRules('KR');
  console.log('Compliance rules cache invalidated');

  // Trigger user-specific invalidation
  await cacheInvalidationService.invalidateUserCache('user123', 'Plan upgrade');
  console.log('User cache invalidated');

  // Add custom trigger
  cacheInvalidationService.addTrigger({
    id: 'custom_law_update',
    name: 'Custom Law Update Trigger',
    description: 'Invalidate cache when specific laws are updated',
    conditions: [
      {
        type: 'system_event',
        parameters: {
          eventType: 'law_update',
          lawType: 'employment'
        }
      }
    ],
    actions: [
      {
        type: 'invalidate_by_tag',
        parameters: {
          tags: ['employment', 'contract-analysis']
        }
      }
    ],
    isActive: true
  });

  // Get trigger statistics
  const triggerStats = cacheInvalidationService.getTriggerStats();
  console.log('Trigger stats:', triggerStats);
}

// Example 4: Cache Analytics and Monitoring
async function cacheAnalyticsExample() {
  console.log('=== Cache Analytics Example ===');

  // Generate performance report
  const weeklyReport = cacheAnalytics.generatePerformanceReport('week');
  console.log('Weekly performance report:', {
    avgHitRate: weeklyReport.metrics.avgHitRate,
    totalRequests: weeklyReport.metrics.totalRequests,
    costSavingsUSD: weeklyReport.metrics.costSavingsUSD,
    efficiencyScore: weeklyReport.metrics.efficiencyScore
  });

  // Get optimization suggestions
  const suggestions = cacheAnalytics.getOptimizationSuggestions();
  console.log('Optimization suggestions:', suggestions.map(s => ({
    type: s.type,
    priority: s.priority,
    description: s.description
  })));

  // Check cache health
  const healthScore = cacheAnalytics.getCacheHealthScore();
  console.log('Cache health score:', healthScore);

  // Get active alerts
  const activeAlerts = cacheAnalytics.getActiveAlerts();
  console.log('Active alerts:', activeAlerts.length);

  if (activeAlerts.length > 0) {
    console.log('Sample alert:', {
      type: activeAlerts[0].type,
      severity: activeAlerts[0].severity,
      message: activeAlerts[0].message
    });
  }
}

// Example 5: Advanced Cache Management
async function advancedCacheManagementExample() {
  console.log('=== Advanced Cache Management Example ===');

  // Cache management via API
  const cacheOverview = await fetch('/api/cache/management', {
    method: 'GET'
  }).then(res => res.json());

  console.log('Cache overview:', {
    hitRate: cacheOverview.data.stats.hitRate,
    healthScore: cacheOverview.data.health.score,
    activeJobs: cacheOverview.data.warmup.activeJobs
  });

  // Trigger cache warmup via API
  await fetch('/api/cache/management', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'warmup',
      category: 'strategic-report',
      priority: 'high'
    })
  });

  // Invalidate cache by tag via API
  await fetch('/api/cache/management', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'invalidate',
      invalidationType: 'tag',
      target: 'contract-analysis',
      reason: 'Template update'
    })
  });

  // Get analytics via API
  const analyticsReport = await fetch('/api/cache/management?action=analytics&period=day')
    .then(res => res.json());

  console.log('Daily analytics:', {
    avgHitRate: analyticsReport.data.metrics.avgHitRate,
    trends: analyticsReport.data.trends,
    recommendations: analyticsReport.data.recommendations.slice(0, 2)
  });
}

// Example 6: Production Cache Strategy
async function productionCacheStrategyExample() {
  console.log('=== Production Cache Strategy Example ===');

  // Setup production-ready cache warming
  const productionPrompts = [
    {
      id: 'prod_employment_basic',
      prompt: '근로계약서 기본 분석을 해주세요.',
      metadata: {
        requestType: 'strategic-report',
        contractType: '근로계약서',
        language: 'ko',
        priority: 'high' as const
      },
      schedule: { frequency: 'daily' as const, time: '08:00' }
    },
    {
      id: 'prod_service_basic',
      prompt: '용역계약서 리스크 분석을 해주세요.',
      metadata: {
        requestType: 'strategic-report',
        contractType: '용역계약서',
        language: 'ko',
        priority: 'high' as const
      },
      schedule: { frequency: 'daily' as const, time: '08:05' }
    },
    {
      id: 'prod_compliance_check',
      prompt: '기본 컴플라이언스 체크를 해주세요.',
      metadata: {
        requestType: 'compliance-check',
        language: 'ko',
        priority: 'medium'
      },
      schedule: { frequency: 'daily', time: '09:00' }
    }
  ];

  // Add all production prompts
  productionPrompts.forEach(prompt => {
    cacheWarmingService.addWarmupPrompt(prompt);
  });

  // Setup production invalidation triggers
  const productionTriggers = [
    {
      id: 'prod_template_update',
      name: 'Production Template Update',
      description: 'Invalidate relevant cache when contract templates are updated',
      conditions: [
        {
          type: 'content_change',
          parameters: { entityType: 'contract_template' }
        }
      ],
      actions: [
        {
          type: 'invalidate_by_tag',
          parameters: { tags: ['contract-analysis', 'strategic-report'] }
        }
      ],
      isActive: true,
      triggerCount: 0
    },
    {
      id: 'prod_high_usage_optimization',
      name: 'Production High Usage Optimization',
      description: 'Optimize cache for high-usage patterns',
      conditions: [
        {
          type: 'user_action',
          parameters: { actionType: 'api_request', frequency: 'high' },
          threshold: 100
        }
      ],
      actions: [
        {
          type: 'invalidate_by_pattern',
          parameters: { pattern: 'old_responses', keepRecent: 50 }
        }
      ],
      isActive: true,
      triggerCount: 0
    }
  ];

  productionTriggers.forEach(trigger => {
    cacheInvalidationService.addTrigger(trigger);
  });

  // Configure production alert thresholds
  cacheAnalytics.updateAlertThresholds({
    lowHitRate: 75,        // Alert if hit rate below 75%
    highResponseTime: 3000, // Alert if response time above 3s
    highErrorRate: 2,      // Alert if error rate above 2%
    highCacheSize: 85      // Alert if cache size above 85%
  });

  console.log('Production cache strategy configured');
}

// Example 7: Monitoring and Maintenance
async function monitoringMaintenanceExample() {
  console.log('=== Monitoring and Maintenance Example ===');

  // Daily maintenance routine
  const dailyMaintenance = async () => {
    console.log('Running daily cache maintenance...');

    // Check cache health
    const healthScore = cacheAnalytics.getCacheHealthScore();
    console.log('Cache health score:', healthScore);

    if (healthScore < 70) {
      console.log('Cache health is below threshold, running optimization...');
      
      // Clear old entries and warm up cache
      await fetch('/api/cache/management?target=alerts', { method: 'DELETE' });
      await cacheWarmingService.warmupAll();
    }

    // Generate daily report
    const dailyReport = cacheAnalytics.generatePerformanceReport('day');
    console.log('Daily report summary:', {
      hitRate: dailyReport.metrics.avgHitRate,
      requests: dailyReport.metrics.totalRequests,
      savings: dailyReport.metrics.costSavingsUSD,
      topRecommendation: dailyReport.recommendations[0]
    });

    // Check for alerts that need attention
    const activeAlerts = cacheAnalytics.getActiveAlerts();
    if (activeAlerts.length > 0) {
      console.log(`${activeAlerts.length} active alerts requiring attention`);
      activeAlerts.forEach(alert => {
        console.log(`Alert: ${alert.type} - ${alert.message}`);
      });
    }
  };

  // Run maintenance
  await dailyMaintenance();

  // Setup automated monitoring (would run as cron job in production)
  console.log('Automated monitoring setup complete');
}

// Complete Integration Example
async function completeIntegrationExample() {
  console.log('=== Complete Integration Example ===');

  try {
    // 1. Initialize cache system
    console.log('1. Initializing cache system...');
    await basicCacheUsageExample();

    // 2. Setup cache warming
    console.log('2. Setting up cache warming...');
    await cacheWarmingExample();

    // 3. Configure invalidation triggers
    console.log('3. Configuring invalidation triggers...');
    await cacheInvalidationExample();

    // 4. Monitor performance
    console.log('4. Monitoring performance...');
    await cacheAnalyticsExample();

    // 5. Advanced management
    console.log('5. Advanced management...');
    await advancedCacheManagementExample();

    // 6. Production setup
    console.log('6. Production setup...');
    await productionCacheStrategyExample();

    // 7. Maintenance routine
    console.log('7. Maintenance routine...');
    await monitoringMaintenanceExample();

    console.log('Complete integration example finished successfully!');
  } catch (error) {
    console.error('Integration example error:', error);
  }
}

// Export examples for use in tests or production
export {
  basicCacheUsageExample,
  cacheWarmingExample,
  cacheInvalidationExample,
  cacheAnalyticsExample,
  advancedCacheManagementExample,
  productionCacheStrategyExample,
  monitoringMaintenanceExample,
  completeIntegrationExample
};