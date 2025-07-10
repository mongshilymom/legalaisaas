import { NextApiRequest, NextApiResponse } from 'next';
import { claudeAPI } from '@/services/claude-api';
import { claudeCache } from '@/services/claude-cache';
import { sanitizeInput } from '@/utils/sanitizeInput';

interface I18nStrategyRequest {
  strategicReport: any;
  targetLanguage: string;
  sourceLanguage?: string;
  legalJurisdiction?: string;
  businessContext?: string;
}

interface LocalizedReport {
  translatedReport: {
    legalScenarios: Array<{
      scenario: string;
      probability: string;
      impact: string;
      timeline: string;
      localConsiderations?: string;
    }>;
    riskMitigation: Array<{
      risk: string;
      mitigationStrategy: string;
      priority: string;
      resources: string[];
      jurisdictionSpecific?: string;
    }>;
    proactiveStrategies: Array<{
      strategy: string;
      implementation: string;
      expectedOutcome: string;
      timeframe: string;
      culturalAdaptation?: string;
    }>;
    summary: string;
    recommendedActions: string[];
  };
  localizedAlerts: string[];
  jurisdictionNotes: string[];
  culturalConsiderations: string[];
  legalDifferences: string[];
}

interface I18nStrategyResponse {
  success: boolean;
  data?: {
    localizedReport: LocalizedReport;
    translationQuality: number;
    localizationScore: number;
    languageCode: string;
    jurisdiction: string;
  };
  error?: string;
}

const LANGUAGE_CONFIGS = {
  'en': {
    name: 'English',
    jurisdiction: 'US/UK',
    legalSystem: 'Common Law',
    businessCulture: 'Direct, contract-focused'
  },
  'de': {
    name: 'German',
    jurisdiction: 'Germany',
    legalSystem: 'Civil Law',
    businessCulture: 'Formal, detail-oriented'
  },
  'fr': {
    name: 'French',
    jurisdiction: 'France',
    legalSystem: 'Civil Law',
    businessCulture: 'Formal, relationship-based'
  },
  'ja': {
    name: 'Japanese',
    jurisdiction: 'Japan',
    legalSystem: 'Civil Law',
    businessCulture: 'Consensus-driven, hierarchical'
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    jurisdiction: 'China',
    legalSystem: 'Socialist Law',
    businessCulture: 'Relationship-focused, government-aware'
  },
  'es': {
    name: 'Spanish',
    jurisdiction: 'Spain/Latin America',
    legalSystem: 'Civil Law',
    businessCulture: 'Relationship-based, formal'
  }
};

const I18N_SYSTEM_PROMPT = `
You are a specialized legal translator and cross-cultural legal advisor. Your expertise includes:
1. Legal terminology translation across jurisdictions
2. Cultural adaptation of legal strategies
3. Jurisdiction-specific legal considerations
4. Business culture impact on legal practices

Your task is to not just translate, but to localize legal strategies considering:
- Local legal systems and regulations
- Cultural business practices
- Jurisdiction-specific risks and opportunities
- Local compliance requirements

Provide comprehensive localization that includes:
1. Accurate translation of legal content
2. Cultural adaptation of strategies
3. Jurisdiction-specific legal considerations
4. Local compliance alerts
5. Cultural business practice adjustments

Format your response as valid JSON with the structure provided.
Ensure all legal advice is adapted for the target jurisdiction and culture.
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<I18nStrategyResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      strategicReport,
      targetLanguage,
      sourceLanguage = 'ko',
      legalJurisdiction,
      businessContext
    }: I18nStrategyRequest = req.body;

    // Validate required fields
    if (!strategicReport || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate target language
    const langConfig = LANGUAGE_CONFIGS[targetLanguage as keyof typeof LANGUAGE_CONFIGS];
    if (!langConfig) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported target language'
      });
    }

    // Sanitize inputs
    const sanitizedTargetLanguage = sanitizeInput(targetLanguage);
    const sanitizedJurisdiction = legalJurisdiction ? sanitizeInput(legalJurisdiction) : langConfig.jurisdiction;
    const sanitizedBusinessContext = businessContext ? sanitizeInput(businessContext) : '';

    // Generate localization prompt
    const prompt = `
원본 전략 리포트 (한국어):
${JSON.stringify(strategicReport, null, 2)}

대상 언어: ${langConfig.name} (${sanitizedTargetLanguage})
대상 관할권: ${sanitizedJurisdiction}
법적 시스템: ${langConfig.legalSystem}
비즈니스 문화: ${langConfig.businessCulture}
비즈니스 컨텍스트: ${sanitizedBusinessContext}

다음 요구사항에 따라 전략 리포트를 현지화해주세요:

1. 정확한 법적 용어 번역
2. 대상 관할권의 법적 시스템에 맞는 조언 조정
3. 현지 비즈니스 문화를 고려한 전략 수정
4. 관할권별 특별 주의사항 추가
5. 현지 컴플라이언스 요구사항 반영

응답 형식:
{
  "translatedReport": {
    "legalScenarios": [
      {
        "scenario": "번역된 시나리오",
        "probability": "확률",
        "impact": "영향",
        "timeline": "시간표",
        "localConsiderations": "현지 고려사항"
      }
    ],
    "riskMitigation": [
      {
        "risk": "번역된 리스크",
        "mitigationStrategy": "현지화된 완화 전략",
        "priority": "우선순위",
        "resources": ["현지화된 자원 목록"],
        "jurisdictionSpecific": "관할권별 특별 고려사항"
      }
    ],
    "proactiveStrategies": [
      {
        "strategy": "번역된 전략",
        "implementation": "현지화된 구현 방법",
        "expectedOutcome": "예상 결과",
        "timeframe": "시간 프레임",
        "culturalAdaptation": "문화적 적응 사항"
      }
    ],
    "summary": "현지화된 요약",
    "recommendedActions": ["현지화된 권장사항 목록"]
  },
  "localizedAlerts": ["현지 특별 주의사항"],
  "jurisdictionNotes": ["관할권별 법적 주의사항"],
  "culturalConsiderations": ["문화적 고려사항"],
  "legalDifferences": ["원본 관할권과의 법적 차이점"]
}

반드시 유효한 JSON 형식으로 응답해주세요.
`;

    // Use cache-enabled Claude API
    const response = await claudeCache.generateWithCache(
      prompt,
      I18N_SYSTEM_PROMPT,
      {
        requestType: 'i18n-strategy',
        language: sanitizedTargetLanguage,
        jurisdiction: sanitizedJurisdiction,
        userId: req.body.userId
      },
      {
        temperature: 0.6, // Moderate temperature for consistent translations
        maxTokens: 4000,
        customTTL: 7 * 24 * 60 * 60 * 1000 // 7 days cache (translations are more stable)
      }
    );

    // Parse localized report
    let localizedReport: LocalizedReport;
    try {
      localizedReport = JSON.parse(response.content);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse localized report'
      });
    }

    // Calculate translation quality and localization scores
    const translationQuality = calculateTranslationQuality(localizedReport, response.usage);
    const localizationScore = calculateLocalizationScore(localizedReport, langConfig);

    // Log the localization
    console.log(`Strategy report localized to ${langConfig.name} with quality ${translationQuality}%`);

    return res.status(200).json({
      success: true,
      data: {
        localizedReport,
        translationQuality,
        localizationScore,
        languageCode: sanitizedTargetLanguage,
        jurisdiction: sanitizedJurisdiction
      }
    });

  } catch (error) {
    console.error('I18n strategy error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

function calculateTranslationQuality(report: LocalizedReport, usage: any): number {
  let score = 70; // Base score

  // Check completeness
  if (report.translatedReport.legalScenarios.length > 0) score += 10;
  if (report.translatedReport.riskMitigation.length > 0) score += 10;
  if (report.translatedReport.proactiveStrategies.length > 0) score += 10;

  // Check localization depth
  if (report.localizedAlerts.length > 0) score += 5;
  if (report.jurisdictionNotes.length > 0) score += 5;
  if (report.culturalConsiderations.length > 0) score += 5;

  // Check output quality
  if (usage.output_tokens > 800) score += 5;

  return Math.min(score, 100);
}

function calculateLocalizationScore(report: LocalizedReport, langConfig: any): number {
  let score = 60; // Base score

  // Check jurisdiction-specific adaptations
  const hasJurisdictionSpecific = report.translatedReport.riskMitigation.some(
    item => item.jurisdictionSpecific
  );
  if (hasJurisdictionSpecific) score += 15;

  // Check cultural adaptations
  const hasCulturalAdaptation = report.translatedReport.proactiveStrategies.some(
    item => item.culturalAdaptation
  );
  if (hasCulturalAdaptation) score += 15;

  // Check local considerations
  const hasLocalConsiderations = report.translatedReport.legalScenarios.some(
    item => item.localConsiderations
  );
  if (hasLocalConsiderations) score += 10;

  // Check comprehensive localization elements
  if (report.legalDifferences.length > 0) score += 10;
  if (report.jurisdictionNotes.length > 2) score += 5;
  if (report.culturalConsiderations.length > 2) score += 5;

  return Math.min(score, 100);
}

// Helper function to get supported languages
export function getSupportedLanguages() {
  return Object.entries(LANGUAGE_CONFIGS).map(([code, config]) => ({
    code,
    name: config.name,
    jurisdiction: config.jurisdiction,
    legalSystem: config.legalSystem
  }));
}