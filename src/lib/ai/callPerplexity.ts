interface PerplexityConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class PerplexityService {
  private config: PerplexityConfig;

  constructor() {
    this.config = {
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      baseUrl: 'https://api.perplexity.ai',
      model: 'llama-3.1-sonar-large-128k-online',
      maxTokens: 4000,
      temperature: 0.7
    };

    if (!this.config.apiKey) {
      console.warn('Perplexity API key not configured');
    }
  }

  async generateReport(contractText: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const prompt = `
다음 계약서 내용을 분석하여 포괄적인 법적 리스크 보고서를 작성해주세요:

계약서 내용:
${contractText}

다음 형식으로 분석 결과를 제공해주세요:
1. 주요 리스크 요소
2. 법적 준수 사항
3. 개선 권장사항
4. 잠재적 분쟁 지점
5. 전략적 대응 방안

각 항목에 대해 구체적이고 실행 가능한 조언을 제공해주세요.
`;

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a senior legal expert specializing in contract analysis and risk assessment. Provide comprehensive and actionable legal advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
      }

      const data: PerplexityResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Perplexity API');
      }

      const content = data.choices[0].message.content;
      
      // Parse the response into structured format
      const structuredResult = this.parsePerplexityResponse(content);
      
      return {
        ...structuredResult,
        metadata: {
          provider: 'perplexity',
          model: data.model,
          tokens: data.usage,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Perplexity API call failed:', error);
      throw error;
    }
  }

  private parsePerplexityResponse(content: string): any {
    // Parse the structured response from Perplexity
    const sections = content.split(/\d+\./);
    
    const result = {
      summary: '종합 법적 리스크 분석 완료',
      riskFactors: [],
      complianceIssues: [],
      recommendations: [],
      disputePoints: [],
      strategicActions: []
    };

    sections.forEach((section, index) => {
      const trimmed = section.trim();
      if (!trimmed) return;

      switch (index) {
        case 1: // 주요 리스크 요소
          result.riskFactors = this.extractListItems(trimmed);
          break;
        case 2: // 법적 준수 사항
          result.complianceIssues = this.extractListItems(trimmed);
          break;
        case 3: // 개선 권장사항
          result.recommendations = this.extractListItems(trimmed);
          break;
        case 4: // 잠재적 분쟁 지점
          result.disputePoints = this.extractListItems(trimmed);
          break;
        case 5: // 전략적 대응 방안
          result.strategicActions = this.extractListItems(trimmed);
          break;
      }
    });

    return result;
  }

  private extractListItems(text: string): string[] {
    const lines = text.split('\n');
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
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: 'Health check test'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Perplexity health check failed:', error);
      return false;
    }
  }

  getProviderInfo(): any {
    return {
      name: 'Perplexity',
      model: this.config.model,
      configured: !!this.config.apiKey,
      capabilities: [
        'Real-time information',
        'Legal analysis',
        'Risk assessment',
        'Compliance checking'
      ]
    };
  }
}

const perplexityService = new PerplexityService();

export async function callPerplexityReport(contractText: string): Promise<any> {
  return await perplexityService.generateReport(contractText);
}

export { perplexityService };