import { OpenAI } from 'openai';

interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface OpenAIResponse {
  content: string;
  metadata: {
    provider: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    timestamp: string;
  };
}

class OpenAIService {
  private config: OpenAIConfig;
  private openai: OpenAI | null = null;

  constructor() {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 4000
    };

    if (this.config.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey
      });
    } else {
      console.warn('OpenAI API key not configured');
    }
  }

  async generateAnalysis(params: {
    userId: string;
    contractId: string;
    contractText: string;
    summary: string;
    riskPoints: string[];
    language: string;
    jurisdiction?: string;
  }): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI API not configured');
    }

    const systemPrompt = `
You are a senior legal analyst specializing in contract review and risk assessment. 
Your expertise covers multiple jurisdictions and contract types.

Analyze the provided contract information and generate a comprehensive legal analysis report.
Focus on practical, actionable insights that can help mitigate legal risks.

Provide your analysis in Korean language unless otherwise specified.
`;

    const userPrompt = `
계약서 분석 요청:

사용자 ID: ${params.userId}
계약 ID: ${params.contractId}
언어: ${params.language}
관할권: ${params.jurisdiction || '일반'}

계약서 내용:
${params.contractText}

기존 요약:
${params.summary}

식별된 리스크 포인트:
${params.riskPoints.map((risk, index) => `${index + 1}. ${risk}`).join('\n')}

다음 구조로 종합 분석 보고서를 작성해주세요:

1. 계약서 전체 평가
   - 계약의 성격과 목적
   - 법적 유효성 검토
   - 전반적인 리스크 수준

2. 상세 리스크 분석
   - 각 리스크 포인트에 대한 구체적 분석
   - 리스크 발생 가능성 및 영향도
   - 관련 법적 조항 및 판례

3. 완화 전략
   - 즉시 조치 가능한 완화 방안
   - 중장기 리스크 관리 전략
   - 협상 시 고려사항

4. 권장사항
   - 계약 개선 방안
   - 추가 검토 필요 사항
   - 전문가 상담 권장 영역

각 항목에 대해 구체적이고 실행 가능한 조언을 제공해주세요.
`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      const choice = completion.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI API');
      }

      const content = choice.message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI API');
      }

      const structuredResult = this.parseOpenAIResponse(content);
      
      return {
        ...structuredResult,
        metadata: {
          provider: 'openai',
          model: completion.model,
          usage: {
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0
          },
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  private parseOpenAIResponse(content: string): any {
    const sections = content.split(/\d+\./);
    
    const result = {
      summary: '계약서 종합 법적 분석 완료',
      overallAssessment: {
        contractNature: '',
        legalValidity: '',
        riskLevel: ''
      },
      detailedRiskAnalysis: {
        specificRisks: [],
        probabilityAndImpact: [],
        legalProvisions: []
      },
      mitigationStrategies: {
        immediateActions: [],
        longTermStrategies: [],
        negotiationConsiderations: []
      },
      recommendations: {
        improvements: [],
        additionalReview: [],
        expertConsultation: []
      }
    };

    sections.forEach((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return;

      switch (index) {
        case 1: // 계약서 전체 평가
          this.parseOverallAssessment(trimmed, result.overallAssessment);
          break;
        case 2: // 상세 리스크 분석
          this.parseDetailedRiskAnalysis(trimmed, result.detailedRiskAnalysis);
          break;
        case 3: // 완화 전략
          this.parseMitigationStrategies(trimmed, result.mitigationStrategies);
          break;
        case 4: // 권장사항
          this.parseRecommendations(trimmed, result.recommendations);
          break;
      }
    });

    return result;
  }

  private parseOverallAssessment(text: string, assessment: any): void {
    const lines = text.split('\n');
    const items = this.extractListItems(lines);
    
    assessment.contractNature = items[0] || '';
    assessment.legalValidity = items[1] || '';
    assessment.riskLevel = items[2] || '';
  }

  private parseDetailedRiskAnalysis(text: string, analysis: any): void {
    const subsections = text.split('-');
    
    subsections.forEach(subsection => {
      const trimmed = subsection.trim();
      const items = this.extractListItems(trimmed.split('\n'));
      
      if (trimmed.includes('구체적') || trimmed.includes('분석')) {
        analysis.specificRisks = items;
      } else if (trimmed.includes('가능성') || trimmed.includes('영향')) {
        analysis.probabilityAndImpact = items;
      } else if (trimmed.includes('법적') || trimmed.includes('조항')) {
        analysis.legalProvisions = items;
      }
    });
  }

  private parseMitigationStrategies(text: string, strategies: any): void {
    const subsections = text.split('-');
    
    subsections.forEach(subsection => {
      const trimmed = subsection.trim();
      const items = this.extractListItems(trimmed.split('\n'));
      
      if (trimmed.includes('즉시') || trimmed.includes('조치')) {
        strategies.immediateActions = items;
      } else if (trimmed.includes('중장기') || trimmed.includes('전략')) {
        strategies.longTermStrategies = items;
      } else if (trimmed.includes('협상') || trimmed.includes('고려')) {
        strategies.negotiationConsiderations = items;
      }
    });
  }

  private parseRecommendations(text: string, recommendations: any): void {
    const subsections = text.split('-');
    
    subsections.forEach(subsection => {
      const trimmed = subsection.trim();
      const items = this.extractListItems(trimmed.split('\n'));
      
      if (trimmed.includes('개선') || trimmed.includes('방안')) {
        recommendations.improvements = items;
      } else if (trimmed.includes('추가') || trimmed.includes('검토')) {
        recommendations.additionalReview = items;
      } else if (trimmed.includes('전문가') || trimmed.includes('상담')) {
        recommendations.expertConsultation = items;
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
    if (!this.openai) {
      return false;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: 'Health check test'
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      return !!completion.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  getProviderInfo(): any {
    return {
      name: 'OpenAI',
      model: this.config.model,
      configured: !!this.config.apiKey,
      capabilities: [
        'Advanced reasoning',
        'Legal analysis',
        'Multilingual support',
        'Structured output'
      ]
    };
  }
}

const openaiService = new OpenAIService();

export async function callOpenAIAnalysis(params: {
  userId: string;
  contractId: string;
  contractText: string;
  summary: string;
  riskPoints: string[];
  language: string;
  jurisdiction?: string;
}): Promise<any> {
  return await openaiService.generateAnalysis(params);
}

export { openaiService };