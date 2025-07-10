export interface StrategyLog {
  id: string;
  userId: string;
  analysisRequestId: string;
  strategyType: 'strategic-report' | 'upsell-recommendation' | 'i18n-strategy';
  strategySummary: string;
  fullReport: any;
  confidence: number;
  language: string;
  jurisdiction?: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isActive: boolean;
  metadata: {
    contractType?: string;
    riskLevel?: string;
    industryType?: string;
    companySize?: string;
    processingTime?: number;
    tokenUsage?: {
      input: number;
      output: number;
    };
  };
}

export interface StrategyLogCreateRequest {
  userId: string;
  analysisRequestId: string;
  strategyType: 'strategic-report' | 'upsell-recommendation' | 'i18n-strategy';
  strategySummary: string;
  fullReport: any;
  confidence: number;
  language?: string;
  jurisdiction?: string;
  tags?: string[];
  metadata?: {
    contractType?: string;
    riskLevel?: string;
    industryType?: string;
    companySize?: string;
    processingTime?: number;
    tokenUsage?: {
      input: number;
      output: number;
    };
  };
}

export interface StrategyLogUpdateRequest {
  id: string;
  strategySummary?: string;
  fullReport?: any;
  confidence?: number;
  tags?: string[];
  metadata?: any;
}

export interface StrategyLogSearchRequest {
  userId: string;
  strategyType?: 'strategic-report' | 'upsell-recommendation' | 'i18n-strategy';
  language?: string;
  jurisdiction?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface StrategyLogAnalytics {
  totalReports: number;
  averageConfidence: number;
  mostUsedLanguage: string;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
  strategyTypeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    averageConfidence: number;
  }>;
}