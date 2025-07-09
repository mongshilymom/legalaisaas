import { PlanType, ContractType, ComplexityLevel } from '../types/recommendation';

export class PricingEngine {
  private static readonly PLAN_PRICES = {
    [PlanType.FREE]: '₩0',
    [PlanType.BASIC]: '₩9,900',
    [PlanType.PREMIUM]: '₩19,000'
  };

  private static readonly PREMIUM_FEATURES = [
    'AI 분석 리포트',
    'PDF 다운로드',
    '보안 인증 계약',
    '다국어 지원',
    '우선 처리',
    '전문가 검토'
  ];

  private static readonly BASIC_FEATURES = [
    'AI 계약 분석',
    '기본 검토',
    '텍스트 요약'
  ];

  static recommendPlan(
    contractType: ContractType,
    complexity: ComplexityLevel,
    fileCount: number,
    hasMultiLanguage: boolean,
    urgencyScore: number
  ): { plan: PlanType; reason: string; features: string[] } {
    
    if (this.shouldRecommendPremium(contractType, complexity, fileCount, hasMultiLanguage, urgencyScore)) {
      return {
        plan: PlanType.PREMIUM,
        reason: this.generatePremiumReason(contractType, complexity, fileCount, hasMultiLanguage, urgencyScore),
        features: this.PREMIUM_FEATURES
      };
    }

    if (this.shouldRecommendBasic(contractType, complexity, fileCount)) {
      return {
        plan: PlanType.BASIC,
        reason: this.generateBasicReason(contractType, complexity, fileCount),
        features: this.BASIC_FEATURES
      };
    }

    return {
      plan: PlanType.FREE,
      reason: '기본 계약 분석 및 요약',
      features: ['기본 AI 분석', '간단한 요약']
    };
  }

  private static shouldRecommendPremium(
    contractType: ContractType,
    complexity: ComplexityLevel,
    fileCount: number,
    hasMultiLanguage: boolean,
    urgencyScore: number
  ): boolean {
    return (
      contractType === ContractType.ENTERPRISE ||
      contractType === ContractType.BUSINESS ||
      complexity === ComplexityLevel.HIGH ||
      fileCount > 3 ||
      hasMultiLanguage ||
      urgencyScore > 60
    );
  }

  private static shouldRecommendBasic(
    contractType: ContractType,
    complexity: ComplexityLevel,
    fileCount: number
  ): boolean {
    return (
      contractType === ContractType.BUSINESS ||
      complexity === ComplexityLevel.MEDIUM ||
      fileCount > 1
    );
  }

  private static generatePremiumReason(
    contractType: ContractType,
    complexity: ComplexityLevel,
    fileCount: number,
    hasMultiLanguage: boolean,
    urgencyScore: number
  ): string {
    const reasons = [];
    
    if (contractType === ContractType.ENTERPRISE) reasons.push('기업용 계약');
    if (contractType === ContractType.BUSINESS) reasons.push('비즈니스 계약');
    if (complexity === ComplexityLevel.HIGH) reasons.push('고난이도 분석');
    if (fileCount > 3) reasons.push('다중 파일 분석');
    if (hasMultiLanguage) reasons.push('다국어 요청');
    if (urgencyScore > 60) reasons.push('긴급 처리');
    
    return reasons.join(' + ') + ' 포함';
  }

  private static generateBasicReason(
    contractType: ContractType,
    complexity: ComplexityLevel,
    fileCount: number
  ): string {
    const reasons = [];
    
    if (contractType === ContractType.BUSINESS) reasons.push('비즈니스 계약');
    if (complexity === ComplexityLevel.MEDIUM) reasons.push('중간 복잡도');
    if (fileCount > 1) reasons.push('복수 파일');
    
    return reasons.join(' + ') + ' 분석';
  }

  static getPriceForPlan(plan: PlanType): string {
    return this.PLAN_PRICES[plan];
  }
}