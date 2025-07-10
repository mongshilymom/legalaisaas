export interface UserInput {
  question: string;
  files?: File[];
  contractType?: ContractType;
  userTier?: UserTier;
  timestamp: Date;
}

export interface UrgencyContext {
  hasTimeKeywords: boolean;
  keywords: string[];
  urgencyScore: number;
}

export interface SuggestedAction {
  plan: PlanType;
  reason: string;
  priceRecommendation: string;
  suggestedFeature: string[];
}

export interface RecommendationResult {
  suggestedAction: SuggestedAction;
  urgencyContext: UrgencyContext;
  analysisData: AnalysisData;
}

export interface AnalysisData {
  complexity: ComplexityLevel;
  fileCount: number;
  hasMultiLanguage: boolean;
  estimatedProcessingTime: number;
}

export enum ContractType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
  LEGAL_REVIEW = 'legal_review',
  COMPLIANCE = 'compliance'
}

export enum UserTier {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium'
}

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium'
}

export enum ComplexityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}