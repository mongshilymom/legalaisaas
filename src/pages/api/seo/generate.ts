import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../features/auth/authOptions';
import { callClaudeAI } from '../../../services/claude-api';
import { getSeoFromCache, saveSeoToCache } from '../../../lib/cache/seoCache';

// SEO generation request interface
interface SeoGenerationRequest {
  url?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  content?: string;
  language?: 'ko' | 'en' | 'ja' | 'zh';
  industry?: 'legal' | 'tech' | 'ecommerce' | 'finance' | 'healthcare' | 'education' | 'other';
  useCache?: boolean;
}

// SEO generation response interface
interface SeoMetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage?: string;
  twitterTitle: string;
  twitterDescription: string;
  structuredData: any;
  recommendations: string[];
  score: number;
}

// Claude AI prompt for SEO generation
function generateSeoPrompt(data: SeoGenerationRequest): string {
  const { url, title, description, content, keywords, language = 'ko', industry = 'legal' } = data;
  
  const languageNames = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    zh: '中文'
  };

  return `당신은 전문 SEO 컨설턴트입니다. 다음 정보를 바탕으로 최적화된 메타 태그와 구조화된 데이터를 생성해주세요.

입력 정보:
- URL: ${url || 'N/A'}
- 기존 제목: ${title || 'N/A'}
- 기존 설명: ${description || 'N/A'}
- 키워드: ${keywords?.join(', ') || 'N/A'}
- 콘텐츠: ${content || 'N/A'}
- 언어: ${languageNames[language]}
- 산업분야: ${industry}

다음 형식으로 JSON 응답을 제공해주세요:

{
  "title": "SEO 최적화된 제목 (60자 이내)",
  "description": "SEO 최적화된 설명 (160자 이내)",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "ogTitle": "소셜 미디어용 제목 (60자 이내)",
  "ogDescription": "소셜 미디어용 설명 (160자 이내)",
  "twitterTitle": "트위터용 제목 (70자 이내)",
  "twitterDescription": "트위터용 설명 (200자 이내)",
  "structuredData": {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "페이지 제목",
    "description": "페이지 설명",
    "url": "${url || ''}",
    "mainEntity": {
      "@type": "Organization",
      "name": "Legal AI SaaS",
      "description": "AI 기반 법률 서비스 플랫폼"
    }
  },
  "recommendations": [
    "SEO 개선 권장사항 1",
    "SEO 개선 권장사항 2",
    "SEO 개선 권장사항 3"
  ],
  "score": 85
}

주의사항:
1. 제목과 설명은 검색엔진 친화적이어야 합니다
2. 키워드는 자연스럽게 포함되어야 합니다
3. ${language} 언어로 생성해주세요
4. ${industry} 분야에 특화된 키워드를 포함해주세요
5. 구조화된 데이터는 Schema.org 표준을 따라주세요
6. SEO 점수는 1-100 사이로 평가해주세요
7. 응답은 반드시 유효한 JSON 형식이어야 합니다`;
}

// Validate SEO generation request
function validateSeoRequest(data: any): SeoGenerationRequest {
  const validLanguages = ['ko', 'en', 'ja', 'zh'];
  const validIndustries = ['legal', 'tech', 'ecommerce', 'finance', 'healthcare', 'education', 'other'];

  return {
    url: typeof data.url === 'string' ? data.url : undefined,
    title: typeof data.title === 'string' ? data.title : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    keywords: Array.isArray(data.keywords) ? data.keywords.filter(k => typeof k === 'string') : undefined,
    content: typeof data.content === 'string' ? data.content : undefined,
    language: validLanguages.includes(data.language) ? data.language : 'ko',
    industry: validIndustries.includes(data.industry) ? data.industry : 'legal',
    useCache: data.useCache !== false, // Default to true
  };
}

// Generate cache key for SEO request
function generateCacheKey(data: SeoGenerationRequest): string {
  const keyParts = [
    data.url || 'no-url',
    data.title || 'no-title',
    data.description || 'no-desc',
    (data.keywords || []).sort().join(',') || 'no-keywords',
    data.language || 'ko',
    data.industry || 'legal'
  ];
  
  // Create a hash-like key
  return `seo:${keyParts.join('|').replace(/[^a-zA-Z0-9\-_]/g, '_')}`;
}

// Parse Claude AI response
function parseSeoResponse(response: string): SeoMetaTags {
  try {
    // Clean the response to ensure it's valid JSON
    const cleanedResponse = response.trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!parsed.title || !parsed.description) {
      throw new Error('Missing required fields in response');
    }

    return {
      title: parsed.title || '',
      description: parsed.description || '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      ogTitle: parsed.ogTitle || parsed.title || '',
      ogDescription: parsed.ogDescription || parsed.description || '',
      ogImage: parsed.ogImage,
      twitterTitle: parsed.twitterTitle || parsed.title || '',
      twitterDescription: parsed.twitterDescription || parsed.description || '',
      structuredData: parsed.structuredData || {},
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 75,
    };
  } catch (error) {
    console.error('Failed to parse SEO response:', error);
    throw new Error('Invalid AI response format');
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Validate authentication for non-public endpoints
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to use SEO generation'
      });
    }

    console.log('🎯 SEO generation request from:', session.user.email);

    // Validate and parse request data
    const requestData = validateSeoRequest(req.body);
    
    if (!requestData.url && !requestData.title && !requestData.content) {
      return res.status(400).json({
        error: 'Insufficient data',
        message: 'Please provide at least a URL, title, or content for SEO generation'
      });
    }

    console.log('📝 Processing SEO request:', {
      url: requestData.url,
      language: requestData.language,
      industry: requestData.industry,
      useCache: requestData.useCache,
    });

    let seoResult: SeoMetaTags;
    let fromCache = false;

    // Check cache if enabled
    if (requestData.useCache) {
      const cacheKey = generateCacheKey(requestData);
      console.log('🔍 Checking cache for key:', cacheKey);
      
      const cachedResult = await getSeoFromCache(cacheKey);
      if (cachedResult) {
        console.log('✅ SEO data found in cache');
        seoResult = cachedResult;
        fromCache = true;
      }
    }

    // Generate new SEO data if not in cache
    if (!seoResult!) {
      console.log('🤖 Generating new SEO data with Claude AI...');
      
      const prompt = generateSeoPrompt(requestData);
      
      const aiResponse = await callClaudeAI({
        prompt,
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.3'), // Lower temperature for more consistent SEO
      });

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'AI response failed');
      }

      console.log('🔄 Parsing AI response...');
      seoResult = parseSeoResponse(aiResponse.data);

      // Save to cache if enabled
      if (requestData.useCache) {
        const cacheKey = generateCacheKey(requestData);
        console.log('💾 Saving SEO data to cache...');
        await saveSeoToCache(cacheKey, seoResult);
      }
    }

    const executionTime = Date.now() - startTime;

    console.log('✅ SEO generation completed:', {
      score: seoResult.score,
      fromCache,
      executionTime: `${executionTime}ms`,
      titleLength: seoResult.title.length,
      descriptionLength: seoResult.description.length,
      keywordCount: seoResult.keywords.length,
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: seoResult,
      meta: {
        fromCache,
        executionTime,
        language: requestData.language,
        industry: requestData.industry,
        timestamp: new Date().toISOString(),
        cacheUsed: requestData.useCache,
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ SEO generation failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      error: 'SEO generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      }
    });
  }
}