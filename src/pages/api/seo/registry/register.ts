import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../features/auth/authOptions';
import { callClaudeAI } from '../../../../services/claude-api';
import { getSeoFromCache, saveSeoToCache } from '../../../../lib/cache/seoCache';
import { 
  saveSeoMeta, 
  generateBlogContent, 
  saveRegistryEntry,
  SeoMetaData 
} from '../../../../lib/seo/registry';

// Registration request interface
interface SeoRegistrationRequest {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  keywords?: string[];
  language: 'ko' | 'en' | 'ja' | 'zh';
  industry: string;
  category: string;
  generateBlog: boolean;
  autoSave: boolean;
}

// Generate cache key for SEO request
function generateCacheKey(data: SeoRegistrationRequest): string {
  const keyParts = [
    data.url || 'no-url',
    data.title || 'no-title',
    data.description || 'no-desc',
    (data.keywords || []).sort().join(',') || 'no-keywords',
    data.language || 'ko',
    data.industry || 'legal',
    data.category || 'page'
  ];
  
  return `seo_registry:${keyParts.join('|').replace(/[^a-zA-Z0-9\-_]/g, '_')}`;
}

// Generate SEO prompt for Claude AI
function generateSeoPrompt(data: SeoRegistrationRequest): string {
  const { url, title, description, content, keywords, language = 'ko', industry = 'legal', category = 'page' } = data;
  
  const languageNames = {
    ko: '한국어',
    en: 'English',
    ja: '日本語',
    zh: '中文'
  };

  const categoryDescriptions = {
    page: '일반 웹페이지',
    blog: '블로그/아티클',
    product: '제품/서비스 소개',
    landing: '랜딩 페이지',
    marketing: '마케팅 페이지',
    community: '커뮤니티 페이지',
    external: '외부 사이트 페이지'
  };

  return `당신은 전문 SEO 컨설턴트입니다. 다음 정보를 바탕으로 ${categoryDescriptions[category as keyof typeof categoryDescriptions] || '웹페이지'}에 최적화된 메타 태그와 구조화된 데이터를 생성해주세요.

입력 정보:
- URL: ${url || 'N/A'}
- 카테고리: ${category} (${categoryDescriptions[category as keyof typeof categoryDescriptions] || '기타'})
- 기존 제목: ${title || 'N/A'}
- 기존 설명: ${description || 'N/A'}
- 키워드: ${keywords?.join(', ') || 'N/A'}
- 콘텐츠: ${content || 'N/A'}
- 언어: ${languageNames[language]}
- 산업분야: ${industry}

다음 형식으로 JSON 응답을 제공해주세요:

{
  "title": "SEO 최적화된 제목 (60자 이내, ${language} 언어)",
  "description": "SEO 최적화된 설명 (160자 이내, ${language} 언어)",
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
    "inLanguage": "${language}",
    "about": {
      "@type": "Thing",
      "name": "${industry} 관련 서비스"
    },
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
1. ${category} 카테고리에 특화된 SEO 전략을 적용해주세요
2. 제목과 설명은 검색엔진 친화적이어야 합니다
3. 키워드는 자연스럽게 포함되어야 합니다
4. ${language} 언어로 생성해주세요
5. ${industry} 분야에 특화된 키워드를 포함해주세요
6. 구조화된 데이터는 Schema.org 표준을 따라주세요
7. SEO 점수는 1-100 사이로 평가해주세요
8. 응답은 반드시 유효한 JSON 형식이어야 합니다`;
}

// Parse Claude AI response
function parseSeoResponse(response: string): SeoMetaData {
  try {
    const cleanedResponse = response.trim();
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
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
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to register SEO content'
      });
    }

    // Check if user is admin (for now, restrict to admins)
    const isAdmin = session.user.email.includes('admin') || 
                   session.user.email === 'developer@legalaisaas.com';
    
    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'Only administrators can register SEO content'
      });
    }

    console.log('📝 SEO registration request from:', session.user.email);

    // Validate and parse request data
    const requestData: SeoRegistrationRequest = req.body;
    
    if (!requestData.url) {
      return res.status(400).json({
        error: 'URL is required',
        message: 'Please provide a URL for SEO generation'
      });
    }

    console.log('🎯 Processing SEO registration:', {
      url: requestData.url,
      category: requestData.category,
      language: requestData.language,
      industry: requestData.industry,
      generateBlog: requestData.generateBlog,
      autoSave: requestData.autoSave,
    });

    let seoData: SeoMetaData;
    let fromCache = false;

    // Check cache if enabled
    const cacheKey = generateCacheKey(requestData);
    console.log('🔍 Checking cache for key:', cacheKey);
    
    const cachedResult = await getSeoFromCache(cacheKey);
    if (cachedResult) {
      console.log('✅ SEO data found in cache');
      seoData = cachedResult;
      fromCache = true;
    } else {
      // Generate new SEO data with Claude AI
      console.log('🤖 Generating new SEO data with Claude AI...');
      
      const prompt = generateSeoPrompt(requestData);
      
      const aiResponse = await callClaudeAI({
        prompt,
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.3'),
      });

      if (!aiResponse.success || !aiResponse.data) {
        throw new Error(aiResponse.error || 'AI response failed');
      }

      console.log('🔄 Parsing AI response...');
      seoData = parseSeoResponse(aiResponse.data);

      // Save to cache
      console.log('💾 Saving SEO data to cache...');
      await saveSeoToCache(cacheKey, seoData);
    }

    let blogContent: string | undefined;
    let savedFiles: string[] = [];

    // Generate blog content if requested
    if (requestData.generateBlog) {
      console.log('📝 Generating blog content...');
      blogContent = await generateBlogContent(
        requestData.url,
        requestData.language,
        seoData
      );
    }

    // Save files if auto-save is enabled
    if (requestData.autoSave) {
      console.log('💾 Auto-saving SEO data...');
      
      // Save JSON meta file
      const metaFileName = await saveSeoMeta(
        requestData.url,
        requestData.language,
        requestData.category,
        seoData
      );
      savedFiles.push(`/data/seo-meta/${metaFileName}`);
      
      if (blogContent) {
        const blogFileName = metaFileName.replace('.json', '.md');
        savedFiles.push(`/data/seo-blogs/${blogFileName}`);
      }
    }

    // Save registry entry
    const registryEntry = await saveRegistryEntry({
      url: requestData.url,
      category: requestData.category,
      language: requestData.language,
      industry: requestData.industry,
      seoData,
      blogContent,
      status: 'success',
    });

    const executionTime = Date.now() - startTime;

    console.log('✅ SEO registration completed:', {
      id: registryEntry.id,
      score: seoData.score,
      fromCache,
      blogGenerated: !!blogContent,
      filesSaved: savedFiles.length,
      executionTime: `${executionTime}ms`,
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        id: registryEntry.id,
        url: requestData.url,
        category: requestData.category,
        language: requestData.language,
        seoData,
        blogContent,
        createdAt: registryEntry.createdAt,
        status: 'success',
      },
      meta: {
        fromCache,
        executionTime,
        savedFiles,
        registryId: registryEntry.id,
        timestamp: new Date().toISOString(),
        generatedBy: session.user.email,
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ SEO registration failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: `${executionTime}ms`,
      timestamp: new Date().toISOString(),
    });

    // Save error to registry if we have enough info
    if (req.body?.url) {
      try {
        await saveRegistryEntry({
          url: req.body.url,
          category: req.body.category || 'page',
          language: req.body.language || 'ko',
          industry: req.body.industry || 'legal',
          seoData: {
            title: '',
            description: '',
            keywords: [],
            ogTitle: '',
            ogDescription: '',
            twitterTitle: '',
            twitterDescription: '',
            structuredData: {},
            recommendations: [],
            score: 0,
          },
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (registryError) {
        console.error('Failed to save error to registry:', registryError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'SEO registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        executionTime,
        timestamp: new Date().toISOString(),
      }
    });
  }
}