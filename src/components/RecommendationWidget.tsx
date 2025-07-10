import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Brain, FileText, BookOpen, Users, TrendingUp, 
  Star, Eye, Bookmark, ArrowRight, RefreshCw, Lightbulb 
} from 'lucide-react';
import { BookmarkButton } from './BookmarkButton';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'template' | 'guide' | 'case_study';
  tags: string[];
  relevanceScore: number;
  reason: string;
}

interface PersonalizedInsights {
  topInterests: string[];
  suggestedActions: string[];
  engagementTrends: string;
}

interface CommunityTrends {
  popularContent: string[];
  emergingTopics: string[];
  userSimilarities: string[];
}

interface RecommendationData {
  recommendations: Recommendation[];
  personalizedInsights: PersonalizedInsights;
  communityTrends: CommunityTrends;
}

interface RecommendationWidgetProps {
  userId?: string;
  className?: string;
  maxItems?: number;
  variant?: 'sidebar' | 'dashboard' | 'inline';
  showInsights?: boolean;
}

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
  userId,
  className = '',
  maxItems = 5,
  variant = 'dashboard',
  showInsights = true
}) => {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchRecommendations();
    }
  }, [session, userId]);

  const fetchRecommendations = async () => {
    if (!session?.user) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/recommendation/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || session.user.email,
          recentDocs: [],
          preferredTopics: [],
          interactionHistory: {
            views: [],
            bookmarks: [],
            ratings: []
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '추천 콘텐츠를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('추천 콘텐츠 로딩 오류:', error);
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      document: FileText,
      template: BookOpen,
      guide: Lightbulb,
      case_study: Users
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      document: 'bg-blue-100 text-blue-700',
      template: 'bg-green-100 text-green-700',
      guide: 'bg-yellow-100 text-yellow-700',
      case_study: 'bg-purple-100 text-purple-700'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getVariantClasses = () => {
    const variants = {
      sidebar: 'max-w-sm',
      dashboard: 'w-full',
      inline: 'max-w-2xl'
    };
    return variants[variant];
  };

  if (!session?.user) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${getVariantClasses()} ${className}`}>
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">맞춤 추천을 받으려면 로그인이 필요합니다.</p>
        <a 
          href="/auth/signin"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          로그인
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${getVariantClasses()} ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${getVariantClasses()} ${className}`}>
        <div className="text-center">
          <Brain className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations) return null;

  return (
    <div className={`space-y-6 ${getVariantClasses()} ${className}`}>
      {/* 추천 콘텐츠 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">맞춤 추천</h3>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="새로고침"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {recommendations.recommendations.slice(0, maxItems).map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                      <span className="ml-1 capitalize">{item.type.replace('_', ' ')}</span>
                    </span>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs font-medium">{item.relevanceScore}</span>
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <p className="text-xs text-blue-600 mb-2">💡 {item.reason}</p>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{item.tags.length - 3}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <BookmarkButton
                    contentId={item.id}
                    contentTitle={item.title}
                    contentType={item.type}
                    variant="icon"
                    size="sm"
                  />
                  <button className="text-blue-600 hover:text-blue-700 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 개인화된 인사이트 */}
      {showInsights && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">나의 관심사</h4>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">주요 관심 분야</h5>
              <div className="flex flex-wrap gap-2">
                {recommendations.personalizedInsights.topInterests.map((interest) => (
                  <span key={interest} className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">추천 액션</h5>
              <ul className="space-y-1">
                {recommendations.personalizedInsights.suggestedActions.map((action, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center">
                    <ArrowRight className="h-3 w-3 mr-2 text-gray-400" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">참여 트렌드</h5>
              <p className="text-sm text-gray-600">{recommendations.personalizedInsights.engagementTrends}</p>
            </div>
          </div>
        </div>
      )}

      {/* 커뮤니티 트렌드 */}
      {showInsights && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">커뮤니티 트렌드</h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                인기 콘텐츠
              </h5>
              <div className="space-y-1">
                {recommendations.communityTrends.popularContent.slice(0, 3).map((content, index) => (
                  <div key={index} className="text-sm text-gray-600 flex items-center">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      {index + 1}
                    </span>
                    {content}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">떠오르는 주제</h5>
              <div className="flex flex-wrap gap-2">
                {recommendations.communityTrends.emergingTopics.map((topic) => (
                  <span key={topic} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded">
                    🔥 {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};