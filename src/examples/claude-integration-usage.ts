/**
 * Legal AI SaaS - Claude Integration Usage Examples
 * 
 * This file demonstrates how to use the Claude-powered strategic modules
 * in the Legal AI SaaS application.
 */

import { retryQueue } from '@/services/retry-queue';
import { strategyLogService } from '@/services/strategy-log-service';

// Example 1: Generate Strategic Report
async function generateStrategicReportExample() {
  const requestData = {
    contractSummary: "근로계약서 - 정규직 채용, 연봉 5000만원, 주 40시간 근무",
    analysisResults: "중간 위험도 - 연장근무 조항 불명확, 퇴직금 산정 기준 부재",
    userSelectedRisks: ["연장근무", "퇴직금", "경업금지"],
    contractType: "근로계약서",
    userPlan: "Professional",
    language: "ko"
  };

  try {
    const response = await fetch('/api/claude/strategic-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Strategic Report Generated:', result.data);
      
      // Save to strategy log
      await strategyLogService.createLog({
        userId: 'user123',
        analysisRequestId: 'analysis456',
        strategyType: 'strategic-report',
        strategySummary: result.data.strategicReport.summary,
        fullReport: result.data.strategicReport,
        confidence: result.data.confidence,
        language: 'ko',
        tags: ['근로계약서', '연장근무', '퇴직금']
      });
    }
  } catch (error) {
    console.error('Error generating strategic report:', error);
    
    // Add to retry queue
    await retryQueue.addJob('strategic-report', requestData, 'user123', {
      priority: 'high',
      maxAttempts: 3
    });
  }
}

// Example 2: Get Upselling Recommendation
async function getUpsellRecommendationExample() {
  const requestData = {
    userId: 'user123',
    currentPlan: 'Basic',
    usageData: {
      uploadedFiles: 25,
      analysisRequests: 35,
      strategicReports: 8,
      voiceChatMinutes: 45,
      multiLanguageUse: true,
      lastActiveDate: '2024-01-15',
      averageSessionDuration: 28,
      featureUsage: {
        contractAnalysis: 20,
        complianceCheck: 8,
        documentGeneration: 5,
        aiConsultation: 12
      }
    },
    joinDate: '2024-01-01',
    industry: 'IT',
    companySize: 'small'
  };

  try {
    const response = await fetch('/api/claude/upsell-recommender', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Upsell Recommendation:', result.data);
      
      // Log the recommendation
      await strategyLogService.createLog({
        userId: 'user123',
        analysisRequestId: 'upsell789',
        strategyType: 'upsell-recommendation',
        strategySummary: result.data.recommendation.reason,
        fullReport: result.data.recommendation,
        confidence: result.data.confidence,
        tags: ['upsell', result.data.recommendation.recommended_plan]
      });
    }
  } catch (error) {
    console.error('Error getting upsell recommendation:', error);
  }
}

// Example 3: Localize Strategy Report
async function localizeStrategyReportExample() {
  const originalReport = {
    legalScenarios: [
      {
        scenario: "근로자 연장근무 거부 시 법적 분쟁",
        probability: "Medium",
        impact: "High",
        timeline: "3-6개월"
      }
    ],
    riskMitigation: [
      {
        risk: "연장근무 조항 불명확",
        mitigationStrategy: "명확한 연장근무 조항 추가 및 동의서 작성",
        priority: "High",
        resources: ["법무팀", "HR부서"]
      }
    ],
    proactiveStrategies: [
      {
        strategy: "연장근무 관련 내부 규정 정비",
        implementation: "연장근무 승인 절차 및 보상 체계 마련",
        expectedOutcome: "노동 분쟁 예방 및 근로자 만족도 향상",
        timeframe: "2-3개월"
      }
    ],
    summary: "연장근무 관련 조항 개선이 필요한 상황",
    recommendedActions: ["법률 자문 요청", "내부 규정 개정", "근로자 교육 실시"]
  };

  const requestData = {
    strategicReport: originalReport,
    targetLanguage: 'en',
    legalJurisdiction: 'US',
    businessContext: 'IT startup company'
  };

  try {
    const response = await fetch('/api/claude/i18n-strategy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Localized Strategy Report:', result.data);
      
      // Save localized version
      await strategyLogService.createLog({
        userId: 'user123',
        analysisRequestId: 'localize101',
        strategyType: 'i18n-strategy',
        strategySummary: result.data.localizedReport.translatedReport.summary,
        fullReport: result.data.localizedReport,
        confidence: result.data.translationQuality,
        language: 'en',
        jurisdiction: 'US',
        tags: ['localization', 'english', 'us-jurisdiction']
      });
    }
  } catch (error) {
    console.error('Error localizing strategy report:', error);
  }
}

// Example 4: Strategy Log Management
async function strategyLogManagementExample() {
  const userId = 'user123';

  // Search user's strategy logs
  const searchResults = await strategyLogService.searchLogs({
    userId,
    strategyType: 'strategic-report',
    language: 'ko',
    limit: 10
  });

  console.log('User Strategy Logs:', searchResults);

  // Get user analytics
  const analytics = await strategyLogService.getUserLogAnalytics(userId);
  console.log('User Analytics:', analytics);

  // Get recent logs
  const recentLogs = await strategyLogService.getRecentLogs(userId, 5);
  console.log('Recent Logs:', recentLogs);

  // Update a strategy log with new information
  if (searchResults.length > 0) {
    const logToUpdate = searchResults[0];
    await strategyLogService.updateLog({
      id: logToUpdate.id,
      strategySummary: 'Updated strategy summary with new insights',
      tags: [...logToUpdate.tags, 'updated'],
      metadata: {
        ...logToUpdate.metadata,
        lastUpdated: new Date().toISOString()
      }
    });
  }
}

// Example 5: Retry Queue Management
async function retryQueueManagementExample() {
  // Start the retry queue
  await retryQueue.start();

  // Get queue statistics
  const stats = await retryQueue.getQueueStats();
  console.log('Queue Stats:', stats);

  // Add a job to the queue
  const jobId = await retryQueue.addJob(
    'strategic-report',
    {
      prompt: 'Generate strategic report for contract analysis',
      systemPrompt: 'You are a legal expert...'
    },
    'user123',
    {
      priority: 'high',
      maxAttempts: 5
    }
  );

  console.log('Job added to queue:', jobId);

  // Check job status
  const job = await retryQueue.getJob(jobId);
  console.log('Job status:', job?.status);

  // Retry failed jobs for a user
  const retriedCount = await retryQueue.retryFailedJobs('user123');
  console.log('Retried jobs:', retriedCount);
}

// Example 6: Complete Integration Workflow
async function completeIntegrationWorkflowExample() {
  const userId = 'user123';
  const analysisRequestId = 'analysis789';

  try {
    // Step 1: Generate strategic report
    console.log('Step 1: Generating strategic report...');
    const strategicReport = await generateStrategicReportExample();

    // Step 2: Get upselling recommendation based on usage
    console.log('Step 2: Getting upselling recommendation...');
    const upsellRecommendation = await getUpsellRecommendationExample();

    // Step 3: Localize report if needed
    console.log('Step 3: Localizing report...');
    const localizedReport = await localizeStrategyReportExample();

    // Step 4: Review strategy logs and analytics
    console.log('Step 4: Reviewing strategy logs...');
    const analytics = await strategyLogService.getUserLogAnalytics(userId);

    // Step 5: Update strategy based on previous insights
    console.log('Step 5: Updating strategy...');
    const previousSummary = await strategyLogService.getStrategySummaryForUpdate(analysisRequestId);
    
    if (previousSummary) {
      // Use previous summary to generate updated strategy
      const updateResponse = await fetch('/api/claude/strategy-log', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: 'strategy-log-id',
          regenerateFromClause: 'Update strategy based on new market conditions and legal changes'
        })
      });

      const updateResult = await updateResponse.json();
      console.log('Strategy updated:', updateResult);
    }

    console.log('Complete integration workflow finished successfully');
  } catch (error) {
    console.error('Integration workflow error:', error);
  }
}

// Export examples for use in tests or documentation
export {
  generateStrategicReportExample,
  getUpsellRecommendationExample,
  localizeStrategyReportExample,
  strategyLogManagementExample,
  retryQueueManagementExample,
  completeIntegrationWorkflowExample
};