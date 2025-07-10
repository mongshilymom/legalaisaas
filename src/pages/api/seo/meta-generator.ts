import { NextApiRequest, NextApiResponse } from 'next';
import { callClaudeAI } from '../../../services/claude-api';

// Input interface as specified
interface MetaGeneratorRequest {
  title: string;
  content: string;
  locale?: string; // ko, en, ja 등
}

// Output interface as specified
interface MetaGeneratorResponse {
  metaTitle: string;
  metaDescription: string;
  openGraphImageUrl?: string;
  keywords: string[];
}

function generateMetaPrompt(data: MetaGeneratorRequest): string {
  const { title, content, locale = 'ko' } = data;
  
  const languageInstructions = {
    ko: '한국어로 생성해주세요',
    en: 'Generate in English',
    ja: '日本語で生成してください',
    zh: '请用中文生成'
  };

  return `당신은 SEO 전문가입니다. 다음 정보를 바탕으로 검색 엔진 최적화된 메타 태그를 생성해주세요.

입력 정보:
- 제목: ${title}
- 콘텐츠: ${content}
- 언어: ${locale}

다음 JSON 형식으로 응답해주세요:
{
  "metaTitle": "SEO 최적화된 제목 (60자 이내)",
  "metaDescription": "SEO 최적화된 설명 (160자 이내)", 
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "openGraphImageUrl": "https://example.com/og-image.jpg"
}

요구사항:
1. ${languageInstructions[locale as keyof typeof languageInstructions] || languageInstructions.ko}
2. 메타 제목은 검색 결과에서 눈에 띄도록 매력적이어야 합니다
3. 메타 설명은 클릭을 유도하는 내용이어야 합니다
4. 키워드는 법률 AI SaaS와 관련된 검색어를 포함해야 합니다
5. 법률, AI, 자동화, SaaS 관련 키워드를 적절히 포함하세요
6. 응답은 반드시 유효한 JSON 형식이어야 합니다`;
}

function parseMetaResponse(response: string): MetaGeneratorResponse {
  try {
    const cleanedResponse = response.trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.metaTitle || !parsed.metaDescription) {
      throw new Error('Missing required fields');
    }

    return {
      metaTitle: parsed.metaTitle || '',
      metaDescription: parsed.metaDescription || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      openGraphImageUrl: parsed.openGraphImageUrl || undefined,
    };
  } catch (error) {
    console.error('Failed to parse meta response:', error);
    throw new Error('Invalid AI response format');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, content, locale = 'ko' }: MetaGeneratorRequest = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both title and content are required'
      });
    }

    // Validate locale
    const validLocales = ['ko', 'en', 'ja', 'zh'];
    if (locale && !validLocales.includes(locale)) {
      return res.status(400).json({
        error: 'Invalid locale',
        message: 'Locale must be one of: ko, en, ja, zh'
      });
    }

    console.log('🎯 Meta tag generation request:', {
      title: title.substring(0, 50) + '...',
      contentLength: content.length,
      locale,
    });

    const prompt = generateMetaPrompt({ title, content, locale });
    
    const aiResponse = await callClaudeAI({
      prompt,
      model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.3'),
    });

    if (!aiResponse.success || !aiResponse.data) {
      throw new Error(aiResponse.error || 'AI response failed');
    }

    const metaTags = parseMetaResponse(aiResponse.data);

    console.log('✅ Meta tag generation completed:', {
      titleLength: metaTags.metaTitle.length,
      descriptionLength: metaTags.metaDescription.length,
      keywordCount: metaTags.keywords.length,
    });

    res.status(200).json(metaTags);

  } catch (error) {
    console.error('❌ Meta tag generation failed:', error);

    res.status(500).json({
      error: 'Meta tag generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}