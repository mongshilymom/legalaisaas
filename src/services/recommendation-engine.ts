import { 
  UserInput, 
  RecommendationResult, 
  SuggestedAction, 
  AnalysisData, 
  ContractType, 
  ComplexityLevel,
  UrgencyContext
} from '../types/recommendation';
import { UrgencyDetector } from './urgency-detector';
import { PricingEngine } from './pricing-engine';

export class RecommendationEngine {
  
  static async generateRecommendation(input: UserInput): Promise<RecommendationResult> {
    const urgencyContext = UrgencyDetector.analyzeUrgency(input.question);
    const analysisData = this.analyzeInput(input);
    
    const planRecommendation = PricingEngine.recommendPlan(
      input.contractType || ContractType.PERSONAL,
      analysisData.complexity,
      analysisData.fileCount,
      analysisData.hasMultiLanguage,
      urgencyContext.urgencyScore
    );

    const suggestedAction: SuggestedAction = {
      plan: planRecommendation.plan,
      reason: planRecommendation.reason,
      priceRecommendation: PricingEngine.getPriceForPlan(planRecommendation.plan),
      suggestedFeature: planRecommendation.features
    };

    return {
      suggestedAction,
      urgencyContext,
      analysisData
    };
  }

  private static analyzeInput(input: UserInput): AnalysisData {
    const fileCount = input.files?.length || 0;
    const complexity = this.determineComplexity(input.question, fileCount, input.contractType);
    const hasMultiLanguage = this.detectMultiLanguage(input.question);
    const estimatedProcessingTime = this.estimateProcessingTime(complexity, fileCount);

    return {
      complexity,
      fileCount,
      hasMultiLanguage,
      estimatedProcessingTime
    };
  }

  private static determineComplexity(
    question: string, 
    fileCount: number, 
    contractType?: ContractType
  ): ComplexityLevel {
    let complexityScore = 0;

    if (contractType === ContractType.ENTERPRISE) complexityScore += 40;
    if (contractType === ContractType.BUSINESS) complexityScore += 25;
    if (contractType === ContractType.COMPLIANCE) complexityScore += 35;

    const complexKeywords = ['분석', '검토', '비교', '조항', '리스크', '준수성'];
    const foundKeywords = complexKeywords.filter(keyword => 
      question.includes(keyword)
    ).length;
    complexityScore += foundKeywords * 10;

    complexityScore += fileCount * 15;

    if (question.length > 200) complexityScore += 20;

    if (complexityScore >= 60) return ComplexityLevel.HIGH;
    if (complexityScore >= 30) return ComplexityLevel.MEDIUM;
    return ComplexityLevel.LOW;
  }

  private static detectMultiLanguage(question: string): boolean {
    const englishPattern = /[a-zA-Z]{3,}/;
    const koreanPattern = /[가-힣]{2,}/;
    const chinesePattern = /[\u4e00-\u9fff]/;
    const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;

    const languages = [
      englishPattern.test(question),
      koreanPattern.test(question),
      chinesePattern.test(question),
      japanesePattern.test(question)
    ];

    return languages.filter(Boolean).length > 1;
  }

  private static estimateProcessingTime(
    complexity: ComplexityLevel, 
    fileCount: number
  ): number {
    let baseTime = 30;

    switch (complexity) {
      case ComplexityLevel.HIGH:
        baseTime = 180;
        break;
      case ComplexityLevel.MEDIUM:
        baseTime = 90;
        break;
      default:
        baseTime = 30;
    }

    return baseTime + (fileCount * 20);
  }

  static async processWithAI(input: UserInput): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          aiResponse: `AI 분석 결과: ${input.question}에 대한 법적 검토가 완료되었습니다.`,
          confidence: 0.85,
          suggestedActions: ['계약서 수정', '전문가 상담', '추가 검토']
        });
      }, 2000);
    });
  }
}