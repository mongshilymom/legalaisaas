import { NextApiRequest, NextApiResponse } from 'next';
import { claudeAPI } from '@/services/claude-api';
import { claudeCache } from '@/services/claude-cache';
import { sanitizeInput } from '@/utils/sanitizeInput';

interface StrategicReportRequest {
  contractSummary: string;
  analysisResults: string;
  userSelectedRisks: string[];
  contractType: string;
  userPlan: string;
  language?: string;
}

interface StrategicReportResponse {
  success: boolean;
  data?: {
    strategicReport: {
      legalScenarios: Array<{
        scenario: string;
        probability: string;
        impact: string;
        timeline: string;
      }>;
      riskMitigation: Array<{
        risk: string;
        mitigationStrategy: string;
        priority: string;
        resources: string[];
      }>;
      proactiveStrategies: Array<{
        strategy: string;
        implementation: string;
        expectedOutcome: string;
        timeframe: string;
      }>;
      summary: string;
      recommendedActions: string[];
    };
    htmlSnippet: string;
    confidence: number;
    processingTime: number;
  };
  error?: string;
}

const STRATEGIC_REPORT_SYSTEM_PROMPT = `
You are a senior legal strategist and compliance expert. Your role is to analyze contract risks and provide comprehensive strategic recommendations.

Generate a strategic report with the following structure:
1. Legal Scenarios: Identify potential legal scenarios with probability and impact assessment
2. Risk Mitigation: Provide specific mitigation strategies for each identified risk
3. Proactive Strategies: Recommend proactive measures to prevent issues
4. Summary: Provide an executive summary
5. Recommended Actions: List immediate actionable steps

Format your response as valid JSON with the following structure:
{
  "legalScenarios": [
    {
      "scenario": "Description of potential legal scenario",
      "probability": "High/Medium/Low",
      "impact": "High/Medium/Low",
      "timeline": "Timeline for potential occurrence"
    }
  ],
  "riskMitigation": [
    {
      "risk": "Identified risk",
      "mitigationStrategy": "Specific mitigation approach",
      "priority": "High/Medium/Low",
      "resources": ["List of required resources"]
    }
  ],
  "proactiveStrategies": [
    {
      "strategy": "Proactive strategy description",
      "implementation": "How to implement",
      "expectedOutcome": "Expected result",
      "timeframe": "Implementation timeline"
    }
  ],
  "summary": "Executive summary of the strategic analysis",
  "recommendedActions": ["List of immediate actions to take"]
}

Ensure all recommendations are practical, legally sound, and tailored to the specific contract type and risks identified.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StrategicReportResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const startTime = Date.now();
    
    // Validate and sanitize input
    const {
      contractSummary,
      analysisResults,
      userSelectedRisks,
      contractType,
      userPlan,
      language = 'ko'
    }: StrategicReportRequest = req.body;

    if (!contractSummary || !analysisResults || !userSelectedRisks || !contractType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Sanitize inputs
    const sanitizedSummary = sanitizeInput(contractSummary);
    const sanitizedAnalysis = sanitizeInput(analysisResults);
    const sanitizedContractType = sanitizeInput(contractType);
    const sanitizedRisks = userSelectedRisks.map(risk => sanitizeInput(risk));

    // Generate strategic report prompt
    const prompt = `
계약서 요약:
${sanitizedSummary}

분석 결과:
${sanitizedAnalysis}

사용자 선택 리스크 항목:
${sanitizedRisks.join(', ')}

계약서 유형: ${sanitizedContractType}
사용자 플랜: ${userPlan}

위 정보를 바탕으로 포괄적인 전략 리포트를 생성해주세요. 
각 리스크에 대한 구체적인 대응 전략, 예상 시나리오, 그리고 선제적 대응 방안을 포함해주세요.

응답은 반드시 유효한 JSON 형식으로 제공해주세요.
`;

    // Use cache-enabled Claude API
    const response = await claudeCache.generateWithCache(
      prompt,
      STRATEGIC_REPORT_SYSTEM_PROMPT,
      {
        requestType: 'strategic-report',
        contractType: sanitizedContractType,
        language,
        userId: req.body.userId
      },
      {
        temperature: 0.7,
        maxTokens: 4000,
        customTTL: 24 * 60 * 60 * 1000 // 24 hours cache
      }
    );

    // Parse strategic report
    let strategicReport;
    try {
      strategicReport = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse strategic report'
      });
    }

    // Generate HTML snippet for visualization
    const htmlSnippet = generateHtmlSnippet(strategicReport);

    // Calculate confidence score based on response quality
    const confidence = calculateConfidenceScore(strategicReport, response.usage);

    const processingTime = Date.now() - startTime;

    // Log the strategy generation
    console.log(`Strategic report generated in ${processingTime}ms with confidence ${confidence}%`);

    return res.status(200).json({
      success: true,
      data: {
        strategicReport,
        htmlSnippet,
        confidence,
        processingTime
      }
    });

  } catch (error) {
    console.error('Strategic report generation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

function generateHtmlSnippet(report: any): string {
  return `
<div class="strategic-report">
  <div class="report-section">
    <h3>법적 시나리오 분석</h3>
    <div class="scenarios-grid">
      ${report.legalScenarios.map((scenario: any) => `
        <div class="scenario-card ${scenario.probability.toLowerCase()}-probability">
          <h4>${scenario.scenario}</h4>
          <div class="scenario-meta">
            <span class="probability">확률: ${scenario.probability}</span>
            <span class="impact">영향: ${scenario.impact}</span>
            <span class="timeline">시점: ${scenario.timeline}</span>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="report-section">
    <h3>리스크 완화 전략</h3>
    <div class="mitigation-list">
      ${report.riskMitigation.map((mitigation: any) => `
        <div class="mitigation-item priority-${mitigation.priority.toLowerCase()}">
          <h4>${mitigation.risk}</h4>
          <p><strong>전략:</strong> ${mitigation.mitigationStrategy}</p>
          <p><strong>필요 자원:</strong> ${mitigation.resources.join(', ')}</p>
          <span class="priority-badge">${mitigation.priority} 우선순위</span>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="report-section">
    <h3>선제적 대응 전략</h3>
    <div class="proactive-strategies">
      ${report.proactiveStrategies.map((strategy: any) => `
        <div class="strategy-card">
          <h4>${strategy.strategy}</h4>
          <p><strong>구현 방법:</strong> ${strategy.implementation}</p>
          <p><strong>예상 결과:</strong> ${strategy.expectedOutcome}</p>
          <p><strong>시간 프레임:</strong> ${strategy.timeframe}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="report-section">
    <h3>요약 및 권장사항</h3>
    <div class="summary">
      <p>${report.summary}</p>
    </div>
    <div class="recommended-actions">
      <h4>즉시 실행 권장사항:</h4>
      <ul>
        ${report.recommendedActions.map((action: string) => `<li>${action}</li>`).join('')}
      </ul>
    </div>
  </div>
</div>
`;
}

function calculateConfidenceScore(report: any, usage: any): number {
  let score = 70; // Base score

  // Check completeness
  if (report.legalScenarios && report.legalScenarios.length > 0) score += 10;
  if (report.riskMitigation && report.riskMitigation.length > 0) score += 10;
  if (report.proactiveStrategies && report.proactiveStrategies.length > 0) score += 10;
  
  // Check quality indicators
  if (usage.output_tokens > 500) score += 5;
  if (report.summary && report.summary.length > 100) score += 5;

  return Math.min(score, 100);
}