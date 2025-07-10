import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { 
  Crown, ArrowRight, Zap, CheckCircle, Star, 
  TrendingUp, Shield, Target, Sparkles 
} from 'lucide-react';

export default function Upgrade() {
  const router = useRouter();
  const { data: session } = useSession();
  
  // Get the feature that triggered this upgrade page
  const { feature, source, limit } = router.query;

  useEffect(() => {
    // Track upgrade page visit
    if (session?.user) {
      fetch('/api/upgrade/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.email,
          action: 'upgrade_page_visit',
          source: source || 'direct',
          page: router.pathname,
          timestamp: new Date().toISOString(),
          metadata: { feature, limit }
        })
      }).catch(console.error);
    }
  }, [session, feature, source, limit]);

  const handleUpgradeClick = (plan: string) => {
    if (session?.user) {
      fetch('/api/upgrade/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.email,
          action: 'upgrade_click',
          source: source || 'upgrade_page',
          page: router.pathname,
          timestamp: new Date().toISOString(),
          metadata: { feature, limit, planSelected: plan }
        })
      }).catch(console.error);
    }
    
    router.push(`/pricing?source=upgrade_page&feature=${feature}&plan=${plan}`);
  };

  const getFeatureMessage = () => {
    switch (feature) {
      case 'ai_query':
        return {
          icon: <Zap className="h-12 w-12 text-yellow-500" />,
          title: '⚡ AI 쿼리 한계 도달',
          subtitle: `이번 달 AI 쿼리 ${limit || '100'}회를 모두 사용했습니다.`,
          benefit: '무제한 AI 법률 분석으로 업무 효율성을 극대화하세요!'
        };
      case 'file_upload':
        return {
          icon: <Shield className="h-12 w-12 text-blue-500" />,
          title: '📁 파일 업로드 제한',
          subtitle: `파일 업로드 한도 ${limit || '5'}개에 도달했습니다.`,
          benefit: '무제한 파일 분석으로 모든 법률 문서를 관리하세요!'
        };
      case 'contract_generation':
        return {
          icon: <Crown className="h-12 w-12 text-purple-500" />,
          title: '🔒 계약서 생성 기능',
          subtitle: '고급 계약서 생성 기능은 Pro 플랜 이상에서 이용 가능합니다.',
          benefit: 'AI 계약서 자동 생성으로 시간을 90% 절약하세요!'
        };
      case 'advanced_analysis':
        return {
          icon: <Target className="h-12 w-12 text-green-500" />,
          title: '🎯 고급 분석 기능',
          subtitle: '상세한 법률 분석은 프리미엄 기능입니다.',
          benefit: '전문가급 법률 인사이트로 더 정확한 판단을 내리세요!'
        };
      default:
        return {
          icon: <Sparkles className="h-12 w-12 text-indigo-500" />,
          title: '🚫 접근 제한',
          subtitle: '이 기능은 프리미엄 요금제 이상에서만 이용할 수 있습니다.',
          benefit: '모든 프리미엄 기능을 잠금 해제하고 법무 업무를 혁신하세요!'
        };
    }
  };

  const message = getFeatureMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            {message.icon}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{message.title}</h1>
          <p className="text-xl text-gray-600 mb-4">{message.subtitle}</p>
          <p className="text-lg text-blue-600 font-medium">{message.benefit}</p>
        </div>

        {/* Upgrade Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Pro Plan */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 overflow-hidden relative">
            <div className="bg-blue-500 text-white text-center py-3">
              <span className="font-semibold flex items-center justify-center">
                <Star className="h-4 w-4 mr-1" />
                가장 인기있는 선택
              </span>
            </div>
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Plan</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                $99<span className="text-lg text-gray-600">/월</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>월 1,000회 AI 쿼리</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>파일 업로드 50개</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>고급 AI 계약서 생성</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>우선 고객 지원</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>분석 리포트 & 대시보드</span>
                </li>
              </ul>
              
              <button
                onClick={() => handleUpgradeClick('pro')}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                AI 법률 비서 전체 해제 → 지금 구독
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                $299<span className="text-lg text-gray-600">/월</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>무제한 AI 쿼리</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>무제한 파일 업로드</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>프리미엄 AI 기능 모두</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>전용 계정 관리자</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span>24/7 전화 지원</span>
                </li>
              </ul>
              
              <button
                onClick={() => handleUpgradeClick('enterprise')}
                className="w-full bg-gray-900 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all flex items-center justify-center"
              >
                Enterprise 플랜 선택
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-white text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">🎉 지금 업그레이드하면 특별 혜택!</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-3 rounded-full mb-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">생산성 300% 증가</h3>
              <p className="text-sm opacity-90">AI 자동화로 업무 시간 대폭 단축</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-3 rounded-full mb-3">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">법률 리스크 최소화</h3>
              <p className="text-sm opacity-90">AI 검토로 실수 위험 제거</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-3 rounded-full mb-3">
                <Crown className="h-6 w-6" />
              </div>
              <h3 className="font-semibold mb-1">전문가급 퀄리티</h3>
              <p className="text-sm opacity-90">고급 법무팀 수준의 결과물</p>
            </div>
          </div>
        </div>

        {/* Alternative option */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">잠시만, 더 자세히 알아보고 싶으신가요?</p>
          <Link href="/pricing" className="text-blue-600 hover:text-blue-700 font-medium underline">
            모든 요금제 비교하기
          </Link>
        </div>
      </div>
    </div>
  );
}
