import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface GeminiResponse {
  text: string;
  metadata: {
    provider: string;
    model: string;
    timestamp: string;
  };
}

class GeminiService {
  private config: GeminiConfig;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-1.5-pro',
      temperature: 0.7,
      maxTokens: 4000
    };

    if (this.config.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    } else {
      console.warn('Gemini API key not configured');
    }
  }

  async generateSummary(contractText: string): Promise<any> {
    if (!this.genAI) {
      throw new Error('Gemini API not configured');
    }

    const model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens
      }
    });

    const prompt = `
다음 계약서를 분석하여 종합적인 요약 보고서를 작성해주세요:

계약서 내용:
${contractText}

다음 구조로 분석 결과를 제공해주세요:

1. 계약서 개요
   - 계약 유형
   - 당사자 정보
   - 계약 기간
   - 주요 조건

2. 핵심 조항 분석
   - 권리와 의무
   - 성과 요구사항
   - 책임 한계
   - 분쟁 해결 방법

3. 리스크 평가
   - 높은 리스크 요소
   - 중간 리스크 요소
   - 낮은 리스크 요소

4. 권장사항
   - 즉시 조치 사항
   - 협상 포인트
   - 보완 필요 조항

각 항목에 대해 명확하고 구체적인 분석을 제공해주세요.
`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini API');
      }

      const structuredResult = this.parseGeminiResponse(text);
      
      return {
        ...structuredResult,
        metadata: {
          provider: 'gemini',
          model: this.config.model,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Gemini API call failed:', error);
      throw error;
    }
  }

  private parseGeminiResponse(text: string): any {
    const sections = text.split(/\d+\./);
    
    const result = {
      summary: '계약서 종합 분석 완료',
      overview: {
        contractType: '',
        parties: [],
        duration: '',
        keyTerms: []
      },
      keyProvisions: {
        rightsAndObligations: [],
        performanceRequirements: [],
        liabilityLimitations: [],
        disputeResolution: []
      },
      riskAssessment: {
        highRisk: [],
        mediumRisk: [],
        lowRisk: []
      },
      recommendations: {
        immediateActions: [],
        negotiationPoints: [],
        amendmentNeeds: []
      }
    };

    sections.forEach((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return;

      switch (index) {
        case 1: // 계약서 개요
          this.parseOverviewSection(trimmed, result.overview);
          break;
        case 2: // 핵심 조항 분석
          this.parseKeyProvisionsSection(trimmed, result.keyProvisions);
          break;
        case 3: // 리스크 평가
          this.parseRiskAssessmentSection(trimmed, result.riskAssessment);
          break;
        case 4: // 권장사항
          this.parseRecommendationsSection(trimmed, result.recommendations);
          break;
      }
    });

    return result;
  }

  private parseOverviewSection(text: string, overview: any): void {
    const lines = text.split('\n');
    const items = this.extractListItems(lines);
    
    overview.contractType = items[0] || '';
    overview.parties = items.slice(1, 3);
    overview.duration = items[3] || '';
    overview.keyTerms = items.slice(4);
  }

  private parseKeyProvisionsSection(text: string, keyProvisions: any): void {
    const lines = text.split('\n');
    const items = this.extractListItems(lines);
    
    keyProvisions.rightsAndObligations = items.slice(0, 3);
    keyProvisions.performanceRequirements = items.slice(3, 5);
    keyProvisions.liabilityLimitations = items.slice(5, 7);
    keyProvisions.disputeResolution = items.slice(7, 9);
  }

  private parseRiskAssessmentSection(text: string, riskAssessment: any): void {
    const subsections = text.split('-');
    
    subsections.forEach(subsection => {
      const trimmed = subsection.trim();
      if (trimmed.includes('높은')) {
        riskAssessment.highRisk = this.extractListItems(trimmed.split('\n'));
      } else if (trimmed.includes('중간')) {
        riskAssessment.mediumRisk = this.extractListItems(trimmed.split('\n'));
      } else if (trimmed.includes('낮은')) {
        riskAssessment.lowRisk = this.extractListItems(trimmed.split('\n'));
      }
    });
  }

  private parseRecommendationsSection(text: string, recommendations: any): void {
    const subsections = text.split('-');
    
    subsections.forEach(subsection => {
      const trimmed = subsection.trim();
      if (trimmed.includes('즉시')) {
        recommendations.immediateActions = this.extractListItems(trimmed.split('\n'));
      } else if (trimmed.includes('협상')) {
        recommendations.negotiationPoints = this.extractListItems(trimmed.split('\n'));
      } else if (trimmed.includes('보완')) {
        recommendations.amendmentNeeds = this.extractListItems(trimmed.split('\n'));
      }
    });
  }

  private extractListItems(lines: string[]): string[] {
    const items: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
        items.push(trimmed.substring(1).trim());
      } else if (trimmed && trimmed.length > 10) {
        items.push(trimmed);
      }
    });

    return items.slice(0, 5); // Limit to 5 items per section
  }

  async healthCheck(): Promise<boolean> {
    if (!this.genAI) {
      return false;
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10
        }
      });

      const result = await model.generateContent('Health check test');
      const response = await result.response;
      return !!response.text();
    } catch (error) {
      console.error('Gemini health check failed:', error);
      return false;
    }
  }

  getProviderInfo(): any {
    return {
      name: 'Gemini',
      model: this.config.model,
      configured: !!this.config.apiKey,
      capabilities: [
        'Multimodal understanding',
        'Long context processing',
        'Legal document analysis',
        'Structured reasoning'
      ]
    };
  }
}

const geminiService = new GeminiService();

export async function callGeminiSummary(contractText: string): Promise<any> {
  return await geminiService.generateSummary(contractText);
}

export { geminiService };