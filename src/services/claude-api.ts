import { Anthropic } from '@anthropic-ai/sdk';

interface ClaudeConfig {
  apiKey: string;
  maxRetries: number;
  timeout: number;
}

interface ClaudeResponse {
  content: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

class ClaudeAPIService {
  private client: Anthropic;
  private config: ClaudeConfig;

  constructor() {
    this.config = {
      apiKey: process.env.CLAUDE_API_KEY || '',
      maxRetries: 3,
      timeout: 30000
    };

    if (!this.config.apiKey) {
      throw new Error('CLAUDE_API_KEY is required but not provided');
    }

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout
    });
  }

  async generateText(
    prompt: string,
    systemPrompt?: string,
    temperature = 0.7,
    maxTokens = 4000
  ): Promise<ClaudeResponse> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude API');
      }

      return {
        content: content.text,
        model: response.model,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens
        }
      };
    } catch (error) {
      console.error('Claude API error:', error);
      throw this.handleError(error);
    }
  }

  async generateWithRetry(
    prompt: string,
    systemPrompt?: string,
    options: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  ): Promise<ClaudeResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await this.generateText(prompt, systemPrompt);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === options.maxAttempts) {
          break;
        }

        const delay = Math.min(
          options.baseDelay * Math.pow(2, attempt - 1),
          options.maxDelay
        );

        console.warn(`Claude API attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private handleError(error: any): Error {
    if (error.status === 429) {
      return new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.status === 401) {
      return new Error('Invalid API key. Please check your Claude API configuration.');
    }
    
    if (error.status === 403) {
      return new Error('Access denied. Please check your API permissions.');
    }
    
    if (error.status >= 500) {
      return new Error('Claude API service is temporarily unavailable. Please try again later.');
    }

    return new Error(error.message || 'Unknown error occurred while calling Claude API');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.generateText('Test connection', 'You are a helpful assistant.', 0.1, 10);
      return true;
    } catch (error) {
      console.error('Claude API connection validation failed:', error);
      return false;
    }
  }
}

export const claudeAPI = new ClaudeAPIService();
export type { ClaudeResponse, ClaudeConfig, RetryOptions };