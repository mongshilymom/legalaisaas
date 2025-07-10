import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import { logUserAction } from '../../../lib/logUserAction';
import callOpenAI from '../../../lib/ai/callOpenAI';
import callGemini from '../../../lib/ai/callGemini';

interface ContentRecommendationRequest {
  userId: string;
  recentDocs: string[];
  preferredTopics: string[];
  interactionHistory?: {
    views: string[];
    bookmarks: string[];
    ratings: { contentId: string; rating: number }[];
  };
}

interface ContentRecommendationResponse {
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    type: 'document' | 'template' | 'guide' | 'case_study';
    tags: string[];
    relevanceScore: number;
    reason: string;
  }>;
  personalizedInsights: {
    topInterests: string[];
    suggestedActions: string[];
    engagementTrends: string;
  };
  communityTrends: {
    popularContent: string[];
    emergingTopics: string[];
    userSimilarities: string[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContentRecommendationResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const {
      userId,
      recentDocs,
      preferredTopics,
      interactionHistory
    }: ContentRecommendationRequest = req.body;

    await logUserAction({
      type: 'PAGE_VIEW',
      page: 'recommendation-api',
      userId: session.user.email || userId,
      metadata: { 
        recentDocsCount: recentDocs?.length || 0,
        topicsCount: preferredTopics?.length || 0 
      }
    });

    const userProfile = {
      recentDocs: recentDocs || [],
      preferredTopics: preferredTopics || [],
      interactionHistory: interactionHistory || { views: [], bookmarks: [], ratings: [] }
    };

    const aiPrompt = `
당신은 법률 AI SaaS의 개인화된 콘텐츠 추천 전문가입니다.

사용자 프로필:
- 최근 본 문서: ${userProfile.recentDocs.join(', ')}
- 선호 주제: ${userProfile.preferredTopics.join(', ')}
- 조회 기록: ${userProfile.interactionHistory.views.length}개 항목
- 북마크 수: ${userProfile.interactionHistory.bookmarks.length}개
- 평가 기록: ${userProfile.interactionHistory.ratings.length}개

다음을 포함한 개인화된 추천을 JSON 형태로 제공해주세요:

{
  "recommendations": [
    {
      "id": "unique_id",
      "title": "추천 콘텐츠 제목",
      "description": "상세 설명",
      "type": "document|template|guide|case_study",
      "tags": ["관련", "태그들"],
      "relevanceScore": 0-100,
      "reason": "추천 이유"
    }
  ],
  "personalizedInsights": {
    "topInterests": ["주요 관심사들"],
    "suggestedActions": ["제안 액션들"],
    "engagementTrends": "사용자 참여 트렌드 분석"
  },
  "communityTrends": {
    "popularContent": ["인기 콘텐츠"],
    "emergingTopics": ["떠오르는 주제들"],
    "userSimilarities": ["유사한 사용자 패턴"]
  }
}

5-8개의 고품질 추천을 제공하되, 관련성과 다양성의 균형을 맞춰주세요.
`;

    let aiResponse;
    try {
      aiResponse = await callOpenAI(aiPrompt);
    } catch (openaiError) {
      console.log('OpenAI 실패, Gemini로 전환:', openaiError);
      aiResponse = await callGemini(aiPrompt);
    }

    let parsedResponse: ContentRecommendationResponse;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('AI 응답 파싱 오류:', parseError);
      
      parsedResponse = {
        recommendations: [
          {
            id: 'fallback-1',
            title: '법무 계약서 작성 가이드',
            description: '기본적인 계약서 작성을 위한 종합 가이드입니다.',
            type: 'guide',
            tags: ['계약서', '법무', '가이드'],
            relevanceScore: 85,
            reason: '기본 추천 콘텐츠입니다.'
          },
          {
            id: 'fallback-2',
            title: '개인정보보호법 준수 체크리스트',
            description: '개인정보보호법 준수를 위한 필수 체크리스트입니다.',
            type: 'document',
            tags: ['개인정보보호', '컴플라이언스', '체크리스트'],
            relevanceScore: 80,
            reason: '규정 준수 관련 인기 콘텐츠입니다.'
          }
        ],
        personalizedInsights: {
          topInterests: ['법무', '컴플라이언스'],
          suggestedActions: ['최신 법률 업데이트 확인', '계약서 템플릿 활용'],
          engagementTrends: '꾸준한 학습 패턴을 보이고 있습니다.'
        },
        communityTrends: {
          popularContent: ['계약서 작성', '법무 가이드'],
          emergingTopics: ['AI 법규', 'ESG 컴플라이언스'],
          userSimilarities: ['중소기업 법무팀', '스타트업 창업자']
        }
      };
    }

    await logUserAction({
      type: 'DOCUMENT_GENERATED',
      page: 'content-recommendation',
      userId: session.user.email || userId,
      metadata: { 
        recommendationCount: parsedResponse.recommendations.length,
        avgRelevanceScore: parsedResponse.recommendations.reduce((acc, rec) => acc + rec.relevanceScore, 0) / parsedResponse.recommendations.length
      }
    });

    res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('콘텐츠 추천 API 오류:', error);
    
    await logUserAction({
      type: 'CTA_CLICK',
      page: 'recommendation-error',
      userId: req.body?.userId || 'anonymous',
      metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
    });

    res.status(500).json({ error: '콘텐츠 추천 처리 중 오류가 발생했습니다.' });
  }
}