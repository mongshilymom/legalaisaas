import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, ArrowLeft, TrendingUp, Lightbulb, Users, Calendar,
  ChevronRight, Clock, User, Tag, ArrowRight, Eye, BarChart
} from 'lucide-react';
import { logUserAction } from '../lib/logUserAction';

interface MetaTags {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  openGraphImageUrl?: string;
}

interface LegalInsightsPageProps {
  metaTags: MetaTags;
}

const LegalInsightsPage: NextPage<LegalInsightsPageProps> = ({ metaTags }) => {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const [seoSource, setSeoSource] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const seoTag = urlParams.get('seo_tag');
    
    if (utmSource === 'seo' || seoTag || document.referrer.includes('google.') || document.referrer.includes('naver.')) {
      const tag = seoTag || 'insights.general';
      setSeoSource(tag);
      
      logUserAction({
        type: 'SEO_VISITOR',
        page: '/legal-insights',
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
        page: '/legal-insights',
        tag: seoSource,
        userId: session?.user?.id,
        source: 'seo'
      });
    }
    window.location.href = '/pricing';
  };

  const insights = [
    {
      category: i18n.language === 'ko' ? 'AI 법률 동향' : 'AI Legal Trends',
      title: i18n.language === 'ko' ? '2024년 AI 기반 계약 분석의 최신 동향' : '2024 Latest Trends in AI-Based Contract Analysis',
      excerpt: i18n.language === 'ko' ? 
        '인공지능이 법률 업계를 어떻게 변화시키고 있는지, 그리고 계약 분석 자동화가 법무팀의 효율성을 어떻게 향상시키는지 살펴봅니다.' :
        'Explore how artificial intelligence is transforming the legal industry and how contract analysis automation is improving legal team efficiency.',
      readTime: '8 min',
      views: '2.3k',
      date: '2024-01-15',
      tags: ['AI', i18n.language === 'ko' ? '계약분석' : 'Contract Analysis', i18n.language === 'ko' ? '자동화' : 'Automation']
    },
    {
      category: i18n.language === 'ko' ? '컴플라이언스' : 'Compliance',
      title: i18n.language === 'ko' ? '중소기업을 위한 스마트 컴플라이언스 관리' : 'Smart Compliance Management for SMEs',
      excerpt: i18n.language === 'ko' ? 
        '제한된 리소스로도 효과적인 컴플라이언스 관리가 가능한 AI 기반 솔루션을 소개합니다. 중소기업 법무팀의 필수 가이드입니다.' :
        'Introducing AI-based solutions that enable effective compliance management even with limited resources. Essential guide for SME legal teams.',
      readTime: '12 min',
      views: '1.8k',
      date: '2024-01-10',
      tags: [i18n.language === 'ko' ? '컴플라이언스' : 'Compliance', 'SME', i18n.language === 'ko' ? '관리' : 'Management']
    },
    {
      category: i18n.language === 'ko' ? '디지털 전환' : 'Digital Transformation',
      title: i18n.language === 'ko' ? '법무팀의 디지털 전환: 단계별 로드맵' : 'Legal Team Digital Transformation: Step-by-Step Roadmap',
      excerpt: i18n.language === 'ko' ? 
        '전통적인 법무 업무에서 AI 기반 자동화로의 전환 과정을 체계적으로 안내합니다. 실패 없는 디지털 전환의 비결을 공개합니다.' :
        'Systematically guide the transition from traditional legal work to AI-based automation. Reveals the secrets of successful digital transformation.',
      readTime: '15 min',
      views: '3.1k',
      date: '2024-01-08',
      tags: [i18n.language === 'ko' ? '디지털전환' : 'Digital Transformation', 'AI', i18n.language === 'ko' ? '로드맵' : 'Roadmap']
    },
    {
      category: i18n.language === 'ko' ? '리스크 관리' : 'Risk Management',
      title: i18n.language === 'ko' ? 'AI가 발견하는 숨겨진 계약 리스크' : 'Hidden Contract Risks Discovered by AI',
      excerpt: i18n.language === 'ko' ? 
        '인간이 놓치기 쉬운 미묘한 계약 조항들을 AI가 어떻게 식별하는지 실제 사례를 통해 알아봅니다. 리스크 예방의 새로운 패러다임을 제시합니다.' :
        'Learn through real cases how AI identifies subtle contract clauses that humans easily miss. Presents a new paradigm for risk prevention.',
      readTime: '10 min',
      views: '2.7k',
      date: '2024-01-05',
      tags: [i18n.language === 'ko' ? '리스크관리' : 'Risk Management', AI, i18n.language === 'ko' ? '계약검토' : 'Contract Review']
    },
    {
      category: i18n.language === 'ko' ? '업계 동향' : 'Industry Trends',
      title: i18n.language === 'ko' ? '글로벌 법률 테크 시장의 성장과 기회' : 'Growth and Opportunities in Global Legal Tech Market',
      excerpt: i18n.language === 'ko' ? 
        '전 세계 법률 기술 시장의 최신 동향과 투자 현황을 분석합니다. 한국 법률 서비스 시장에서의 기회와 도전을 함께 살펴봅니다.' :
        'Analyze the latest trends and investment status in the global legal technology market. Explore opportunities and challenges in the Korean legal services market.',
      readTime: '14 min',
      views: '1.9k',
      date: '2024-01-03',
      tags: [i18n.language === 'ko' ? '시장동향' : 'Market Trends', 'LegalTech', i18n.language === 'ko' ? '투자' : 'Investment']
    },
    {
      category: i18n.language === 'ko' ? '실무 가이드' : 'Practical Guide',
      title: i18n.language === 'ko' ? 'AI 도구 도입 시 피해야 할 5가지 실수' : '5 Mistakes to Avoid When Implementing AI Tools',
      excerpt: i18n.language === 'ko' ? 
        '법무팀이 AI 도구를 도입할 때 흔히 범하는 실수들과 이를 방지하는 방법을 실무진의 경험을 바탕으로 정리했습니다.' :
        'Common mistakes legal teams make when implementing AI tools and how to prevent them, compiled based on practitioners\' experience.',
      readTime: '9 min',
      views: '4.2k',
      date: '2024-01-01',
      tags: [i18n.language === 'ko' ? '실무가이드' : 'Practical Guide', 'AI', i18n.language === 'ko' ? '도입' : 'Implementation']
    }
  ];

  return (
    <>
      <Head>
        <title>{metaTags.metaTitle}</title>
        <meta name="description" content={metaTags.metaDescription} />
        <meta name="keywords" content={metaTags.keywords.join(', ')} />
        
        {/* Open Graph tags */}
        <meta property="og:title" content={metaTags.metaTitle} />
        <meta property="og:description" content={metaTags.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://legal-ai-saas.com/legal-insights" />
        {metaTags.openGraphImageUrl && (
          <meta property="og:image" content={metaTags.openGraphImageUrl} />
        )}
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTags.metaTitle} />
        <meta name="twitter:description" content={metaTags.metaDescription} />
        {metaTags.openGraphImageUrl && (
          <meta name="twitter:image" content={metaTags.openGraphImageUrl} />
        )}
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
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
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center">
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 mr-3" />
                  <h2 className="text-2xl font-bold">
                    {i18n.language === 'ko' ? '📈 최신 법률 AI 인사이트를 찾고 계셨군요!' :
                     i18n.language === 'ja' ? '📈 最新の法務AIインサイトをお探しでしたね！' :
                     i18n.language === 'zh' ? '📈 您在寻找最新的法律AI洞察！' :
                     '📈 Looking for Latest Legal AI Insights!'}
                  </h2>
                </div>
                <p className="text-purple-100 mb-6 text-lg">
                  {i18n.language === 'ko' ? '이런 첨단 AI 기법들을 직접 활용해보고 싶으시다면, 지금 무료 체험을 시작하세요!' :
                   i18n.language === 'ja' ? 'これらの最先端AI技術を直接活用したい場合は、今すぐ無料トライアルを開始してください！' :
                   i18n.language === 'zh' ? '如果您想直接使用这些尖端AI技术，请立即开始免费试用！' :
                   'Want to leverage these cutting-edge AI techniques? Start your free trial now!'}
                </p>
                <button
                  onClick={handleCtaClick}
                  className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition-colors inline-flex items-center text-lg"
                >
                  {i18n.language === 'ko' ? 'AI 법률 도구 체험하기' :
                   i18n.language === 'ja' ? 'AI法務ツールを試す' :
                   i18n.language === 'zh' ? '体验AI法律工具' :
                   'Try AI Legal Tools'}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {i18n.language === 'ko' ? '법률 AI 인사이트' :
               i18n.language === 'ja' ? '法務AIインサイト' :
               i18n.language === 'zh' ? '法律AI洞察' :
               'Legal AI Insights'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {i18n.language === 'ko' ? 'AI 기반 법률 자동화의 최신 트렌드와 실무진의 경험을 바탕으로 한 심도 있는 인사이트를 제공합니다.' :
               i18n.language === 'ja' ? 'AI駆動の法務自動化の最新トレンドと実務者の経験に基づく深いインサイトを提供します。' :
               i18n.language === 'zh' ? '基于AI驱动的法务自动化最新趋势和从业者经验，提供深度洞察。' :
               'Providing deep insights based on the latest trends in AI-powered legal automation and practitioners\' experiences.'}
            </p>
          </div>

          {/* Featured Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">50+</div>
              <div className="text-gray-600">{i18n.language === 'ko' ? '전문 리서치 아티클' : 'Expert Research Articles'}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">10K+</div>
              <div className="text-gray-600">{i18n.language === 'ko' ? '월간 독자 수' : 'Monthly Readers'}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-gray-600">{i18n.language === 'ko' ? '실무 적용 성공률' : 'Practical Application Success'}</div>
            </div>
          </div>

          {/* Insights Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {insights.map((insight, index) => (
              <article key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group cursor-pointer">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 text-sm font-medium rounded-full">
                      {insight.category}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                    {insight.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {insight.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {insight.readTime}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {insight.views}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {insight.date}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {insight.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
            <div className="flex items-center justify-center mb-6">
              <TrendingUp className="h-8 w-8 mr-3" />
              <h2 className="text-3xl font-bold">
                {i18n.language === 'ko' ? '실제 도구로 경험하기' :
                 i18n.language === 'ja' ? '実際のツールで体験' :
                 i18n.language === 'zh' ? '用实际工具体验' :
                 'Experience with Real Tools'}
              </h2>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {i18n.language === 'ko' ? '이런 인사이트들이 실제로 어떻게 작동하는지 궁금하시다면, 지금 바로 우리의 AI 법률 도구를 체험해보세요.' :
               i18n.language === 'ja' ? 'これらのインサイトが実際にどのように機能するか気になる場合は、今すぐ私たちのAI法務ツールを体験してください。' :
               i18n.language === 'zh' ? '如果您想知道这些洞察实际上是如何工作的，请立即体验我们的AI法律工具。' :
               'Curious about how these insights actually work? Try our AI legal tools right now.'}
            </p>
            <button
              onClick={handleCtaClick}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center text-lg"
            >
              {i18n.language === 'ko' ? '지금 무료로 시작하기' :
               i18n.language === 'ja' ? '今すぐ無料で始める' :
               i18n.language === 'zh' ? '立即免费开始' :
               'Start Free Now'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const title = 'Legal AI Insights - Latest Trends in AI Legal Automation';
    const content = `Expert insights on AI-powered legal automation, contract analysis trends, compliance management, and digital transformation in legal industry. Discover cutting-edge AI techniques for legal professionals, risk management strategies, and practical guides for implementing legal technology solutions.`;
    const locale = context.locale || 'ko';

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/seo/meta-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        locale,
      }),
    });

    let metaTags = {
      metaTitle: title,
      metaDescription: 'Expert insights on AI-powered legal automation and latest trends in legal technology.',
      keywords: ['legal AI insights', 'legal automation trends', 'AI contract analysis', 'legal technology'],
      openGraphImageUrl: undefined,
    };

    if (response.ok) {
      metaTags = await response.json();
    }

    return {
      props: {
        metaTags,
      },
    };
  } catch (error) {
    console.error('Failed to generate meta tags:', error);
    
    return {
      props: {
        metaTags: {
          metaTitle: 'Legal AI Insights - Latest Trends',
          metaDescription: 'Expert insights on AI-powered legal automation and latest trends.',
          keywords: ['legal AI insights', 'legal automation trends', 'legal technology'],
          openGraphImageUrl: undefined,
        },
      },
    };
  }
};

export default LegalInsightsPage;