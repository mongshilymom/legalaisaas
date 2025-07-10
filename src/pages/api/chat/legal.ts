import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../features/auth/authOptions';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const systemPrompt = `당신은 한국 법률 전문 AI 상담사입니다. 다음 규칙을 준수해주세요:

1. 한국 법률에 기반한 정확한 정보를 제공합니다.
2. 복잡한 법률 용어는 쉽게 설명해주세요.
3. 구체적인 법적 조언보다는 일반적인 법률 정보를 제공합니다.
4. 전문적인 법률 상담이 필요한 경우 변호사 상담을 권유합니다.
5. 응답은 친근하고 이해하기 쉽게 작성합니다.
6. 불확실한 정보는 추측하지 않고 정확한 정보만 제공합니다.

주요 전문 분야:
- 계약서 작성 및 검토
- 근로계약 및 고용법
- 민사 분쟁
- 개인정보보호법
- 전자상거래법
- 저작권 및 지적재산권
- 스타트업 및 사업 관련 법률

응답 형식:
- 핵심 답변을 먼저 제시
- 필요시 관련 법령 조항 언급
- 실무적 조언 포함
- 추가 주의사항 안내`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'Message is required' });
    }

    // 메시지 길이 제한
    if (message.length > 1000) {
      return res.status(400).json({ message: 'Message too long' });
    }

    // AI 응답 생성
    const response = await generateLegalResponse(message, history || []);

    // 사용자 액션 로깅
    await logUserAction(session.user?.email || 'unknown', 'legal_chat', {
      messageLength: message.length,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Legal chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function generateLegalResponse(message: string, history: ChatMessage[]): Promise<string> {
  try {
    // 대화 컨텍스트 구성
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    // Claude API 사용
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 2000,
      temperature: 0.7,
      messages: messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.role === 'system' ? 
          `시스템 지시사항: ${msg.content}\n\n사용자 질문: ${message}` : 
          msg.content
      })).slice(-6) // 최근 6개 메시지만 사용
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';

  } catch (error) {
    console.error('Claude API error:', error);
    
    // Fallback to OpenAI
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: messages.slice(-8), // 최근 8개 메시지만 사용
        max_tokens: 2000,
        temperature: 0.7
      });

      return response.choices[0].message.content || '';

    } catch (openaiError) {
      console.error('OpenAI fallback error:', openaiError);
      
      // 기본 응답 반환
      return `죄송합니다. 현재 AI 서비스에 일시적인 문제가 발생했습니다. 

다음과 같은 방법으로 도움을 받으실 수 있습니다:
1. 잠시 후 다시 시도해주세요
2. 구체적인 법률 상담이 필요하시면 변호사 상담을 받으시기 바랍니다
3. 법률구조공단(국번없이 132)에서 무료 법률 상담을 받으실 수 있습니다

문의하신 내용: "${message.length > 50 ? message.substring(0, 50) + '...' : message}"`;
    }
  }
}

async function logUserAction(email: string, action: string, data: any) {
  try {
    const { logUserAction } = await import('../../../lib/logUserAction');
    await logUserAction(email, action, data);
  } catch (error) {
    console.error('Logging error:', error);
  }
}