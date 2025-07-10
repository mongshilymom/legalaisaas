import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, ArrowLeft, Bot, FileText, BarChart, Users, 
  Check, Zap, Star, ArrowRight, Target, Globe
} from 'lucide-react';
import { logUserAction } from '../lib/logUserAction';

const FeaturesPage: NextPage = () => {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const [seoSource, setSeoSource] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const seoTag = urlParams.get('seo_tag');
    
    if (utmSource === 'seo' || seoTag || document.referrer.includes('google.') || document.referrer.includes('naver.')) {
      const tag = seoTag || 'features.general';
      setSeoSource(tag);
      
      logUserAction({
        type: 'SEO_VISITOR',
        page: '/features',
        tag: tag,
        userId: session?.user?.id,
        source: 'seo'
      });
    }
  }, [session]);

  const handleCtaClick = () => {
    if (seoSource) {
      logUserAction({
        type: 'CTA_CLICK',
        page: '/features',
        tag: seoSource,
        userId: session?.user?.id,
        source: 'seo'
      });
    }
    window.location.href = '/pricing';
  };

  const features = [
    {
      icon: Bot,
      title: i18n.language === 'ko' ? 'AI 계약서 분석' : 'AI Contract Analysis',
      description: i18n.language === 'ko' ? 
        '첨단 AI가 계약서를 자동으로 분석하여 리스크와 기회를 식별합니다.' :
        'Advanced AI automatically analyzes contracts to identify risks and opportunities.',
      color: 'blue'
    },
    {
      icon: FileText,
      title: i18n.language === 'ko' ? '자동 문서 생성' : 'Automated Document Generation', 
      description: i18n.language === 'ko' ?
        '몇 번의 클릭만으로 전문적인 법률 문서를 생성할 수 있습니다.' :
        'Generate professional legal documents with just a few clicks.',
      color: 'green'
    },
    {
      icon: BarChart,
      title: i18n.language === 'ko' ? '컴플라이언스 모니터링' : 'Compliance Monitoring',
      description: i18n.language === 'ko' ?
        '실시간으로 규정 준수 상태를 모니터링하고 알림을 받습니다.' :
        'Monitor compliance status in real-time and receive notifications.',
      color: 'purple'
    },
    {
      icon: Users,
      title: i18n.language === 'ko' ? '팀 협업' : 'Team Collaboration',
      description: i18n.language === 'ko' ?
        '법무팀과 협업하여 더 효율적으로 작업할 수 있습니다.' :
        'Collaborate with your legal team for more efficient workflows.',
      color: 'orange'
    },
    {
      icon: Globe,
      title: i18n.language === 'ko' ? '다국어 지원' : 'Multi-language Support',
      description: i18n.language === 'ko' ?
        '한국어, 영어, 일본어, 중국어를 포함한 다국어 지원을 제공합니다.' :
        'Supports multiple languages including Korean, English, Japanese, and Chinese.',
      color: 'indigo'
    },
    {
      icon: Zap,
      title: i18n.language === 'ko' ? '빠른 처리 속도' : 'Fast Processing',
      description: i18n.language === 'ko' ?
        '몇 초 만에 복잡한 법률 분석을 완료할 수 있습니다.' :
        'Complete complex legal analysis in just seconds.',
      color: 'yellow'
    }
  ];

  return (
    <>
      <Head>
        <title>
          {i18n.language === 'ko' ? '기능 | Legal AI SaaS' :
           i18n.language === 'ja' ? '機能 | Legal AI SaaS' :
           i18n.language === 'zh' ? '功能 | Legal AI SaaS' :
           'Features | Legal AI SaaS'}
        </title>
        <meta name="description" content="Discover powerful AI-driven legal automation features" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  {t('home', 'Home')}
                </Link>
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-blue-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">Legal AI SaaS</span>
                </div>
              </div>
              <Link 
                href="/pricing"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                {t('pricing', 'Pricing')}
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* SEO CTA Banner */}
          {seoSource && (
            <div className="mb-12">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-8 text-white text-center">
                <div className="flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 mr-3" />
                  <h2 className="text-2xl font-bold">
                    {i18n.language === 'ko' ? '🚀 AI 법률 자동화의 모든 기능을 경험하세요!' :
                     i18n.language === 'ja' ? '🚀 AI法務自動化のすべての機能を体験！' :
                     i18n.language === 'zh' ? '🚀 体验AI法务自动化的所有功能！' :
                     '🚀 Experience All AI Legal Automation Features!'}
                  </h2>
                </div>
                <p className="text-blue-100 mb-6 text-lg">
                  {i18n.language === 'ko' ? '우리 기능들을 탐색하고 계시는군요! 지금 가입하면 모든 프리미엄 기능을 30일 무료로 체험할 수 있습니다.' :
                   i18n.language === 'ja' ? '機能をご覧いただきありがとうございます！今すぐご登録いただくと、全プレミアム機能を30日間無料でお試しできます。' :
                   i18n.language === 'zh' ? '感谢您探索我们的功能！立即注册可免费试用所有高级功能30天。' :
                   'Thanks for exploring our features! Sign up now for a 30-day free trial of all premium features.'}
                </p>
                <button
                  onClick={handleCtaClick}
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center text-lg"
                >
                  {i18n.language === 'ko' ? '무료 체험 시작하기' :
                   i18n.language === 'ja' ? '無料トライアル開始' :
                   i18n.language === 'zh' ? '开始免费试用' :
                   'Start Free Trial'}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {i18n.language === 'ko' ? '강력한 AI 법률 도구' :
               i18n.language === 'ja' ? '強力なAI法務ツール' :
               i18n.language === 'zh' ? '强大的AI法务工具' :
               'Powerful AI Legal Tools'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {i18n.language === 'ko' ? '법률 업무를 혁신하는 최첨단 AI 기능들을 만나보세요. 효율성과 정확성을 동시에 높이는 스마트한 솔루션입니다.' :
               i18n.language === 'ja' ? '法務業務を革新する最先端AI機能をご紹介します。効率性と正確性を同時に向上させるスマートソリューションです。' :
               i18n.language === 'zh' ? '探索革命性的尖端AI功能，提高法务工作的效率和准确性的智能解决方案。' :
               'Discover cutting-edge AI features that revolutionize legal work. Smart solutions that enhance both efficiency and accuracy.'}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                <div className="mt-6">
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">
                      {i18n.language === 'ko' ? '모든 플랜에 포함' : 'Included in all plans'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="flex items-center justify-center mb-6">
              <Star className="h-8 w-8 text-yellow-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                {i18n.language === 'ko' ? '지금 시작하세요' :
                 i18n.language === 'ja' ? '今すぐ始めましょう' :
                 i18n.language === 'zh' ? '立即开始' :
                 'Get Started Today'}
              </h2>
            </div>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {i18n.language === 'ko' ? '30일 무료 체험으로 모든 프리미엄 기능을 경험해보세요. 언제든지 취소 가능합니다.' :
               i18n.language === 'ja' ? '30日間の無料トライアルで全プレミアム機能をお試しください。いつでもキャンセル可能です。' :
               i18n.language === 'zh' ? '通过30天免费试用体验所有高级功能。随时可以取消。' :
               'Try all premium features with a 30-day free trial. Cancel anytime.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleCtaClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                {i18n.language === 'ko' ? '무료 체험 시작' :
                 i18n.language === 'ja' ? '無料トライアル開始' :
                 i18n.language === 'zh' ? '开始免费试用' :
                 'Start Free Trial'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <Link
                href="/pricing"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                {i18n.language === 'ko' ? '요금제 보기' :
                 i18n.language === 'ja' ? '料金プランを見る' :
                 i18n.language === 'zh' ? '查看定价' :
                 'View Pricing'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeaturesPage;