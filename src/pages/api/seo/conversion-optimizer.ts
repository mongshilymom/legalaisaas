import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { callClaudeAI } from '../../../services/claude-api';
import fs from 'fs';
import path from 'path';

interface ConversionOptimization {
  overallScore: number;
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'content' | 'design' | 'seo' | 'technical';
    title: string;
    description: string;
    expectedImpact: string;
    implementation: string[];
  }[];
  underperformingPages: {
    page: string;
    visits: number;
    conversions: number;
    conversionRate: number;
    issues: string[];
    suggestions: string[];
  }[];
  topOpportunities: {
    opportunity: string;
    potentialImpact: number;
    effortRequired: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

async function analyzeConversionData(): Promise<any> {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'user-actions.log');
    
    if (!fs.existsSync(logPath)) {
      return null;
    }
    
    const logContent = fs.readFileSync(logPath, 'utf-8');
    const logs = logContent.split('\n').filter(line => line.trim()).map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    const seoVisitors = logs.filter(log => log.type === 'SEO_VISITOR');
    const seoConversions = logs.filter(log => log.type === 'CTA_CLICK' && log.source === 'seo');
    
    // Page performance analysis
    const pageMetrics = seoVisitors.reduce((acc, log) => {
      if (!log.page) return acc;
      
      if (!acc[log.page]) {
        acc[log.page] = { visits: 0, conversions: 0, tags: [] };
      }
      acc[log.page].visits += 1;
      if (log.tag) acc[log.page].tags.push(log.tag);
      
      return acc;
    }, {} as Record<string, { visits: number; conversions: number; tags: string[] }>);
    
    seoConversions.forEach(log => {
      if (log.page && pageMetrics[log.page]) {
        pageMetrics[log.page].conversions += 1;
      }
    });
    
    // Calculate conversion rates and identify patterns
    const pageAnalysis = Object.entries(pageMetrics).map(([page, metrics]) => ({
      page,
      visits: metrics.visits,
      conversions: metrics.conversions,
      conversionRate: metrics.visits > 0 ? (metrics.conversions / metrics.visits) * 100 : 0,
      popularTags: [...new Set(metrics.tags)]
    }));
    
    const overallConversionRate = seoVisitors.length > 0 ? 
      (seoConversions.length / seoVisitors.length) * 100 : 0;
    
    return {
      totalVisitors: seoVisitors.length,
      totalConversions: seoConversions.length,
      overallConversionRate,
      pageAnalysis,
      avgConversionRate: pageAnalysis.length > 0 ? 
        pageAnalysis.reduce((sum, p) => sum + p.conversionRate, 0) / pageAnalysis.length : 0,
      topPerformingPages: pageAnalysis.sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 3),
      underperformingPages: pageAnalysis.filter(p => p.visits >= 10 && p.conversionRate < overallConversionRate).slice(0, 5)
    };
  } catch (error) {
    console.error('Error analyzing conversion data:', error);
    return null;
  }
}

function generateOptimizationPrompt(analysisData: any): string {
  if (!analysisData) {
    return `당신은 SEO 및 전환율 최적화 전문가입니다. 일반적인 Legal AI SaaS 플랫폼에 대한 전환율 최적화 권장사항을 제공해주세요.

다음 JSON 형식으로 응답해주세요:
{
  "overallScore": 75,
  "recommendations": [
    {
      "priority": "high",
      "category": "content",
      "title": "권장사항 제목",
      "description": "상세 설명",
      "expectedImpact": "예상 효과",
      "implementation": ["구체적 실행 방법 1", "구체적 실행 방법 2"]
    }
  ],
  "underperformingPages": [],
  "topOpportunities": [
    {
      "opportunity": "기회 요소",
      "potentialImpact": 25,
      "effortRequired": "medium",
      "description": "상세 설명"
    }
  ]
}`;
  }

  return `당신은 SEO 및 전환율 최적화 전문가입니다. 다음 Legal AI SaaS 플랫폼의 데이터를 분석하여 전환율 개선 방안을 제안해주세요.

분석 데이터:
- 총 SEO 방문자: ${analysisData.totalVisitors}
- 총 전환 수: ${analysisData.totalConversions}
- 전체 전환율: ${analysisData.overallConversionRate.toFixed(2)}%
- 평균 페이지 전환율: ${analysisData.avgConversionRate.toFixed(2)}%

상위 성과 페이지:
${analysisData.topPerformingPages.map(p => 
  `- ${p.page}: ${p.visits}회 방문, ${p.conversionRate.toFixed(2)}% 전환율`
).join('\n')}

성과 저조 페이지:
${analysisData.underperformingPages.map(p => 
  `- ${p.page}: ${p.visits}회 방문, ${p.conversionRate.toFixed(2)}% 전환율`
).join('\n')}

다음 JSON 형식으로 응답해주세요:
{
  "overallScore": 1-100 사이의 점수,
  "recommendations": [
    {
      "priority": "high|medium|low",
      "category": "content|design|seo|technical",
      "title": "권장사항 제목",
      "description": "상세 설명",
      "expectedImpact": "예상 효과 (퍼센트나 구체적 수치)",
      "implementation": ["구체적 실행 방법 1", "구체적 실행 방법 2"]
    }
  ],
  "underperformingPages": [
    {
      "page": "페이지 경로",
      "visits": 방문수,
      "conversions": 전환수,
      "conversionRate": 전환율,
      "issues": ["문제점 1", "문제점 2"],
      "suggestions": ["개선 방안 1", "개선 방안 2"]
    }
  ],
  "topOpportunities": [
    {
      "opportunity": "기회 요소",
      "potentialImpact": 1-100 사이의 영향도,
      "effortRequired": "low|medium|high",
      "description": "상세 설명"
    }
  ]
}

주의사항:
1. Legal AI SaaS 플랫폼의 특성을 고려해주세요
2. 실제 구현 가능한 권장사항을 제시해주세요
3. 우선순위를 명확히 해주세요
4. 응답은 반드시 유효한 JSON 형식이어야 합니다`;
}

function parseOptimizationResponse(response: string): ConversionOptimization {
  try {
    const cleanedResponse = response.trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      overallScore: parsed.overallScore || 75,
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      underperformingPages: Array.isArray(parsed.underperformingPages) ? parsed.underperformingPages : [],
      topOpportunities: Array.isArray(parsed.topOpportunities) ? parsed.topOpportunities : [],
    };
  } catch (error) {
    console.error('Failed to parse optimization response:', error);
    
    // Return fallback recommendations
    return {
      overallScore: 70,
      recommendations: [
        {
          priority: 'high',
          category: 'content',
          title: 'CTA 문구 최적화',
          description: 'SEO 유입 페이지의 Call-to-Action 문구를 더 명확하고 매력적으로 개선',
          expectedImpact: '전환율 15-25% 향상',
          implementation: ['A/B 테스트로 다양한 CTA 문구 테스트', '긴급성과 혜택을 강조하는 문구 사용']
        }
      ],
      underperformingPages: [],
      topOpportunities: [
        {
          opportunity: 'SEO 키워드 확장',
          potentialImpact: 30,
          effortRequired: 'medium',
          description: '더 많은 법률 관련 롱테일 키워드로 유입 확대'
        }
      ]
    };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access conversion optimization'
      });
    }

    console.log('🎯 Conversion optimization request from:', session.user.email);

    // Analyze current conversion data
    const analysisData = await analyzeConversionData();
    
    // Generate AI recommendations
    const prompt = generateOptimizationPrompt(analysisData);
    
    const aiResponse = await callClaudeAI({
      prompt,
      model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.3'),
    });

    if (!aiResponse.success || !aiResponse.data) {
      throw new Error(aiResponse.error || 'AI response failed');
    }

    const optimization = parseOptimizationResponse(aiResponse.data);

    console.log('✅ Conversion optimization completed:', {
      overallScore: optimization.overallScore,
      recommendationCount: optimization.recommendations.length,
      opportunityCount: optimization.topOpportunities.length,
    });

    res.status(200).json({
      success: true,
      data: optimization,
      meta: {
        timestamp: new Date().toISOString(),
        analysisData: analysisData ? {
          totalVisitors: analysisData.totalVisitors,
          overallConversionRate: analysisData.overallConversionRate
        } : null,
        generatedBy: session.user.email,
      }
    });

  } catch (error) {
    console.error('❌ Conversion optimization failed:', error);

    res.status(500).json({
      success: false,
      error: 'Conversion optimization failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}