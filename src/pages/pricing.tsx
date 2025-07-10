import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { Check, X, Star, Zap, Bot, ArrowRight, TrendingUp, Shield, Target } from 'lucide-react';

interface PlanRecommendation {
  recommended_plan: string;
  confidence_score: number;
  reasons: string[];
  upgrade_benefits: string[];
  cost_analysis: {
    current_cost: number;
    recommended_cost: number;
    savings_potential: string;
  };
  ai_insights: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: Array<{
    name: string;
    included: boolean;
    value?: string;
  }>;
  recommended?: boolean;
  popular?: boolean;
}

const PricingPage: NextPage = () => {
  const { data: session } = useSession();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<PlanRecommendation | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');

  const plans: Plan[] = [
    {
      id: 'basic',
      name: t('basic_plan', 'Basic Plan'),
      price: 29,
      currency: '$',
      period: '/month',
      description: i18n.language === 'ko' ? '개인 및 소규모 팀을 위한 기본 플랜' :
                  i18n.language === 'ja' ? '個人・小規模チーム向けベーシックプラン' :
                  i18n.language === 'zh' ? '个人和小团队基础套餐' :
                  'Perfect for individuals and small teams',
      features: [
        { name: i18n.language === 'ko' ? '월 100회 AI 쿼리' : 'Monthly 100 AI queries', included: true, value: '100' },
        { name: i18n.language === 'ko' ? '파일 업로드 5개' : 'File uploads 5', included: true, value: '5' },
        { name: i18n.language === 'ko' ? '기본 AI 분석' : 'Basic AI analysis', included: true },
        { name: i18n.language === 'ko' ? '이메일 지원' : 'Email support', included: true },
        { name: i18n.language === 'ko' ? '계약서 생성' : 'Contract generation', included: false },
        { name: i18n.language === 'ko' ? '고급 분석' : 'Advanced analytics', included: false },
        { name: i18n.language === 'ko' ? '우선 지원' : 'Priority support', included: false }
      ]
    },
    {
      id: 'pro',
      name: t('premium_plan', 'Pro Plan'),
      price: 99,
      currency: '$',
      period: '/month',
      description: i18n.language === 'ko' ? '성장하는 기업과 전문가를 위한 프로 플랜' :
                  i18n.language === 'ja' ? '成長企業・専門家向けプロプラン' :
                  i18n.language === 'zh' ? '成长企业和专业人士专业套餐' :
                  'Ideal for growing businesses and professionals',
      popular: true,
      features: [
        { name: i18n.language === 'ko' ? '월 1,000회 AI 쿼리' : 'Monthly 1,000 AI queries', included: true, value: '1,000' },
        { name: i18n.language === 'ko' ? '파일 업로드 50개' : 'File uploads 50', included: true, value: '50' },
        { name: i18n.language === 'ko' ? '고급 AI 분석' : 'Advanced AI analysis', included: true },
        { name: i18n.language === 'ko' ? '계약서 생성' : 'Contract generation', included: true },
        { name: i18n.language === 'ko' ? '우선 이메일 지원' : 'Priority email support', included: true },
        { name: i18n.language === 'ko' ? '분석 리포트' : 'Analytics reports', included: true },
        { name: i18n.language === 'ko' ? 'API 액세스' : 'API access', included: false }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      currency: '$',
      period: '/month',
      description: i18n.language === 'ko' ? '대기업과 법무팀을 위한 엔터프라이즈 플랜' :
                  i18n.language === 'ja' ? '大企業・法務チーム向けエンタープライズプラン' :
                  i18n.language === 'zh' ? '大企业和法务团队企业套餐' :
                  'Comprehensive solution for large organizations',
      features: [
        { name: i18n.language === 'ko' ? '무제한 AI 쿼리' : 'Unlimited AI queries', included: true, value: 'Unlimited' },
        { name: i18n.language === 'ko' ? '무제한 파일 업로드' : 'Unlimited file uploads', included: true, value: 'Unlimited' },
        { name: i18n.language === 'ko' ? '프리미엄 AI 기능' : 'Premium AI features', included: true },
        { name: i18n.language === 'ko' ? '전용 계정 관리자' : 'Dedicated account manager', included: true },
        { name: i18n.language === 'ko' ? '24/7 전화 지원' : '24/7 phone support', included: true },
        { name: i18n.language === 'ko' ? '커스텀 통합' : 'Custom integrations', included: true },
        { name: i18n.language === 'ko' ? 'API 액세스' : 'Full API access', included: true }
      ]
    }
  ];

  // Fetch AI recommendation for logged-in users
  useEffect(() => {
    if (session?.user) {
      fetchAIRecommendation();
    }
  }, [session]);

  const fetchAIRecommendation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plan/recommend');
      if (response.ok) {
        const data = await response.json();
        setRecommendation(data.data);
        // Update plans with recommendation
        const updatedPlans = plans.map(plan => ({
          ...plan,
          recommended: plan.id === data.data.recommended_plan
        }));
        setSelectedPlan(data.data.recommended_plan);
      }
    } catch (error) {
      console.error('Failed to fetch recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!session?.user) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: planId,
          plan: planId,
        }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  return (
    <>
      <Head>
        <title>
          {i18n.language === 'ko' ? '요금제 | Legal AI SaaS' :
           i18n.language === 'ja' ? '料金プラン | Legal AI SaaS' :
           i18n.language === 'zh' ? '价格方案 | Legal AI SaaS' :
           'Pricing | Legal AI SaaS'}
        </title>
        <meta name="description" content="Choose the perfect Legal AI SaaS plan for your needs" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Legal AI SaaS</span>
              </Link>
              <div className="flex items-center space-x-4">
                {session ? (
                  <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                    {t('dashboard', 'Dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signin" className="text-gray-700 hover:text-blue-600 transition-colors">
                      {t('login', 'Login')}
                    </Link>
                    <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                      {t('signup', 'Sign Up')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {i18n.language === 'ko' ? '완벽한 플랜을 선택하세요' :
               i18n.language === 'ja' ? '最適なプランを選択' :
               i18n.language === 'zh' ? '选择完美的方案' :
               'Choose Your Perfect Plan'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {i18n.language === 'ko' ? 'AI 기반 법률 자동화로 업무 효율성을 높이세요. 모든 플랜에는 30일 무료 체험이 포함됩니다.' :
               i18n.language === 'ja' ? 'AI法務自動化で業務効率を向上させましょう。全プランに30日間無料トライアルが含まれます。' :
               i18n.language === 'zh' ? '通过AI法务自动化提高工作效率。所有套餐均包含30天免费试用。' :
               'Boost your legal productivity with AI-powered automation. All plans include a 30-day free trial.'}
            </p>
          </div>

          {/* AI Recommendation Section */}
          {session?.user && recommendation && (
            <div className="mb-12">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <div className="flex items-center mb-4">
                  <Bot className="h-8 w-8 mr-3" />
                  <h2 className="text-2xl font-bold">
                    {i18n.language === 'ko' ? 'AI 추천 플랜' :
                     i18n.language === 'ja' ? 'AI推奨プラン' :
                     i18n.language === 'zh' ? 'AI推荐方案' :
                     'AI Recommended Plan'}
                  </h2>
                  <div className="ml-auto flex items-center">
                    <Star className="h-5 w-5 mr-1" />
                    <span className="text-sm">
                      {Math.round(recommendation.confidence_score * 100)}% {i18n.language === 'ko' ? '신뢰도' : 'Confidence'}
                    </span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 capitalize">
                      {recommendation.recommended_plan} Plan
                    </h3>
                    <p className="text-blue-100 mb-4">{recommendation.ai_insights}</p>
                    
                    <h4 className="font-semibold mb-2">
                      {i18n.language === 'ko' ? '추천 이유:' :
                       i18n.language === 'ja' ? '推奨理由:' :
                       i18n.language === 'zh' ? '推荐理由:' :
                       'Why we recommend this:'}
                    </h4>
                    <ul className="text-blue-100 space-y-1">
                      {recommendation.reasons.map((reason, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">
                      {i18n.language === 'ko' ? '업그레이드 혜택:' :
                       i18n.language === 'ja' ? 'アップグレード特典:' :
                       i18n.language === 'zh' ? '升级优势:' :
                       'Upgrade Benefits:'}
                    </h4>
                    <ul className="text-blue-100 space-y-1 mb-4">
                      {recommendation.upgrade_benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <TrendingUp className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="text-sm text-blue-100 mb-1">
                        {i18n.language === 'ko' ? '비용 분석' : 'Cost Analysis'}
                      </div>
                      <div className="text-lg font-semibold">
                        ${recommendation.cost_analysis.current_cost} → ${recommendation.cost_analysis.recommended_cost}
                      </div>
                      <div className="text-sm text-blue-200">
                        {recommendation.cost_analysis.savings_potential}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => handleSelectPlan(recommendation.recommended_plan)}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center"
                  >
                    {i18n.language === 'ko' ? '추천 플랜 선택' :
                     i18n.language === 'ja' ? '推奨プランを選択' :
                     i18n.language === 'zh' ? '选择推荐方案' :
                     'Choose Recommended Plan'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${
                  plan.recommended ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                    {i18n.language === 'ko' ? '가장 인기있는' :
                     i18n.language === 'ja' ? '最も人気' :
                     i18n.language === 'zh' ? '最受欢迎' :
                     'Most Popular'}
                  </div>
                )}
                {plan.recommended && (
                  <div className="bg-purple-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center">
                    <Target className="h-4 w-4 mr-1" />
                    {i18n.language === 'ko' ? 'AI 추천' :
                     i18n.language === 'ja' ? 'AI推奨' :
                     i18n.language === 'zh' ? 'AI推荐' :
                     'AI Recommended'}
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-8">
                    <span className="text-4xl font-bold text-gray-900">{plan.currency}{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                        )}
                        <span className={`${feature.included ? 'text-gray-900' : 'text-gray-400'}`}>
                          {feature.name}
                          {feature.value && (
                            <span className="ml-1 text-sm text-blue-600 font-medium">
                              ({feature.value})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      plan.popular || plan.recommended
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {session?.user ? (
                      i18n.language === 'ko' ? '플랜 선택' :
                      i18n.language === 'ja' ? 'プラン選択' :
                      i18n.language === 'zh' ? '选择方案' :
                      'Choose Plan'
                    ) : (
                      i18n.language === 'ko' ? '무료 체험 시작' :
                      i18n.language === 'ja' ? '無料トライアル開始' :
                      i18n.language === 'zh' ? '开始免费试用' :
                      'Start Free Trial'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              {i18n.language === 'ko' ? '자주 묻는 질문' :
               i18n.language === 'ja' ? 'よくある質問' :
               i18n.language === 'zh' ? '常见问题' :
               'Frequently Asked Questions'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {i18n.language === 'ko' ? '언제든지 플랜을 변경할 수 있나요?' :
                   i18n.language === 'ja' ? 'いつでもプランを変更できますか？' :
                   i18n.language === 'zh' ? '我可以随时更改方案吗？' :
                   'Can I change my plan anytime?'}
                </h3>
                <p className="text-gray-600">
                  {i18n.language === 'ko' ? '네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다.' :
                   i18n.language === 'ja' ? 'はい、いつでもプランをアップグレードまたはダウングレードできます。' :
                   i18n.language === 'zh' ? '是的，您可以随时升级或降级您的方案。' :
                   'Yes, you can upgrade or downgrade your plan at any time.'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {i18n.language === 'ko' ? '무료 체험 기간은 얼마나 되나요?' :
                   i18n.language === 'ja' ? '無料トライアル期間はどのくらいですか？' :
                   i18n.language === 'zh' ? '免费试用期有多长？' :
                   'How long is the free trial?'}
                </h3>
                <p className="text-gray-600">
                  {i18n.language === 'ko' ? '모든 플랜에 30일 무료 체험이 포함되어 있습니다.' :
                   i18n.language === 'ja' ? '全プランに30日間の無料トライアルが含まれています。' :
                   i18n.language === 'zh' ? '所有方案都包含30天免费试用。' :
                   'All plans include a 30-day free trial period.'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {i18n.language === 'ko' ? '데이터는 안전하게 보호되나요?' :
                   i18n.language === 'ja' ? 'データは安全に保護されますか？' :
                   i18n.language === 'zh' ? '数据安全受到保护吗？' :
                   'Is my data secure?'}
                </h3>
                <p className="text-gray-600">
                  {i18n.language === 'ko' ? '최고 수준의 암호화와 보안 조치로 데이터를 보호합니다.' :
                   i18n.language === 'ja' ? '最高レベルの暗号化とセキュリティ対策でデータを保護します。' :
                   i18n.language === 'zh' ? '我们采用最高级别的加密和安全措施保护您的数据。' :
                   'We use enterprise-grade encryption and security measures to protect your data.'}
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {i18n.language === 'ko' ? '결제는 어떻게 처리되나요?' :
                   i18n.language === 'ja' ? '支払いはどのように処理されますか？' :
                   i18n.language === 'zh' ? '付款如何处理？' :
                   'How is billing handled?'}
                </h3>
                <p className="text-gray-600">
                  {i18n.language === 'ko' ? 'Stripe를 통해 안전하게 결제가 처리되며, 언제든지 취소 가능합니다.' :
                   i18n.language === 'ja' ? 'Stripeを通じて安全に決済処理され、いつでもキャンセル可能です。' :
                   i18n.language === 'zh' ? '通过Stripe安全处理付款，您可以随时取消。' :
                   'Billing is securely processed through Stripe and you can cancel anytime.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PricingPage;