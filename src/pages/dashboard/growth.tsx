import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  TrendingUp, FileText, Brain, DollarSign, Calendar, 
  Download, Crown, ArrowLeft, BarChart3, PieChart,
  Target, Zap, Star, Gift, ArrowRight
} from 'lucide-react';
import { 
  LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

interface UserGrowthData {
  user: {
    email: string;
    currentPlan: string;
    memberSince: string;
    totalDocuments: number;
    totalApiCalls: number;
    estimatedCost: number;
  };
  thisMonth: {
    documentsCreated: number;
    apiCalls: number;
    modelUsage: Array<{ model: string; calls: number; percentage: number }>;
    dailyActivity: Array<{ date: string; documents: number; apiCalls: number }>;
  };
  predictions: {
    nextMonthUsage: number;
    recommendedPlan: string;
    potentialSavings: number;
    upgradeWorthScore: number;
  };
  comparison: {
    avgUserDocuments: number;
    yourRank: number;
    totalUsers: number;
  };
}

interface GrowthDashboardProps {
  userData: UserGrowthData;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const GrowthDashboard: NextPage<GrowthDashboardProps> = ({ userData }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const downloadReport = async (format: 'pdf' | 'csv') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export-growth-report?format=${format}`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `growth-report-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: 'text-gray-600 bg-gray-100',
      basic: 'text-blue-600 bg-blue-100', 
      pro: 'text-purple-600 bg-purple-100',
      enterprise: 'text-green-600 bg-green-100'
    };
    return colors[plan.toLowerCase() as keyof typeof colors] || colors.free;
  };

  const getUpgradeWorthBadge = (score: number) => {
    if (score >= 80) return { text: '강력 추천', color: 'bg-green-500', icon: '🔥' };
    if (score >= 60) return { text: '추천', color: 'bg-yellow-500', icon: '⭐' };
    if (score >= 40) return { text: '고려해볼만', color: 'bg-blue-500', icon: '💡' };
    return { text: '현재 플랜 유지', color: 'bg-gray-500', icon: '👍' };
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const upgradeBadge = getUpgradeWorthBadge(userData.predictions.upgradeWorthScore);

  return (
    <>
      <Head>
        <title>성장 리포트 | Legal AI SaaS</title>
        <meta name="description" content="나의 Legal AI 사용 현황과 성장 분석 리포트" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  홈으로
                </Link>
                <div className="flex items-center">
                  <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">나의 성장 리포트</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => downloadReport('csv')}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV 다운로드
                </button>
                <button
                  onClick={() => downloadReport('pdf')}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF 다운로드
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">안녕하세요, {userData.user.email.split('@')[0]}님! 👋</h1>
                <p className="text-blue-100">Legal AI를 사용한 지 {userData.user.memberSince}일이 되었습니다.</p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(userData.user.currentPlan)}`}>
                  <Crown className="h-4 w-4 mr-1" />
                  {userData.user.currentPlan.toUpperCase()} 플랜
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 생성 문서</p>
                  <p className="text-2xl font-bold text-gray-900">{userData.user.totalDocuments}</p>
                  <p className="text-sm text-green-600">이번 달 +{userData.thisMonth.documentsCreated}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">AI 사용량</p>
                  <p className="text-2xl font-bold text-gray-900">{userData.user.totalApiCalls}</p>
                  <p className="text-sm text-blue-600">이번 달 {userData.thisMonth.apiCalls}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">예상 절약액</p>
                  <p className="text-2xl font-bold text-gray-900">${userData.predictions.potentialSavings}</p>
                  <p className="text-sm text-gray-500">플랜 최적화 시</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">사용자 순위</p>
                  <p className="text-2xl font-bold text-gray-900">#{userData.comparison.yourRank}</p>
                  <p className="text-sm text-gray-500">전체 {userData.comparison.totalUsers}명 중</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Activity Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">일별 활동 현황</h3>
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userData.thisMonth.dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="documents" stroke="#3B82F6" name="문서 생성" strokeWidth={2} />
                  <Line type="monotone" dataKey="apiCalls" stroke="#10B981" name="AI 호출" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Model Usage Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI 모델 사용 분포</h3>
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={userData.thisMonth.modelUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ model, percentage }) => `${model} (${percentage.toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="calls"
                  >
                    {userData.thisMonth.modelUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upgrade Recommendation */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">🎯 맞춤 플랜 추천</h3>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium ${upgradeBadge.color}`}>
                <span className="mr-1">{upgradeBadge.icon}</span>
                {upgradeBadge.text}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    {userData.predictions.recommendedPlan.toUpperCase()} 플랜이 최적입니다
                  </h4>
                  <p className="text-gray-700 mb-4">
                    현재 사용 패턴을 분석한 결과, <strong>{userData.predictions.recommendedPlan}</strong> 플랜으로 
                    변경하시면 월 <strong>${userData.predictions.potentialSavings}</strong>를 절약할 수 있습니다.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                      다음 달 예상 사용량: {userData.predictions.nextMonthUsage}회
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 mr-2 text-blue-500" />
                      평균 대비 {((userData.comparison.yourRank / userData.comparison.totalUsers) * 100).toFixed(0)}% 상위 사용자
                    </div>
                  </div>
                  
                  {userData.predictions.upgradeWorthScore >= 60 && (
                    <Link 
                      href={`/pricing?recommended=${userData.predictions.recommendedPlan}&utm_source=dashboard&utm_medium=growth_report`}
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                    >
                      <Gift className="h-5 w-5 mr-2" />
                      {userData.predictions.recommendedPlan.toUpperCase()} 플랜 보기
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">현재 vs 추천 플랜</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">현재:</span>
                      <span className="font-medium">{userData.user.currentPlan.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">추천:</span>
                      <span className="font-medium text-blue-600">{userData.predictions.recommendedPlan.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">절약액:</span>
                      <span className="font-medium text-green-600">${userData.predictions.potentialSavings}/월</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">업그레이드 점수</h5>
                  <div className="flex items-center">
                    <div className="flex-1 bg-blue-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${userData.predictions.upgradeWorthScore}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      {userData.predictions.upgradeWorthScore}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Comparison */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 평균 사용자와 비교</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">{userData.thisMonth.documentsCreated}</div>
                <div className="text-sm text-gray-600 mb-2">이번 달 문서 생성</div>
                <div className="text-xs text-gray-500">
                  평균: {userData.comparison.avgUserDocuments}개
                  {userData.thisMonth.documentsCreated > userData.comparison.avgUserDocuments ? 
                    <span className="text-green-600 ml-1">↗️ 평균 이상</span> : 
                    <span className="text-orange-600 ml-1">↘️ 평균 이하</span>
                  }
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">{userData.thisMonth.apiCalls}</div>
                <div className="text-sm text-gray-600 mb-2">이번 달 AI 호출</div>
                <div className="text-xs text-gray-500">상위 {((userData.comparison.yourRank / userData.comparison.totalUsers) * 100).toFixed(0)}% 사용자</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">#{userData.comparison.yourRank}</div>
                <div className="text-sm text-gray-600 mb-2">전체 순위</div>
                <div className="text-xs text-gray-500">총 {userData.comparison.totalUsers}명 중</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // In production, you would:
    // 1. Get user session
    // 2. Query user's actual data from database
    // 3. Calculate predictions and comparisons
    
    // Mock data for demonstration
    const mockUserData: UserGrowthData = {
      user: {
        email: 'user@example.com',
        currentPlan: 'free',
        memberSince: '45',
        totalDocuments: 127,
        totalApiCalls: 1250,
        estimatedCost: 45.50
      },
      thisMonth: {
        documentsCreated: 23,
        apiCalls: 189,
        modelUsage: [
          { model: 'Claude', calls: 89, percentage: 47.1 },
          { model: 'GPT-4', calls: 56, percentage: 29.6 },
          { model: 'Gemini', calls: 44, percentage: 23.3 }
        ],
        dailyActivity: [
          { date: '07-01', documents: 3, apiCalls: 12 },
          { date: '07-02', documents: 1, apiCalls: 8 },
          { date: '07-03', documents: 5, apiCalls: 15 },
          { date: '07-04', documents: 2, apiCalls: 7 },
          { date: '07-05', documents: 4, apiCalls: 14 },
          { date: '07-06', documents: 0, apiCalls: 0 },
          { date: '07-07', documents: 3, apiCalls: 11 },
          { date: '07-08', documents: 2, apiCalls: 9 },
          { date: '07-09', documents: 3, apiCalls: 13 }
        ]
      },
      predictions: {
        nextMonthUsage: 220,
        recommendedPlan: 'pro',
        potentialSavings: 35,
        upgradeWorthScore: 78
      },
      comparison: {
        avgUserDocuments: 15,
        yourRank: 23,
        totalUsers: 1247
      }
    };
    
    return {
      props: {
        userData: mockUserData
      }
    };
  } catch (error) {
    console.error('Failed to fetch user growth data:', error);
    
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false
      }
    };
  }
};

export default GrowthDashboard;