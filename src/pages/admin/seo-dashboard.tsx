import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, TrendingUp, Users, Target, BarChart, RefreshCw,
  AlertCircle, CheckCircle, ArrowUp, ArrowDown, Eye, MousePointer
} from 'lucide-react';

interface TrafficAnalytics {
  seoVisitors: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  conversions: {
    total: number;
    rate: number;
    topConvertingPages: { page: string; conversions: number }[];
  };
  topPages: { page: string; visits: number }[];
  topSeoTags: { tag: string; visits: number; conversions: number; rate: number }[];
  trends: {
    daily: { date: string; visits: number; conversions: number }[];
    weekly: { week: string; visits: number; conversions: number }[];
  };
}

interface ConversionOptimization {
  overallScore: number;
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: 'content' | 'design' | 'seo' | 'technical';
    title: string;
    description: string;
    expectedImpact: string;
    implementation: string[];
  }[];
  underperformingPages: {
    page: string;
    visits: number;
    conversions: number;
    conversionRate: number;
    issues: string[];
    suggestions: string[];
  }[];
  topOpportunities: {
    opportunity: string;
    potentialImpact: number;
    effortRequired: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

const SeoAdminDashboard: NextPage = () => {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<TrafficAnalytics | null>(null);
  const [optimization, setOptimization] = useState<ConversionOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load traffic analytics
      const analyticsResponse = await fetch('/api/seo/traffic-analytics');
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data);
      }
      
      // Load conversion optimization
      const optimizationResponse = await fetch('/api/seo/conversion-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (optimizationResponse.ok) {
        const optimizationData = await optimizationResponse.json();
        setOptimization(optimizationData.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">SEO 대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>SEO Dashboard - Legal AI SaaS Admin</title>
        <meta name="description" content="SEO traffic analytics and conversion optimization dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/admin" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  관리자 홈
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">SEO 대시보드</h1>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors inline-flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">총 SEO 방문자</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.seoVisitors.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">오늘: {analytics.seoVisitors.today}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MousePointer className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">총 전환 수</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.conversions.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">전환율: {analytics.conversions.rate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">이번 주</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.seoVisitors.thisWeek.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">방문자</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">이번 달</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.seoVisitors.thisMonth.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">방문자</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Pages */}
            {analytics && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">인기 페이지</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.topPages.map((page, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mr-3">
                            {index + 1}
                          </span>
                          <span className="text-gray-900">{page.page}</span>
                        </div>
                        <span className="text-gray-500">{page.visits} 방문</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top SEO Tags */}
            {analytics && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">인기 SEO 태그</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analytics.topSeoTags.map((tag, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-900">{tag.tag}</span>
                          <div className="text-sm text-gray-500">
                            {tag.visits} 방문 · {tag.conversions} 전환
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tag.rate >= 10 ? 'bg-green-100 text-green-800' :
                          tag.rate >= 5 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {tag.rate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Conversion Optimization */}
          {optimization && (
            <>
              {/* Overall Score */}
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">전환 최적화 점수</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-3xl font-bold text-gray-900">{optimization.overallScore}</span>
                        <span className="text-lg text-gray-500 ml-1">/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${optimization.overallScore}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="ml-6">
                      {optimization.overallScore >= 80 ? (
                        <CheckCircle className="h-12 w-12 text-green-500" />
                      ) : optimization.overallScore >= 60 ? (
                        <AlertCircle className="h-12 w-12 text-yellow-500" />
                      ) : (
                        <AlertCircle className="h-12 w-12 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">개선 권장사항</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {optimization.recommendations.map((rec, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                              {rec.priority} 우선순위
                            </span>
                          </div>
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{rec.description}</p>
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">예상 효과: </span>
                          <span className="text-sm text-green-600">{rec.expectedImpact}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">실행 방법:</span>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {rec.implementation.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Opportunities */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">주요 기회 요소</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {optimization.topOpportunities.map((opp, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h4 className="font-semibold text-gray-900">{opp.opportunity}</h4>
                            <span className={`ml-3 px-2 py-1 text-xs font-medium rounded ${getEffortColor(opp.effortRequired)}`}>
                              {opp.effortRequired} 노력
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{opp.description}</p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-lg font-semibold text-green-600">+{opp.potentialImpact}%</div>
                          <div className="text-xs text-gray-500">잠재 효과</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SeoAdminDashboard;