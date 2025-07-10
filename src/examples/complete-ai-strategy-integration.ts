/**
 * Complete AI Strategy Integration Example
 * 
 * This example demonstrates the full integration of:
 * - Enhanced API strategy routing
 * - Claude cache triggers
 * - Multi-AI provider fallback
 * - Intelligent load balancing
 * - Health monitoring
 */

import { aiProviderMonitor } from '@/services/ai-provider-monitor';
import { claudeCache } from '@/services/claude-cache';
import { cacheAnalytics } from '@/services/cache-analytics';
import { strategyLogService } from '@/services/strategy-log-service';

// Example 1: Complete Strategy Analysis Flow
async function completeStrategyAnalysisExample() {
  console.log('=== Complete Strategy Analysis Example ===');

  const requestData = {
    userId: 'user123',
    contractId: 'contract456',
    contractText: `
    근로계약서

    제1조 (계약기간)
    이 계약의 기간은 2024년 1월 1일부터 2024년 12월 31일까지로 한다.

    제2조 (업무내용)
    을은 갑의 지시에 따라 다음 업무를 수행한다.
    - 소프트웨어 개발
    - 시스템 유지보수
    - 기술 문서 작성

    제3조 (근무시간)
    을의 근무시간은 주 40시간으로 하며, 연장근무는 갑의 사전 승인을 받아야 한다.

    제4조 (임금)
    을의 월급여는 금 3,000,000원으로 하며, 매월 25일에 지급한다.
    `,
    summary: '소프트웨어 개발자 근로계약서 - 1년 기간, 월 300만원',
    riskPoints: [
      '연장근무 관련 규정 불명확',
      '계약 갱신 조건 부재',
      '퇴직금 산정 기준 불명확',
      '경업금지 조항 부재'
    ],
    mode: 'auto',
    priority: 'high',
    useCache: true,
    fallbackEnabled: true,
    language: 'ko'
  };

  try {
    // Step 1: Check AI provider health
    const systemHealth = aiProviderMonitor.getSystemHealth();
    console.log('AI Provider System Health:', systemHealth);

    if (systemHealth.overallHealth < 50) {
      console.warn('AI provider system health is poor, proceeding with caution');
    }

    // Step 2: Call enhanced strategy API
    const response = await fetch('/api/strategy/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('Strategy Analysis Result:', {
        provider: result.data.provider,
        cached: result.data.cached,
        responseTime: result.data.responseTime,
        confidence: result.data.confidence,
        fallbackUsed: result.data.fallbackUsed
      });

      // Step 3: Update provider usage metrics
      if (!result.data.cached) {
        await fetch('/api/ai-providers/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update-quota',
            providerId: result.data.provider,
            tokensUsed: 2500,
            cost: 0.025
          })
        });
      }

      // Step 4: Log strategy for future reference
      await strategyLogService.createLog({
        userId: requestData.userId,
        analysisRequestId: requestData.contractId,
        strategyType: 'strategic-report',
        strategySummary: typeof result.data.result === 'object' 
          ? result.data.result.summary || 'Strategic analysis completed'
          : 'Strategic analysis completed',
        fullReport: result.data.result,
        confidence: result.data.confidence,
        language: requestData.language,
        tags: [result.data.provider, result.data.cached ? 'cached' : 'fresh'],
        metadata: {
          provider: result.data.provider,
          cached: result.data.cached,
          fallbackUsed: result.data.fallbackUsed,
          responseTime: result.data.responseTime
        }
      });

      console.log('Strategy analysis completed successfully');
    } else {
      console.error('Strategy analysis failed:', result.error);
    }

  } catch (error) {
    console.error('Complete strategy analysis error:', error);
  }
}

// Example 2: AI Provider Monitoring and Management
async function providerMonitoringExample() {
  console.log('=== AI Provider Monitoring Example ===');

  try {
    // Get system overview
    const overview = await fetch('/api/ai-providers/status?action=overview')
      .then(res => res.json());

    console.log('System Overview:', {
      totalProviders: overview.data.systemHealth.totalProviders,
      availableProviders: overview.data.systemHealth.availableProviders,
      overallHealth: overview.data.systemHealth.overallHealth,
      topProvider: overview.data.systemHealth.topProvider
    });

    // Get detailed provider status
    const providers = overview.data.providers;
    for (const provider of providers) {
      const detailed = await fetch(`/api/ai-providers/status?action=detailed&providerId=${provider.id}`)
        .then(res => res.json());

      console.log(`Provider ${provider.name}:`, {
        status: detailed.data.metrics.status,
        healthScore: detailed.data.metrics.healthScore,
        responseTime: detailed.data.metrics.responseTime,
        uptime: detailed.data.metrics.uptime,
        quotaUsage: `${detailed.data.metrics.limits.usedQuota}/${detailed.data.metrics.limits.dailyQuota}`
      });
    }

    // Get provider selection recommendation
    const selection = await fetch('/api/ai-providers/status?action=selection&capabilities=reasoning,analysis&maxResponseTime=3000')
      .then(res => res.json());

    console.log('Recommended Provider:', selection.data);

  } catch (error) {
    console.error('Provider monitoring error:', error);
  }
}

// Example 3: Cache Performance Optimization
async function cacheOptimizationExample() {
  console.log('=== Cache Performance Optimization Example ===');

  try {
    // Get cache health
    const cacheHealth = await fetch('/api/cache/management?action=health')
      .then(res => res.json());

    console.log('Cache Health:', cacheHealth.data);

    // Get optimization suggestions
    const suggestions = cacheAnalytics.getOptimizationSuggestions();
    console.log('Optimization Suggestions:', suggestions);

    // Apply optimizations based on suggestions
    for (const suggestion of suggestions) {
      switch (suggestion.type) {
        case 'ttl_adjustment':
          console.log('Applying TTL adjustment:', suggestion.description);
          // Implementation would adjust TTL based on usage patterns
          break;
        
        case 'compression':
          console.log('Enabling compression:', suggestion.description);
          // Implementation would enable compression for large responses
          break;
        
        case 'warming':
          console.log('Scheduling cache warming:', suggestion.description);
          await fetch('/api/cache/management', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'warmup',
              category: 'strategic-report',
              priority: 'medium'
            })
          });
          break;
      }
    }

    // Generate performance report
    const report = cacheAnalytics.generatePerformanceReport('week');
    console.log('Weekly Performance Report:', {
      avgHitRate: report.metrics.avgHitRate,
      totalRequests: report.metrics.totalRequests,
      costSavings: report.metrics.costSavingsUSD,
      efficiencyScore: report.metrics.efficiencyScore
    });

  } catch (error) {
    console.error('Cache optimization error:', error);
  }
}

// Example 4: Failover and Recovery Testing
async function failoverRecoveryExample() {
  console.log('=== Failover and Recovery Testing Example ===');

  try {
    // Simulate provider failure
    await fetch('/api/ai-providers/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set-maintenance',
        providerId: 'claude',
        maintenance: true
      })
    });

    console.log('Claude provider set to maintenance mode');

    // Test strategy call with fallback
    const testRequest = {
      userId: 'test-user',
      contractId: 'test-contract',
      contractText: '테스트 계약서 내용',
      summary: '테스트 요약',
      riskPoints: ['테스트 리스크'],
      mode: 'claude', // Explicitly request Claude
      fallbackEnabled: true,
      useCache: false // Force fresh call
    };

    const response = await fetch('/api/strategy/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testRequest)
    });

    const result = await response.json();

    if (result.success) {
      console.log('Failover Test Result:', {
        requestedProvider: 'claude',
        actualProvider: result.data.provider,
        fallbackUsed: result.data.fallbackUsed,
        success: true
      });
    } else {
      console.error('Failover test failed:', result.error);
    }

    // Restore provider
    await fetch('/api/ai-providers/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set-maintenance',
        providerId: 'claude',
        maintenance: false
      })
    });

    console.log('Claude provider restored from maintenance');

  } catch (error) {
    console.error('Failover recovery test error:', error);
  }
}

// Example 5: Performance Benchmarking
async function performanceBenchmarkExample() {
  console.log('=== Performance Benchmarking Example ===');

  const providers = ['claude', 'openai', 'gemini', 'perplexity'];
  const benchmarkResults: Record<string, any> = {};

  const testRequest = {
    userId: 'benchmark-user',
    contractId: 'benchmark-contract',
    contractText: '벤치마크 테스트용 계약서 내용...',
    summary: '벤치마크 테스트 요약',
    riskPoints: ['벤치마크 리스크 1', '벤치마크 리스크 2'],
    useCache: false,
    fallbackEnabled: false
  };

  for (const provider of providers) {
    console.log(`Testing provider: ${provider}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch('/api/strategy/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testRequest,
          mode: provider
        })
      });

      const result = await response.json();
      const endTime = Date.now();

      benchmarkResults[provider] = {
        success: result.success,
        responseTime: endTime - startTime,
        confidence: result.success ? result.data.confidence : 0,
        error: result.error || null
      };

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      benchmarkResults[provider] = {
        success: false,
        responseTime: 0,
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  console.log('Benchmark Results:', benchmarkResults);

  // Analyze results
  const successfulProviders = Object.entries(benchmarkResults)
    .filter(([_, result]) => result.success)
    .sort((a, b) => a[1].responseTime - b[1].responseTime);

  if (successfulProviders.length > 0) {
    console.log('Performance Ranking:');
    successfulProviders.forEach(([provider, result], index) => {
      console.log(`${index + 1}. ${provider}: ${result.responseTime}ms (confidence: ${result.confidence}%)`);
    });
  } else {
    console.log('No providers passed the benchmark test');
  }
}

// Example 6: Analytics and Reporting
async function analyticsReportingExample() {
  console.log('=== Analytics and Reporting Example ===');

  try {
    // Generate comprehensive system report
    const systemHealth = aiProviderMonitor.getSystemHealth();
    const cacheStats = await fetch('/api/cache/management?action=stats')
      .then(res => res.json());
    const cacheAnalytics = await fetch('/api/cache/management?action=analytics&period=week')
      .then(res => res.json());

    const report = {
      timestamp: new Date().toISOString(),
      system: {
        overallHealth: systemHealth.overallHealth,
        availableProviders: systemHealth.availableProviders,
        totalProviders: systemHealth.totalProviders,
        avgResponseTime: systemHealth.averageResponseTime,
        aggregatedThroughput: systemHealth.aggregatedThroughput
      },
      cache: {
        hitRate: cacheStats.data.hitRate,
        totalEntries: cacheStats.data.totalEntries,
        totalSize: cacheStats.data.totalSize,
        efficiencyScore: cacheAnalytics.data.metrics.efficiencyScore,
        costSavings: cacheAnalytics.data.metrics.costSavingsUSD
      },
      recommendations: [
        ...cacheAnalytics.data.recommendations.slice(0, 3),
        'Monitor provider health scores regularly',
        'Consider implementing request queuing for high-traffic periods'
      ]
    };

    console.log('System Report:', JSON.stringify(report, null, 2));

    // Export report (in production, this might save to file or send via email)
    console.log('Report generated successfully');

  } catch (error) {
    console.error('Analytics reporting error:', error);
  }
}

// Complete Integration Test
async function completeIntegrationTest() {
  console.log('=== Complete Integration Test ===');

  try {
    console.log('1. Running complete strategy analysis...');
    await completeStrategyAnalysisExample();

    console.log('2. Testing provider monitoring...');
    await providerMonitoringExample();

    console.log('3. Optimizing cache performance...');
    await cacheOptimizationExample();

    console.log('4. Testing failover and recovery...');
    await failoverRecoveryExample();

    console.log('5. Running performance benchmarks...');
    await performanceBenchmarkExample();

    console.log('6. Generating analytics report...');
    await analyticsReportingExample();

    console.log('Complete integration test finished successfully!');

  } catch (error) {
    console.error('Complete integration test failed:', error);
  }
}

// Export all examples
export {
  completeStrategyAnalysisExample,
  providerMonitoringExample,
  cacheOptimizationExample,
  failoverRecoveryExample,
  performanceBenchmarkExample,
  analyticsReportingExample,
  completeIntegrationTest
};