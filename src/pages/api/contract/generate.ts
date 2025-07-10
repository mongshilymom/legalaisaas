import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../features/auth/authOptions';

interface ContractTemplate {
  id: string;
  name: string;
  prompt: string;
}

const contractTemplates: ContractTemplate[] = [
  {
    id: 'freelancer',
    name: '프리랜서 계약서',
    prompt: `다음 정보를 바탕으로 프리랜서 계약서를 작성해주세요:

클라이언트: {clientName}
프리랜서: {freelancerName}
프로젝트 내용: {projectDescription}
계약 금액: {amount}원
계약 기간: {startDate} ~ {endDate}
지급 조건: {paymentTerms}

이 계약서는 한국 법률에 따라 작성되어야 하며, 다음 항목들을 포함해야 합니다:
- 계약 당사자 정보
- 업무 내용 및 범위
- 계약 기간
- 대가 및 지급 조건
- 지적재산권 귀속
- 비밀유지 조항
- 계약 해지 조건
- 분쟁 해결 방법

전문적이고 법적 구속력이 있는 계약서 형태로 작성해주세요.`
  },
  {
    id: 'employment',
    name: '근로 계약서',
    prompt: `다음 정보를 바탕으로 근로 계약서를 작성해주세요:

회사명: {companyName}
근로자명: {employeeName}
직위: {position}
급여: {salary}원
근무 시작일: {startDate}
근무지: {workLocation}
근무시간: {workHours}

이 계약서는 근로기준법에 따라 작성되어야 하며, 다음 항목들을 포함해야 합니다:
- 계약 당사자 정보
- 근무 장소 및 업무 내용
- 근무 시간
- 임금 및 지급 방법
- 휴게 시간
- 휴일 및 휴가
- 사회보험 가입
- 계약 해지 조건
- 기타 근로 조건

근로기준법에 부합하는 전문적인 근로 계약서 형태로 작성해주세요.`
  },
  {
    id: 'nda',
    name: '비밀유지 계약서',
    prompt: `다음 정보를 바탕으로 비밀유지 계약서를 작성해주세요:

정보 제공자: {disclosingParty}
정보 수신자: {receivingParty}
정보 제공 목적: {purposeOfDisclosure}
비밀유지 기간: {confidentialityPeriod}
위약금: {penaltyAmount}원

이 계약서는 다음 항목들을 포함해야 합니다:
- 계약 당사자 정보
- 기밀 정보의 정의
- 비밀유지 의무
- 기밀 정보 사용 제한
- 기밀 정보 반환 의무
- 비밀유지 기간
- 위반 시 손해배상
- 계약 해지 조건
- 분쟁 해결 방법

법적 구속력이 있는 전문적인 비밀유지 계약서 형태로 작성해주세요.`
  }
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { templateId, formData } = req.body;

    if (!templateId || !formData) {
      return res.status(400).json({ message: 'Template ID and form data are required' });
    }

    const template = contractTemplates.find(t => t.id === templateId);
    if (!template) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }

    // 템플릿 프롬프트에 사용자 데이터 삽입
    let prompt = template.prompt;
    Object.entries(formData).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value as string);
    });

    // AI 모델을 사용하여 계약서 생성
    const aiResponse = await generateContractWithAI(prompt);

    // 사용자 액션 로깅
    await logUserAction(session.user?.email || 'unknown', 'contract_generated', {
      templateId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      contract: aiResponse,
      templateName: template.name
    });

  } catch (error) {
    console.error('Contract generation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function generateContractWithAI(prompt: string): Promise<string> {
  try {
    // Claude API 사용
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback to OpenAI if Claude fails
    try {
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      });

      return response.choices[0].message.content || '';

    } catch (openaiError) {
      console.error('OpenAI fallback error:', openaiError);
      throw new Error('AI service unavailable');
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