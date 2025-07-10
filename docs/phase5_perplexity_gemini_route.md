# Phase 5: Perplexity & Gemini Route Enhancement Directive

## Executive Summary

This directive advances the AI routing system to Phase 5 by implementing specialized optimization for Perplexity and Gemini providers, including real-time search capabilities, multimodal processing, and enhanced reasoning workflows. The system provides intelligent provider selection, specialized caching strategies, and performance optimization tailored to each provider's unique capabilities.

## Strategic Objectives

### Core Goals
1. **Specialized Provider Optimization** - Maximize each provider's unique strengths
2. **Real-Time Intelligence** - Leverage Perplexity's search capabilities
3. **Multimodal Processing** - Utilize Gemini's multimodal abilities
4. **Intelligent Routing** - Dynamic provider selection based on task type
5. **Performance Optimization** - Provider-specific caching and optimization

### Key Innovations
- **Task-Aware Routing** - Automatic provider selection based on task characteristics
- **Hybrid Processing** - Combining multiple providers for optimal results
- **Contextual Caching** - Provider-specific cache strategies
- **Real-Time Updates** - Dynamic content updates via Perplexity
- **Multimodal Analysis** - Document analysis with images and text

## Architecture Overview

### Enhanced Provider System

```typescript
// src/services/enhanced-provider-router.ts
interface ProviderCapabilityMatrix {
  claude: {
    reasoning: 'excellent',
    analysis: 'excellent',
    creativity: 'good',
    realTime: 'none',
    multimodal: 'none',
    search: 'none'
  };
  perplexity: {
    reasoning: 'good',
    analysis: 'good',
    creativity: 'fair',
    realTime: 'excellent',
    multimodal: 'none',
    search: 'excellent'
  };
  gemini: {
    reasoning: 'excellent',
    analysis: 'excellent',
    creativity: 'excellent',
    realTime: 'none',
    multimodal: 'excellent',
    search: 'none'
  };
  openai: {
    reasoning: 'excellent',
    analysis: 'excellent',
    creativity: 'excellent',
    realTime: 'none',
    multimodal: 'limited',
    search: 'none'
  };
}

interface TaskCharacteristics {
  type: 'legal-analysis' | 'research' | 'translation' | 'comparison' | 'summarization';
  urgency: 'low' | 'medium' | 'high';
  complexity: 'simple' | 'medium' | 'complex';
  requiresRealTime: boolean;
  hasMultimedia: boolean;
  needsSearch: boolean;
  contextSize: 'small' | 'medium' | 'large';
  accuracyRequirement: 'standard' | 'high' | 'critical';
}

interface ProviderRoutingDecision {
  primaryProvider: string;
  secondaryProviders: string[];
  routingReason: string;
  expectedBenefits: string[];
  fallbackStrategy: string;
  estimatedCost: number;
  estimatedTime: number;
  confidence: number;
}
```

### Specialized Provider Services

#### 1. Enhanced Perplexity Service

```typescript
// src/services/enhanced-perplexity-service.ts
interface PerplexityRequest {
  query: string;
  searchMode: 'precise' | 'creative' | 'balanced';
  timeRange: 'day' | 'week' | 'month' | 'year' | 'all';
  sources: string[];
  language: string;
  contextWindow: number;
  citations: boolean;
  followUp: boolean;
}

interface PerplexityResponse {
  answer: string;
  sources: {
    title: string;
    url: string;
    snippet: string;
    relevance: number;
    publishedDate: string;
    domain: string;
  }[];
  citations: {
    index: number;
    text: string;
    source: string;
  }[];
  confidence: number;
  searchTime: number;
  followUpSuggestions: string[];
}

class EnhancedPerplexityService {
  private apiKey: string;
  private baseUrl: string;
  private requestCache: Map<string, PerplexityResponse>;
  private rateLimiter: RateLimiter;

  async searchLegalPrecedents(
    query: string,
    jurisdiction: string,
    dateRange: string
  ): Promise<PerplexityResponse> {
    const searchQuery = this.formatLegalQuery(query, jurisdiction, dateRange);
    
    return await this.makeRequest({
      query: searchQuery,
      searchMode: 'precise',
      timeRange: this.convertDateRange(dateRange),
      sources: this.getLegalSources(jurisdiction),
      language: 'en',
      contextWindow: 4000,
      citations: true,
      followUp: true
    });
  }

  async getRealtimeUpdates(
    topic: string,
    lastUpdate: Date
  ): Promise<PerplexityResponse> {
    return await this.makeRequest({
      query: `Latest updates on ${topic} since ${lastUpdate.toISOString()}`,
      searchMode: 'balanced',
      timeRange: 'day',
      sources: ['news', 'official', 'legal'],
      language: 'en',
      contextWindow: 3000,
      citations: true,
      followUp: false
    });
  }

  async researchComplianceChanges(
    regulation: string,
    region: string
  ): Promise<PerplexityResponse> {
    const query = `Recent changes to ${regulation} in ${region} compliance requirements`;
    
    return await this.makeRequest({
      query,
      searchMode: 'precise',
      timeRange: 'month',
      sources: this.getComplianceSources(region),
      language: 'en',
      contextWindow: 4000,
      citations: true,
      followUp: true
    });
  }

  private formatLegalQuery(query: string, jurisdiction: string, dateRange: string): string {
    return `${query} legal precedent ${jurisdiction} ${dateRange}`;
  }

  private getLegalSources(jurisdiction: string): string[] {
    const sources = {
      'US': ['justia.com', 'law.cornell.edu', 'courtlistener.com'],
      'UK': ['bailii.org', 'legislation.gov.uk', 'gov.uk'],
      'EU': ['eur-lex.europa.eu', 'curia.europa.eu'],
      'KR': ['law.go.kr', 'scourt.go.kr']
    };
    return sources[jurisdiction] || sources['US'];
  }

  private getComplianceSources(region: string): string[] {
    return ['official', 'government', 'regulatory', 'legal'];
  }
}
```

#### 2. Enhanced Gemini Service

```typescript
// src/services/enhanced-gemini-service.ts
interface GeminiMultimodalRequest {
  textInput: string;
  images?: {
    data: string; // base64
    mimeType: string;
    description?: string;
  }[];
  documents?: {
    content: string;
    type: 'pdf' | 'docx' | 'txt';
    metadata: any;
  }[];
  analysisType: 'contract' | 'compliance' | 'risk' | 'comparison';
  outputFormat: 'detailed' | 'summary' | 'structured';
  language: string;
  contextSize: 'standard' | 'large' | 'extended';
}

interface GeminiMultimodalResponse {
  analysis: {
    textAnalysis: any;
    imageAnalysis?: any[];
    documentAnalysis?: any[];
    crossModalInsights: any[];
  };
  confidence: number;
  processingTime: number;
  tokensUsed: number;
  warnings: string[];
  suggestions: string[];
}

class EnhancedGeminiService {
  private apiKey: string;
  private model: string;
  private generationConfig: any;
  private safetySettings: any;

  async analyzeMultimodalContract(
    request: GeminiMultimodalRequest
  ): Promise<GeminiMultimodalResponse> {
    const prompt = this.buildMultimodalPrompt(request);
    
    const parts = [
      { text: prompt },
      ...request.images?.map(img => ({
        inline_data: {
          mime_type: img.mimeType,
          data: img.data
        }
      })) || [],
      ...request.documents?.map(doc => ({
        text: `Document: ${doc.content}`
      })) || []
    ];

    const response = await this.generateContent(parts);
    return this.processMultimodalResponse(response, request);
  }

  async compareDocuments(
    document1: string,
    document2: string,
    comparisonType: 'structural' | 'semantic' | 'legal'
  ): Promise<GeminiMultimodalResponse> {
    const prompt = this.buildComparisonPrompt(document1, document2, comparisonType);
    
    const response = await this.generateContent([{ text: prompt }]);
    return this.processComparisonResponse(response, comparisonType);
  }

  async analyzeComplianceWithImages(
    contractText: string,
    complianceImages: { data: string; mimeType: string }[],
    regulations: string[]
  ): Promise<GeminiMultimodalResponse> {
    const prompt = this.buildCompliancePrompt(contractText, regulations);
    
    const parts = [
      { text: prompt },
      ...complianceImages.map(img => ({
        inline_data: {
          mime_type: img.mimeType,
          data: img.data
        }
      }))
    ];

    const response = await this.generateContent(parts);
    return this.processComplianceResponse(response, regulations);
  }

  private buildMultimodalPrompt(request: GeminiMultimodalRequest): string {
    return `
Analyze the following legal document with multimodal approach:

Text Content: ${request.textInput}

Analysis Type: ${request.analysisType}
Output Format: ${request.outputFormat}
Language: ${request.language}

${request.images?.length ? 'Images are provided for visual analysis.' : ''}
${request.documents?.length ? 'Additional documents are provided for context.' : ''}

Please provide:
1. Comprehensive text analysis
2. Visual element analysis (if images provided)
3. Cross-modal insights and correlations
4. Risk assessment and recommendations
5. Compliance evaluation

Focus on legal accuracy, practical implications, and actionable insights.
`;
  }

  private async generateContent(parts: any[]): Promise<any> {
    // Implementation for Gemini API call
    const response = await fetch(`${this.baseUrl}/generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings
      })
    });

    return response.json();
  }

  private processMultimodalResponse(
    response: any,
    request: GeminiMultimodalRequest
  ): GeminiMultimodalResponse {
    // Process and structure the response
    return {
      analysis: {
        textAnalysis: response.candidates[0].content.parts[0].text,
        imageAnalysis: request.images?.map((_, i) => ({
          index: i,
          analysis: 'Processed image analysis'
        })),
        documentAnalysis: request.documents?.map((_, i) => ({
          index: i,
          analysis: 'Processed document analysis'
        })),
        crossModalInsights: []
      },
      confidence: 0.92,
      processingTime: 2500,
      tokensUsed: 3500,
      warnings: [],
      suggestions: []
    };
  }
}
```

### Advanced Provider Router

```typescript
// src/services/advanced-provider-router.ts
class AdvancedProviderRouter {
  private capabilityMatrix: ProviderCapabilityMatrix;
  private routingHistory: Map<string, ProviderRoutingDecision[]>;
  private performanceMetrics: Map<string, ProviderPerformanceMetrics>;

  async routeRequest(
    request: any,
    characteristics: TaskCharacteristics
  ): Promise<ProviderRoutingDecision> {
    // Analyze task requirements
    const requirements = this.analyzeTaskRequirements(characteristics);
    
    // Score providers based on capabilities
    const providerScores = this.scoreProviders(requirements);
    
    // Make routing decision
    const decision = this.makeRoutingDecision(providerScores, characteristics);
    
    // Log decision for learning
    this.logRoutingDecision(request, decision);
    
    return decision;
  }

  private analyzeTaskRequirements(characteristics: TaskCharacteristics): TaskRequirements {
    const requirements: TaskRequirements = {
      capabilities: [],
      weights: {},
      constraints: {}
    };

    // Determine required capabilities
    if (characteristics.needsSearch) {
      requirements.capabilities.push('search');
      requirements.weights.search = 0.9;
    }

    if (characteristics.hasMultimedia) {
      requirements.capabilities.push('multimodal');
      requirements.weights.multimodal = 0.8;
    }

    if (characteristics.requiresRealTime) {
      requirements.capabilities.push('realTime');
      requirements.weights.realTime = 0.85;
    }

    // Set quality requirements
    if (characteristics.accuracyRequirement === 'critical') {
      requirements.weights.reasoning = 0.95;
      requirements.weights.analysis = 0.95;
    }

    return requirements;
  }

  private scoreProviders(requirements: TaskRequirements): Map<string, number> {
    const scores = new Map<string, number>();
    
    for (const [provider, capabilities] of Object.entries(this.capabilityMatrix)) {
      let score = 0;
      let maxScore = 0;
      
      for (const capability of requirements.capabilities) {
        const capabilityScore = this.getCapabilityScore(capabilities[capability]);
        const weight = requirements.weights[capability] || 1;
        
        score += capabilityScore * weight;
        maxScore += 100 * weight;
      }
      
      scores.set(provider, maxScore > 0 ? (score / maxScore) * 100 : 0);
    }
    
    return scores;
  }

  private getCapabilityScore(capability: string): number {
    const scoreMap = {
      'excellent': 100,
      'good': 75,
      'fair': 50,
      'limited': 25,
      'none': 0
    };
    return scoreMap[capability] || 0;
  }

  private makeRoutingDecision(
    scores: Map<string, number>,
    characteristics: TaskCharacteristics
  ): ProviderRoutingDecision {
    const sortedProviders = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    const primaryProvider = sortedProviders[0][0];
    const secondaryProviders = sortedProviders.slice(1, 3).map(([provider]) => provider);

    return {
      primaryProvider,
      secondaryProviders,
      routingReason: this.generateRoutingReason(primaryProvider, characteristics),
      expectedBenefits: this.getExpectedBenefits(primaryProvider, characteristics),
      fallbackStrategy: this.generateFallbackStrategy(secondaryProviders),
      estimatedCost: this.estimateCost(primaryProvider, characteristics),
      estimatedTime: this.estimateTime(primaryProvider, characteristics),
      confidence: scores.get(primaryProvider) || 0
    };
  }
}
```

### Specialized Cache Strategies

```typescript
// src/services/provider-specific-cache.ts
interface ProviderCacheStrategy {
  provider: string;
  keyStrategy: 'content-based' | 'semantic' | 'time-sensitive' | 'multimodal';
  ttl: number;
  compressionEnabled: boolean;
  invalidationTriggers: string[];
  warmupPatterns: string[];
}

class ProviderSpecificCache {
  private cacheStrategies: Map<string, ProviderCacheStrategy>;
  private perplexityCache: Map<string, PerplexityResponse>;
  private geminiCache: Map<string, GeminiMultimodalResponse>;

  constructor() {
    this.initializeCacheStrategies();
  }

  private initializeCacheStrategies(): void {
    this.cacheStrategies.set('perplexity', {
      provider: 'perplexity',
      keyStrategy: 'time-sensitive',
      ttl: 30 * 60 * 1000, // 30 minutes for real-time data
      compressionEnabled: true,
      invalidationTriggers: ['time-based', 'content-change'],
      warmupPatterns: ['legal-precedents', 'compliance-updates']
    });

    this.cacheStrategies.set('gemini', {
      provider: 'gemini',
      keyStrategy: 'multimodal',
      ttl: 24 * 60 * 60 * 1000, // 24 hours for multimodal analysis
      compressionEnabled: true,
      invalidationTriggers: ['content-change', 'version-update'],
      warmupPatterns: ['contract-analysis', 'document-comparison']
    });
  }

  async cachePerplexityResponse(
    query: string,
    response: PerplexityResponse,
    metadata: any
  ): Promise<void> {
    const strategy = this.cacheStrategies.get('perplexity');
    const cacheKey = this.generateTimeSensitiveCacheKey(query, metadata);
    
    // Store with TTL
    setTimeout(() => {
      this.perplexityCache.delete(cacheKey);
    }, strategy.ttl);
    
    this.perplexityCache.set(cacheKey, response);
  }

  async cacheGeminiResponse(
    request: GeminiMultimodalRequest,
    response: GeminiMultimodalResponse
  ): Promise<void> {
    const strategy = this.cacheStrategies.get('gemini');
    const cacheKey = this.generateMultimodalCacheKey(request);
    
    // Store with TTL
    setTimeout(() => {
      this.geminiCache.delete(cacheKey);
    }, strategy.ttl);
    
    this.geminiCache.set(cacheKey, response);
  }

  private generateTimeSensitiveCacheKey(query: string, metadata: any): string {
    const timeWindow = Math.floor(Date.now() / (15 * 60 * 1000)); // 15-minute windows
    return `perplexity_${this.hashString(query)}_${timeWindow}_${JSON.stringify(metadata)}`;
  }

  private generateMultimodalCacheKey(request: GeminiMultimodalRequest): string {
    const contentHash = this.hashString(request.textInput);
    const imageHashes = request.images?.map(img => this.hashString(img.data)).join('_') || '';
    const documentHashes = request.documents?.map(doc => this.hashString(doc.content)).join('_') || '';
    
    return `gemini_${contentHash}_${imageHashes}_${documentHashes}_${request.analysisType}`;
  }

  private hashString(str: string): string {
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}
```

## Enhanced API Routes

### 1. Perplexity Research Route

```typescript
// src/pages/api/research/perplexity-search.ts
interface PerplexitySearchRequest {
  query: string;
  searchType: 'legal-precedent' | 'compliance-update' | 'general-research';
  jurisdiction?: string;
  timeRange?: string;
  sources?: string[];
  language?: string;
  useCache?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    query,
    searchType,
    jurisdiction = 'US',
    timeRange = 'month',
    sources = [],
    language = 'en',
    useCache = true
  } = req.body as PerplexitySearchRequest;

  try {
    const perplexityService = new EnhancedPerplexityService();
    const cacheService = new ProviderSpecificCache();

    // Check cache first
    if (useCache) {
      const cacheKey = `perplexity_${searchType}_${query}_${jurisdiction}_${timeRange}`;
      const cached = await cacheService.getCachedResponse(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          data: cached,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    let result: PerplexityResponse;

    switch (searchType) {
      case 'legal-precedent':
        result = await perplexityService.searchLegalPrecedents(query, jurisdiction, timeRange);
        break;
      case 'compliance-update':
        result = await perplexityService.researchComplianceChanges(query, jurisdiction);
        break;
      case 'general-research':
        result = await perplexityService.makeRequest({
          query,
          searchMode: 'balanced',
          timeRange: timeRange as any,
          sources,
          language,
          contextWindow: 4000,
          citations: true,
          followUp: true
        });
        break;
      default:
        throw new Error(`Unsupported search type: ${searchType}`);
    }

    // Cache the result
    if (useCache) {
      await cacheService.cachePerplexityResponse(query, result, {
        searchType,
        jurisdiction,
        timeRange
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Perplexity search error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
```

### 2. Gemini Multimodal Route

```typescript
// src/pages/api/analysis/gemini-multimodal.ts
interface GeminiAnalysisRequest {
  textInput: string;
  images?: { data: string; mimeType: string; description?: string }[];
  documents?: { content: string; type: string; metadata: any }[];
  analysisType: 'contract' | 'compliance' | 'risk' | 'comparison';
  outputFormat: 'detailed' | 'summary' | 'structured';
  language?: string;
  useCache?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    textInput,
    images = [],
    documents = [],
    analysisType,
    outputFormat = 'detailed',
    language = 'en',
    useCache = true
  } = req.body as GeminiAnalysisRequest;

  try {
    const geminiService = new EnhancedGeminiService();
    const cacheService = new ProviderSpecificCache();

    const request: GeminiMultimodalRequest = {
      textInput,
      images,
      documents,
      analysisType,
      outputFormat,
      language,
      contextSize: 'large'
    };

    // Check cache first
    if (useCache) {
      const cacheKey = cacheService.generateMultimodalCacheKey(request);
      const cached = await cacheService.getCachedGeminiResponse(cacheKey);
      if (cached) {
        return res.status(200).json({
          success: true,
          data: cached,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    const result = await geminiService.analyzeMultimodalContract(request);

    // Cache the result
    if (useCache) {
      await cacheService.cacheGeminiResponse(request, result);
    }

    return res.status(200).json({
      success: true,
      data: result,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini multimodal analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
```

### 3. Hybrid Provider Route

```typescript
// src/pages/api/analysis/hybrid-provider.ts
interface HybridAnalysisRequest {
  textInput: string;
  images?: any[];
  taskType: 'comprehensive-analysis' | 'research-with-analysis' | 'multimodal-research';
  requirements: {
    needsRealTime: boolean;
    needsMultimodal: boolean;
    needsDeepReasoning: boolean;
    accuracyLevel: 'standard' | 'high' | 'critical';
  };
  useCache?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    textInput,
    images = [],
    taskType,
    requirements,
    useCache = true
  } = req.body as HybridAnalysisRequest;

  try {
    const router = new AdvancedProviderRouter();
    const perplexityService = new EnhancedPerplexityService();
    const geminiService = new EnhancedGeminiService();
    const claudeService = new EnhancedClaudeService();

    // Determine task characteristics
    const characteristics: TaskCharacteristics = {
      type: 'legal-analysis',
      urgency: 'medium',
      complexity: 'complex',
      requiresRealTime: requirements.needsRealTime,
      hasMultimedia: requirements.needsMultimodal,
      needsSearch: requirements.needsRealTime,
      contextSize: 'large',
      accuracyRequirement: requirements.accuracyLevel
    };

    // Get routing decision
    const routingDecision = await router.routeRequest(req.body, characteristics);

    let results: any = {};

    switch (taskType) {
      case 'comprehensive-analysis':
        // Use Claude for deep analysis
        results.analysis = await claudeService.analyzeContract(textInput);
        
        // Use Perplexity for real-time context if needed
        if (requirements.needsRealTime) {
          results.realtimeContext = await perplexityService.getRealtimeUpdates(
            'legal compliance updates',
            new Date(Date.now() - 24 * 60 * 60 * 1000)
          );
        }
        
        // Use Gemini for multimodal analysis if needed
        if (requirements.needsMultimodal && images.length > 0) {
          results.multimodalAnalysis = await geminiService.analyzeMultimodalContract({
            textInput,
            images,
            analysisType: 'contract',
            outputFormat: 'detailed',
            language: 'en',
            contextSize: 'large'
          });
        }
        break;

      case 'research-with-analysis':
        // Use Perplexity for research
        results.research = await perplexityService.searchLegalPrecedents(
          textInput,
          'US',
          'year'
        );
        
        // Use Claude for analysis of research results
        results.analysis = await claudeService.analyzeResearch(results.research);
        break;

      case 'multimodal-research':
        // Use Gemini for multimodal analysis
        results.multimodalAnalysis = await geminiService.analyzeMultimodalContract({
          textInput,
          images,
          analysisType: 'contract',
          outputFormat: 'detailed',
          language: 'en',
          contextSize: 'large'
        });
        
        // Use Perplexity for additional research
        results.research = await perplexityService.getRealtimeUpdates(
          textInput,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        );
        break;
    }

    return res.status(200).json({
      success: true,
      data: {
        results,
        routing: routingDecision,
        providers: Object.keys(results),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Hybrid provider analysis error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
```

## Advanced Features

### 1. Real-Time Compliance Monitoring

```typescript
// src/services/realtime-compliance-monitor.ts
class RealtimeComplianceMonitor {
  private monitoringActive: boolean = false;
  private watchedRegulations: Map<string, RegulationWatch>;
  private updateCallbacks: Map<string, (update: ComplianceUpdate) => void>;

  async startMonitoring(regulations: string[], jurisdiction: string): Promise<void> {
    this.monitoringActive = true;
    
    for (const regulation of regulations) {
      const watch: RegulationWatch = {
        regulation,
        jurisdiction,
        lastUpdate: new Date(),
        checkInterval: 60 * 60 * 1000, // 1 hour
        sources: this.getRegulationSources(regulation, jurisdiction)
      };
      
      this.watchedRegulations.set(regulation, watch);
      this.scheduleRegulationCheck(regulation);
    }
  }

  private async scheduleRegulationCheck(regulation: string): Promise<void> {
    const watch = this.watchedRegulations.get(regulation);
    if (!watch || !this.monitoringActive) return;

    setTimeout(async () => {
      try {
        const perplexityService = new EnhancedPerplexityService();
        const updates = await perplexityService.researchComplianceChanges(
          regulation,
          watch.jurisdiction
        );

        if (updates.sources.length > 0) {
          const complianceUpdate: ComplianceUpdate = {
            regulation,
            jurisdiction: watch.jurisdiction,
            updates: updates.sources,
            timestamp: new Date(),
            severity: this.assessUpdateSeverity(updates)
          };

          this.notifySubscribers(regulation, complianceUpdate);
        }

        // Schedule next check
        this.scheduleRegulationCheck(regulation);
      } catch (error) {
        console.error(`Error checking regulation ${regulation}:`, error);
      }
    }, watch.checkInterval);
  }

  subscribeToUpdates(
    regulation: string,
    callback: (update: ComplianceUpdate) => void
  ): void {
    this.updateCallbacks.set(regulation, callback);
  }

  private notifySubscribers(regulation: string, update: ComplianceUpdate): void {
    const callback = this.updateCallbacks.get(regulation);
    if (callback) {
      callback(update);
    }
  }
}
```

### 2. Multimodal Document Processor

```typescript
// src/services/multimodal-document-processor.ts
class MultimodalDocumentProcessor {
  private geminiService: EnhancedGeminiService;
  private ocrService: OCRService;
  private documentParser: DocumentParser;

  async processDocument(
    document: File,
    analysisType: 'contract' | 'compliance' | 'risk'
  ): Promise<MultimodalProcessingResult> {
    const processingSteps: ProcessingStep[] = [];

    // Step 1: Extract text and images
    const extractionResult = await this.extractContentFromDocument(document);
    processingSteps.push({
      step: 'content-extraction',
      status: 'completed',
      result: extractionResult
    });

    // Step 2: OCR for images with text
    const ocrResults = await this.performOCR(extractionResult.images);
    processingSteps.push({
      step: 'ocr-processing',
      status: 'completed',
      result: ocrResults
    });

    // Step 3: Multimodal analysis with Gemini
    const multimodalAnalysis = await this.geminiService.analyzeMultimodalContract({
      textInput: extractionResult.text,
      images: extractionResult.images,
      analysisType,
      outputFormat: 'detailed',
      language: 'en',
      contextSize: 'large'
    });
    processingSteps.push({
      step: 'multimodal-analysis',
      status: 'completed',
      result: multimodalAnalysis
    });

    // Step 4: Cross-reference with real-time data
    const realtimeContext = await this.getRealtimeContext(
      extractionResult.text,
      analysisType
    );
    processingSteps.push({
      step: 'realtime-context',
      status: 'completed',
      result: realtimeContext
    });

    return {
      documentId: crypto.randomUUID(),
      processingSteps,
      finalAnalysis: {
        textAnalysis: multimodalAnalysis.analysis.textAnalysis,
        imageAnalysis: multimodalAnalysis.analysis.imageAnalysis,
        crossModalInsights: multimodalAnalysis.analysis.crossModalInsights,
        realtimeContext
      },
      confidence: multimodalAnalysis.confidence,
      recommendations: this.generateRecommendations(multimodalAnalysis, realtimeContext)
    };
  }

  private async extractContentFromDocument(document: File): Promise<{
    text: string;
    images: { data: string; mimeType: string }[];
  }> {
    // Implementation for extracting text and images from various document types
    if (document.type === 'application/pdf') {
      return await this.extractFromPDF(document);
    } else if (document.type.startsWith('image/')) {
      return await this.extractFromImage(document);
    } else {
      throw new Error(`Unsupported document type: ${document.type}`);
    }
  }

  private async performOCR(images: { data: string; mimeType: string }[]): Promise<OCRResult[]> {
    const ocrResults: OCRResult[] = [];
    
    for (const image of images) {
      const ocrResult = await this.ocrService.extractText(image.data);
      ocrResults.push({
        imageData: image.data,
        extractedText: ocrResult.text,
        confidence: ocrResult.confidence,
        boundingBoxes: ocrResult.boundingBoxes
      });
    }
    
    return ocrResults;
  }

  private async getRealtimeContext(
    text: string,
    analysisType: string
  ): Promise<RealtimeContext> {
    const perplexityService = new EnhancedPerplexityService();
    
    const keywords = this.extractKeywords(text);
    const realtimeUpdates = await perplexityService.getRealtimeUpdates(
      keywords.join(' '),
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    return {
      keywords,
      recentUpdates: realtimeUpdates.sources,
      relevantNews: realtimeUpdates.followUpSuggestions,
      lastUpdateTime: new Date()
    };
  }
}
```

### 3. Provider Performance Optimizer

```typescript
// src/services/provider-performance-optimizer.ts
class ProviderPerformanceOptimizer {
  private performanceHistory: Map<string, PerformanceMetric[]>;
  private optimizationRules: Map<string, OptimizationRule>;

  async optimizeProviderSelection(
    taskHistory: TaskHistory[],
    currentLoad: ProviderLoadMetrics
  ): Promise<OptimizationRecommendations> {
    const recommendations: OptimizationRecommendations = {
      providerRecommendations: [],
      loadBalancingSuggestions: [],
      cacheOptimizations: [],
      costOptimizations: []
    };

    // Analyze historical performance
    const performanceAnalysis = this.analyzePerformanceHistory(taskHistory);
    
    // Generate provider recommendations
    recommendations.providerRecommendations = this.generateProviderRecommendations(
      performanceAnalysis,
      currentLoad
    );

    // Suggest load balancing improvements
    recommendations.loadBalancingSuggestions = this.generateLoadBalancingSuggestions(
      currentLoad,
      performanceAnalysis
    );

    // Optimize caching strategies
    recommendations.cacheOptimizations = this.generateCacheOptimizations(
      performanceAnalysis
    );

    // Cost optimization suggestions
    recommendations.costOptimizations = this.generateCostOptimizations(
      performanceAnalysis,
      currentLoad
    );

    return recommendations;
  }

  private analyzePerformanceHistory(taskHistory: TaskHistory[]): PerformanceAnalysis {
    const analysis: PerformanceAnalysis = {
      providerPerformance: new Map(),
      taskTypePerformance: new Map(),
      timePatterns: new Map(),
      errorPatterns: new Map()
    };

    for (const task of taskHistory) {
      // Analyze provider performance
      const providerMetrics = analysis.providerPerformance.get(task.provider) || {
        totalTasks: 0,
        successRate: 0,
        averageResponseTime: 0,
        averageCost: 0,
        errorRate: 0
      };

      providerMetrics.totalTasks++;
      providerMetrics.successRate = this.updateMovingAverage(
        providerMetrics.successRate,
        task.success ? 1 : 0,
        providerMetrics.totalTasks
      );
      providerMetrics.averageResponseTime = this.updateMovingAverage(
        providerMetrics.averageResponseTime,
        task.responseTime,
        providerMetrics.totalTasks
      );
      providerMetrics.averageCost = this.updateMovingAverage(
        providerMetrics.averageCost,
        task.cost,
        providerMetrics.totalTasks
      );

      analysis.providerPerformance.set(task.provider, providerMetrics);
    }

    return analysis;
  }

  private generateProviderRecommendations(
    analysis: PerformanceAnalysis,
    currentLoad: ProviderLoadMetrics
  ): ProviderRecommendation[] {
    const recommendations: ProviderRecommendation[] = [];

    for (const [provider, metrics] of analysis.providerPerformance.entries()) {
      const load = currentLoad.providerLoads.get(provider) || 0;
      
      if (metrics.successRate < 0.95 && load > 0.8) {
        recommendations.push({
          provider,
          recommendation: 'reduce-load',
          reason: `High load (${load}) with low success rate (${metrics.successRate})`,
          priority: 'high'
        });
      }

      if (metrics.averageResponseTime > 5000) {
        recommendations.push({
          provider,
          recommendation: 'optimize-requests',
          reason: `High average response time (${metrics.averageResponseTime}ms)`,
          priority: 'medium'
        });
      }

      if (metrics.averageCost > this.getCostThreshold(provider)) {
        recommendations.push({
          provider,
          recommendation: 'cost-optimization',
          reason: `High average cost (${metrics.averageCost})`,
          priority: 'medium'
        });
      }
    }

    return recommendations;
  }
}
```

## Integration Examples

### 1. Frontend Integration

```typescript
// src/hooks/useEnhancedProvider.ts
export const useEnhancedProvider = () => {
  const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics[]>([]);
  const [routingDecision, setRoutingDecision] = useState<ProviderRoutingDecision | null>(null);

  const analyzeWithHybridProvider = async (
    content: string,
    options: HybridAnalysisOptions
  ) => {
    const response = await fetch('/api/analysis/hybrid-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textInput: content,
        taskType: options.taskType,
        requirements: options.requirements,
        useCache: options.useCache
      })
    });

    const result = await response.json();
    setRoutingDecision(result.data.routing);
    
    return result.data.results;
  };

  const searchWithPerplexity = async (
    query: string,
    searchOptions: PerplexitySearchOptions
  ) => {
    const response = await fetch('/api/research/perplexity-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        ...searchOptions
      })
    });

    return response.json();
  };

  const analyzeWithGemini = async (
    content: string,
    images: File[],
    analysisType: string
  ) => {
    const imageData = await Promise.all(
      images.map(async (file) => ({
        data: await fileToBase64(file),
        mimeType: file.type,
        description: file.name
      }))
    );

    const response = await fetch('/api/analysis/gemini-multimodal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textInput: content,
        images: imageData,
        analysisType,
        outputFormat: 'detailed',
        useCache: true
      })
    });

    return response.json();
  };

  return {
    providerMetrics,
    routingDecision,
    analyzeWithHybridProvider,
    searchWithPerplexity,
    analyzeWithGemini
  };
};
```

### 2. React Component Example

```typescript
// src/components/EnhancedProviderAnalyzer.tsx
import React, { useState, useCallback } from 'react';
import { useEnhancedProvider } from '@/hooks/useEnhancedProvider';

interface EnhancedProviderAnalyzerProps {
  initialContent?: string;
  onAnalysisComplete?: (result: any) => void;
}

export const EnhancedProviderAnalyzer: React.FC<EnhancedProviderAnalyzerProps> = ({
  initialContent = '',
  onAnalysisComplete
}) => {
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<File[]>([]);
  const [analysisType, setAnalysisType] = useState<'contract' | 'compliance' | 'research'>('contract');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const {
    analyzeWithHybridProvider,
    searchWithPerplexity,
    analyzeWithGemini,
    routingDecision
  } = useEnhancedProvider();

  const handleAnalyze = useCallback(async () => {
    if (!content.trim()) return;

    setLoading(true);
    
    try {
      let analysisResults;

      switch (analysisType) {
        case 'contract':
          if (images.length > 0) {
            analysisResults = await analyzeWithGemini(content, images, 'contract');
          } else {
            analysisResults = await analyzeWithHybridProvider(content, {
              taskType: 'comprehensive-analysis',
              requirements: {
                needsRealTime: false,
                needsMultimodal: false,
                needsDeepReasoning: true,
                accuracyLevel: 'high'
              },
              useCache: true
            });
          }
          break;

        case 'compliance':
          analysisResults = await analyzeWithHybridProvider(content, {
            taskType: 'research-with-analysis',
            requirements: {
              needsRealTime: true,
              needsMultimodal: images.length > 0,
              needsDeepReasoning: true,
              accuracyLevel: 'critical'
            },
            useCache: true
          });
          break;

        case 'research':
          analysisResults = await searchWithPerplexity(content, {
            searchType: 'legal-precedent',
            jurisdiction: 'US',
            timeRange: 'year',
            useCache: true
          });
          break;
      }

      setResults(analysisResults);
      onAnalysisComplete?.(analysisResults);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  }, [content, images, analysisType, analyzeWithHybridProvider, searchWithPerplexity, analyzeWithGemini, onAnalysisComplete]);

  return (
    <div className="enhanced-provider-analyzer">
      <div className="content-input">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your legal document or query..."
          className="w-full h-32 p-4 border rounded-lg"
        />
      </div>

      <div className="options">
        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value as any)}
          className="p-2 border rounded"
        >
          <option value="contract">Contract Analysis</option>
          <option value="compliance">Compliance Research</option>
          <option value="research">Legal Research</option>
        </select>

        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => setImages(Array.from(e.target.files || []))}
          className="p-2 border rounded"
        />
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading || !content.trim()}
        className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {routingDecision && (
        <div className="routing-info mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Provider Routing Decision</h3>
          <p>Primary Provider: {routingDecision.primaryProvider}</p>
          <p>Reason: {routingDecision.routingReason}</p>
          <p>Confidence: {routingDecision.confidence}%</p>
        </div>
      )}

      {results && (
        <div className="results mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Analysis Results</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
```

## Performance Monitoring

### 1. Advanced Metrics Dashboard

```typescript
// src/services/enhanced-metrics-dashboard.ts
class EnhancedMetricsDashboard {
  async generateProviderComparisonReport(): Promise<ProviderComparisonReport> {
    const providers = ['claude', 'perplexity', 'gemini', 'openai'];
    const metrics = await Promise.all(
      providers.map(async (provider) => {
        const performance = await this.getProviderPerformance(provider);
        const specializations = await this.getProviderSpecializations(provider);
        
        return {
          provider,
          performance,
          specializations,
          costEfficiency: this.calculateCostEfficiency(performance),
          recommendedUseCases: this.getRecommendedUseCases(provider)
        };
      })
    );

    return {
      timestamp: new Date(),
      providerMetrics: metrics,
      recommendations: this.generateUsageRecommendations(metrics),
      trending: this.getTrendingPatterns(metrics)
    };
  }

  private async getProviderPerformance(provider: string): Promise<ProviderPerformance> {
    const history = await this.getProviderHistory(provider, 30); // 30 days
    
    return {
      averageResponseTime: this.calculateAverage(history.map(h => h.responseTime)),
      successRate: this.calculateSuccessRate(history),
      throughput: this.calculateThroughput(history),
      costPerRequest: this.calculateAverageCost(history),
      qualityScore: this.calculateQualityScore(history),
      uptime: this.calculateUptime(history)
    };
  }

  private getProviderSpecializations(provider: string): string[] {
    const specializations = {
      'claude': ['reasoning', 'analysis', 'long-context'],
      'perplexity': ['real-time', 'search', 'citations'],
      'gemini': ['multimodal', 'large-context', 'creativity'],
      'openai': ['general-purpose', 'coding', 'creativity']
    };
    
    return specializations[provider] || [];
  }
}
```

### 2. Cost Optimization Engine

```typescript
// src/services/cost-optimization-engine.ts
class CostOptimizationEngine {
  async optimizeCosts(
    usageHistory: UsageHistory[],
    budget: Budget
  ): Promise<CostOptimizationSuggestions> {
    const currentCosts = this.calculateCurrentCosts(usageHistory);
    const projectedCosts = this.projectCosts(usageHistory, budget.timeframe);
    
    const optimizations: CostOptimization[] = [];

    // Provider cost optimization
    const providerOptimizations = await this.analyzeProviderCosts(usageHistory);
    optimizations.push(...providerOptimizations);

    // Cache optimization for cost reduction
    const cacheOptimizations = await this.analyzeCacheEfficiency(usageHistory);
    optimizations.push(...cacheOptimizations);

    // Request optimization
    const requestOptimizations = await this.analyzeRequestPatterns(usageHistory);
    optimizations.push(...requestOptimizations);

    return {
      currentCosts,
      projectedCosts,
      optimizations,
      potentialSavings: this.calculatePotentialSavings(optimizations),
      recommendations: this.generateCostRecommendations(optimizations)
    };
  }

  private async analyzeProviderCosts(
    usageHistory: UsageHistory[]
  ): Promise<CostOptimization[]> {
    const optimizations: CostOptimization[] = [];
    
    // Analyze provider usage patterns
    const providerUsage = this.groupByProvider(usageHistory);
    
    for (const [provider, usage] of providerUsage.entries()) {
      const avgCost = this.calculateAverageCost(usage);
      const avgResponseTime = this.calculateAverageResponseTime(usage);
      
      // Check if cheaper alternatives exist
      const alternatives = await this.findCheaperAlternatives(provider, usage);
      
      if (alternatives.length > 0) {
        optimizations.push({
          type: 'provider-switch',
          provider,
          alternatives,
          potentialSavings: this.calculateSwitchSavings(usage, alternatives),
          impact: this.assessSwitchImpact(provider, alternatives),
          recommendation: `Consider switching to ${alternatives[0].provider} for ${alternatives[0].useCases.join(', ')}`
        });
      }
    }

    return optimizations;
  }
}
```

## Testing Strategy

### 1. Provider Integration Tests

```typescript
// src/tests/provider-integration.test.ts
describe('Enhanced Provider Integration', () => {
  let perplexityService: EnhancedPerplexityService;
  let geminiService: EnhancedGeminiService;
  let providerRouter: AdvancedProviderRouter;

  beforeEach(() => {
    perplexityService = new EnhancedPerplexityService();
    geminiService = new EnhancedGeminiService();
    providerRouter = new AdvancedProviderRouter();
  });

  describe('Perplexity Service', () => {
    it('should search legal precedents correctly', async () => {
      const result = await perplexityService.searchLegalPrecedents(
        'contract breach damages',
        'US',
        'year'
      );

      expect(result).toBeDefined();
      expect(result.sources).toHaveLength.greaterThan(0);
      expect(result.citations).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should provide real-time updates', async () => {
      const result = await perplexityService.getRealtimeUpdates(
        'GDPR compliance',
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      expect(result).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(result.followUpSuggestions).toBeDefined();
    });
  });

  describe('Gemini Service', () => {
    it('should analyze multimodal contracts', async () => {
      const mockImage = {
        data: 'base64-encoded-image',
        mimeType: 'image/jpeg'
      };

      const result = await geminiService.analyzeMultimodalContract({
        textInput: 'Sample contract text',
        images: [mockImage],
        analysisType: 'contract',
        outputFormat: 'detailed',
        language: 'en',
        contextSize: 'large'
      });

      expect(result).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.textAnalysis).toBeDefined();
      expect(result.analysis.imageAnalysis).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Provider Router', () => {
    it('should route tasks correctly based on characteristics', async () => {
      const characteristics: TaskCharacteristics = {
        type: 'legal-analysis',
        urgency: 'high',
        complexity: 'complex',
        requiresRealTime: true,
        hasMultimedia: false,
        needsSearch: true,
        contextSize: 'large',
        accuracyRequirement: 'critical'
      };

      const decision = await providerRouter.routeRequest({}, characteristics);

      expect(decision).toBeDefined();
      expect(decision.primaryProvider).toBe('perplexity'); // Should choose Perplexity for real-time search
      expect(decision.confidence).toBeGreaterThan(0.7);
    });
  });
});
```

### 2. Performance Tests

```typescript
// src/tests/performance.test.ts
describe('Provider Performance', () => {
  it('should handle concurrent requests efficiently', async () => {
    const promises = Array(10).fill(null).map((_, i) => 
      fetch('/api/analysis/hybrid-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textInput: `Test contract ${i}`,
          taskType: 'comprehensive-analysis',
          requirements: {
            needsRealTime: false,
            needsMultimodal: false,
            needsDeepReasoning: true,
            accuracyLevel: 'high'
          }
        })
      })
    );

    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));

    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  it('should maintain performance under load', async () => {
    const startTime = Date.now();
    
    const promises = Array(50).fill(null).map(() => 
      fetch('/api/research/perplexity-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'legal precedent search',
          searchType: 'legal-precedent',
          jurisdiction: 'US',
          timeRange: 'month'
        })
      })
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
    expect(responses.every(r => r.ok)).toBe(true);
  });
});
```

## Deployment Configuration

### 1. Environment Variables

```bash
# Enhanced Provider Configuration
PERPLEXITY_API_KEY=pplx-your-api-key-here
PERPLEXITY_MODEL=pplx-7b-online
PERPLEXITY_MAX_TOKENS=4000
PERPLEXITY_TEMPERATURE=0.7
PERPLEXITY_TIMEOUT=30000

GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=8000
GEMINI_TEMPERATURE=0.7
GEMINI_TIMEOUT=45000

# Provider Routing Configuration
PROVIDER_ROUTING_ENABLED=true
PROVIDER_SELECTION_ALGORITHM=advanced
PROVIDER_FALLBACK_ENABLED=true
PROVIDER_LOAD_BALANCING=true

# Cache Configuration
PROVIDER_CACHE_ENABLED=true
PERPLEXITY_CACHE_TTL=1800000  # 30 minutes
GEMINI_CACHE_TTL=86400000     # 24 hours
CACHE_COMPRESSION_ENABLED=true

# Performance Monitoring
PROVIDER_MONITORING_ENABLED=true
METRICS_COLLECTION_INTERVAL=60000
PERFORMANCE_ALERTS_ENABLED=true
COST_MONITORING_ENABLED=true
```

### 2. Database Schema Extensions

```sql
-- Provider performance metrics
CREATE TABLE provider_performance (
  id VARCHAR(255) PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  value DECIMAL(10,4) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  INDEX idx_provider_timestamp (provider, timestamp),
  INDEX idx_metric_type (metric_type)
);

-- Provider routing decisions
CREATE TABLE provider_routing_logs (
  id VARCHAR(255) PRIMARY KEY,
  request_id VARCHAR(255) NOT NULL,
  primary_provider VARCHAR(50) NOT NULL,
  secondary_providers JSON,
  routing_reason TEXT,
  characteristics JSON,
  decision_confidence DECIMAL(3,2),
  actual_provider VARCHAR(50),
  success BOOLEAN,
  response_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_request_id (request_id),
  INDEX idx_primary_provider (primary_provider),
  INDEX idx_created_at (created_at)
);

-- Multimodal analysis cache
CREATE TABLE multimodal_cache (
  id VARCHAR(255) PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  provider VARCHAR(50) NOT NULL,
  text_input_hash VARCHAR(64) NOT NULL,
  image_hashes JSON,
  analysis_type VARCHAR(50) NOT NULL,
  result JSON NOT NULL,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  INDEX idx_cache_key (cache_key),
  INDEX idx_provider (provider),
  INDEX idx_expires_at (expires_at)
);

-- Real-time compliance monitoring
CREATE TABLE compliance_monitoring (
  id VARCHAR(255) PRIMARY KEY,
  regulation VARCHAR(255) NOT NULL,
  jurisdiction VARCHAR(100) NOT NULL,
  monitoring_active BOOLEAN DEFAULT TRUE,
  last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_interval INTEGER DEFAULT 3600000,
  sources JSON,
  subscribers JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_regulation (regulation),
  INDEX idx_jurisdiction (jurisdiction),
  INDEX idx_monitoring_active (monitoring_active)
);
```

## Success Metrics

### Performance Targets
- Multi-provider response time: <3s
- Real-time search accuracy: >85%
- Multimodal analysis confidence: >90%
- Provider routing accuracy: >95%
- Cache hit rate improvement: >20%

### Business Impact
- Cost reduction through optimization: 40%
- Improved analysis quality: 60%
- Enhanced real-time capabilities: 80%
- Better multimodal support: 90%
- Increased user satisfaction: 70%

## Future Enhancements

### Phase 6 Preview
- **Advanced ML Pipeline**: Custom model training for provider selection
- **Blockchain Integration**: Immutable audit trails for legal analysis
- **Voice Interface**: Speech-to-text analysis capabilities
- **Advanced Analytics**: Predictive analysis for legal trends
- **Enterprise Features**: Multi-tenant support and advanced security

## Conclusion

Phase 5 represents a significant advancement in AI provider optimization, introducing specialized capabilities for Perplexity and Gemini while maintaining the robust foundation established in previous phases. The system now provides:

1. **Intelligent Provider Selection** - Task-aware routing maximizes each provider's strengths
2. **Real-Time Intelligence** - Perplexity integration enables up-to-date legal research
3. **Multimodal Processing** - Gemini integration supports document analysis with images
4. **Hybrid Processing** - Combines multiple providers for optimal results
5. **Cost Optimization** - Advanced cost management and optimization suggestions

This enhancement positions the Legal AI SaaS platform as a leader in intelligent AI provider management, delivering superior performance, cost efficiency, and user experience while maintaining the highest standards of legal accuracy and reliability.

The system's ability to dynamically select the best provider for each task, combined with real-time capabilities and multimodal processing, creates a powerful platform that can handle the most complex legal analysis requirements while optimizing for cost and performance.