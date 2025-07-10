import { NextApiRequest, NextApiResponse } from 'next';
import { claudeAPI } from '@/services/claude-api';
import { claudeCache } from '@/services/claude-cache';
import { sanitizeInput } from '@/utils/sanitizeInput';

interface UserUsageData {
  uploadedFiles: number;
  analysisRequests: number;
  strategicReports: number;
  voiceChatMinutes: number;
  multiLanguageUse: boolean;
  lastActiveDate: string;
  averageSessionDuration: number;
  featureUsage: {
    contractAnalysis: number;
    complianceCheck: number;
    documentGeneration: number;
    aiConsultation: number;
  };
}

interface UpsellRequest {
  userId: string;
  currentPlan: string;
  usageData: UserUsageData;
  joinDate: string;
  industry?: string;
  companySize?: string;
}

interface UpsellRecommendation {
  reason: string;
  recommended_plan: string;
  cta_text: string;
  urgency_level: 'low' | 'medium' | 'high';
  expected_value: string;
  features_highlighted: string[];
  discount_eligible: boolean;
  trial_available: boolean;
}

interface UpsellResponse {
  success: boolean;
  data?: {
    recommendation: UpsellRecommendation;
    confidence: number;
    personalization_score: number;
    next_review_date: string;
  };
  error?: string;
}

const UPSELL_SYSTEM_PROMPT = `
You are an AI-powered sales and customer success specialist for a Legal AI SaaS platform. 
Your role is to analyze user behavior and recommend the most appropriate plan upgrades or additional features.

Available plans:
- Basic: 기본 계약서 분석, 월 10회 분석 한도
- Professional: 고급 분석 + AI 상담, 월 50회 분석 한도, 다국어 지원
- Enterprise: 무제한 분석 + 전담 지원, 커스텀 통합, 팀 협업 기능

Your recommendations should be:
1. Data-driven and personalized
2. Focused on solving user pain points
3. Highlight tangible business value
4. Include appropriate urgency without being pushy
5. Consider user's company size and industry

Respond with valid JSON in the following format:
{
  "reason": "Clear explanation of why this upgrade is recommended",
  "recommended_plan": "Specific plan name or feature",
  "cta_text": "Compelling call-to-action text",
  "urgency_level": "low/medium/high",
  "expected_value": "Quantified value proposition",
  "features_highlighted": ["List of key features to highlight"],
  "discount_eligible": true/false,
  "trial_available": true/false
}

Consider usage patterns, limitations hit, and growth potential when making recommendations.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpsellResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      userId,
      currentPlan,
      usageData,
      joinDate,
      industry,
      companySize
    }: UpsellRequest = req.body;

    // Validate required fields
    if (!userId || !currentPlan || !usageData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Sanitize inputs
    const sanitizedUserId = sanitizeInput(userId);
    const sanitizedCurrentPlan = sanitizeInput(currentPlan);
    const sanitizedIndustry = industry ? sanitizeInput(industry) : '';
    const sanitizedCompanySize = companySize ? sanitizeInput(companySize) : '';

    // Analyze usage patterns
    const usageAnalysis = analyzeUsagePatterns(usageData, currentPlan);

    // Generate personalized recommendation prompt
    const prompt = `
사용자 분석 정보:
- 사용자 ID: ${sanitizedUserId}
- 현재 플랜: ${sanitizedCurrentPlan}
- 가입일: ${joinDate}
- 업종: ${sanitizedIndustry || '미지정'}
- 회사 규모: ${sanitizedCompanySize || '미지정'}

사용 패턴 분석:
- 파일 업로드 수: ${usageData.uploadedFiles}회
- 분석 요청 수: ${usageData.analysisRequests}회
- 전략 리포트 생성: ${usageData.strategicReports}회
- 음성 채팅 시간: ${usageData.voiceChatMinutes}분
- 다국어 사용: ${usageData.multiLanguageUse ? '예' : '아니오'}
- 평균 세션 시간: ${usageData.averageSessionDuration}분

기능별 사용 현황:
- 계약서 분석: ${usageData.featureUsage.contractAnalysis}회
- 컴플라이언스 체크: ${usageData.featureUsage.complianceCheck}회
- 문서 생성: ${usageData.featureUsage.documentGeneration}회
- AI 상담: ${usageData.featureUsage.aiConsultation}회

사용 패턴 인사이트:
${usageAnalysis.insights.join('\n')}

위 정보를 바탕으로 사용자에게 가장 적합한 플랜 업그레이드 또는 추가 기능을 추천해주세요. 
사용자의 실제 니즈와 사용 패턴을 고려하여 개인화된 추천을 제공해주세요.

응답은 반드시 유효한 JSON 형식으로 제공해주세요.
`;

    // Use cache-enabled Claude API
    const response = await claudeCache.generateWithCache(
      prompt,
      UPSELL_SYSTEM_PROMPT,
      {
        requestType: 'upsell-recommendation',
        userId: sanitizedUserId,
        language: 'ko'
      },
      {
        temperature: 0.8, // Higher temperature for more creative recommendations
        maxTokens: 2000,
        customTTL: 6 * 60 * 60 * 1000 // 6 hours cache (shorter for dynamic recommendations)
      }
    );

    // Parse recommendation
    let recommendation: UpsellRecommendation;
    try {
      recommendation = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse upsell recommendation'
      });
    }

    // Calculate confidence and personalization scores
    const confidence = calculateConfidenceScore(usageData, recommendation);
    const personalizationScore = calculatePersonalizationScore(usageData, recommendation);
    
    // Set next review date based on usage patterns
    const nextReviewDate = calculateNextReviewDate(usageData, currentPlan);

    // Log the recommendation for analytics
    console.log(`Upsell recommendation generated for user ${sanitizedUserId}: ${recommendation.recommended_plan}`);

    return res.status(200).json({
      success: true,
      data: {
        recommendation,
        confidence,
        personalization_score: personalizationScore,
        next_review_date: nextReviewDate
      }
    });

  } catch (error) {
    console.error('Upsell recommendation error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

function analyzeUsagePatterns(usageData: UserUsageData, currentPlan: string) {
  const insights: string[] = [];
  
  // Analyze usage intensity
  if (usageData.analysisRequests > 30) {
    insights.push('- 높은 분석 요청 빈도로 상위 플랜 혜택 활용 가능');
  }
  
  // Check for feature limitations
  if (currentPlan === 'Basic' && usageData.analysisRequests > 8) {
    insights.push('- 기본 플랜 한도 근접으로 업그레이드 필요성 증가');
  }
  
  // Multi-language usage pattern
  if (usageData.multiLanguageUse && currentPlan === 'Basic') {
    insights.push('- 다국어 기능 사용으로 Professional 플랜 추천');
  }
  
  // Voice chat usage
  if (usageData.voiceChatMinutes > 60) {
    insights.push('- 활발한 AI 상담 사용으로 고급 기능 활용도 높음');
  }
  
  // Feature usage balance
  const totalFeatureUsage = Object.values(usageData.featureUsage).reduce((sum, usage) => sum + usage, 0);
  if (totalFeatureUsage > 50) {
    insights.push('- 다양한 기능 활용으로 종합 플랜 효과적');
  }
  
  // Session duration analysis
  if (usageData.averageSessionDuration > 30) {
    insights.push('- 긴 세션 시간으로 고급 기능 활용 의향 높음');
  }
  
  return { insights };
}

function calculateConfidenceScore(usageData: UserUsageData, recommendation: UpsellRecommendation): number {
  let score = 60; // Base score
  
  // Usage volume indicators
  if (usageData.analysisRequests > 20) score += 15;
  if (usageData.uploadedFiles > 15) score += 10;
  if (usageData.voiceChatMinutes > 30) score += 10;
  
  // Feature utilization
  const featureUsageCount = Object.values(usageData.featureUsage).filter(usage => usage > 0).length;
  score += featureUsageCount * 5;
  
  // Recommendation quality
  if (recommendation.expected_value.includes('배')) score += 5;
  if (recommendation.features_highlighted.length > 2) score += 5;
  
  return Math.min(score, 100);
}

function calculatePersonalizationScore(usageData: UserUsageData, recommendation: UpsellRecommendation): number {
  let score = 50; // Base score
  
  // Usage pattern matching
  if (usageData.multiLanguageUse && recommendation.features_highlighted.includes('다국어')) score += 20;
  if (usageData.voiceChatMinutes > 0 && recommendation.features_highlighted.includes('AI 상담')) score += 15;
  
  // Urgency alignment
  if (usageData.analysisRequests > 25 && recommendation.urgency_level === 'high') score += 10;
  if (usageData.analysisRequests < 10 && recommendation.urgency_level === 'low') score += 10;
  
  // Feature alignment
  const maxFeatureUsage = Math.max(...Object.values(usageData.featureUsage));
  if (maxFeatureUsage > 10) score += 5;
  
  return Math.min(score, 100);
}

function calculateNextReviewDate(usageData: UserUsageData, currentPlan: string): string {
  const now = new Date();
  let daysToAdd = 30; // Default: 30 days
  
  // Adjust based on usage patterns
  if (usageData.analysisRequests > 20) daysToAdd = 14; // High usage: review sooner
  if (usageData.analysisRequests < 5) daysToAdd = 60; // Low usage: review later
  
  // Adjust based on current plan
  if (currentPlan === 'Basic') daysToAdd = Math.min(daysToAdd, 21); // Basic users: more frequent reviews
  if (currentPlan === 'Enterprise') daysToAdd = Math.max(daysToAdd, 45); // Enterprise users: less frequent reviews
  
  const nextReviewDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return nextReviewDate.toISOString().split('T')[0];
}