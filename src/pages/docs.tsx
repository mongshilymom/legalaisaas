import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, ArrowLeft, Book, FileText, Users, Download, Search,
  ChevronRight, Clock, User, Tag, ArrowRight
} from 'lucide-react';
import { logUserAction } from '../lib/logUserAction';

interface MetaTags {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  openGraphImageUrl?: string;
}

interface DocsPageProps {
  metaTags: MetaTags;
}

const DocsPage: NextPage<DocsPageProps> = ({ metaTags }) => {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const [seoSource, setSeoSource] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const seoTag = urlParams.get('seo_tag');
    
    if (utmSource === 'seo' || seoTag || document.referrer.includes('google.') || document.referrer.includes('naver.')) {
      const tag = seoTag || 'docs.general';
      setSeoSource(tag);
      
      logUserAction({
        type: 'SEO_VISITOR',
        page: '/docs',
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
        page: '/docs',
        tag: seoSource,
        userId: session?.user?.id,
        source: 'seo'
      });
    }
    window.location.href = '/pricing';
  };

  const docSections = [
    {
      title: i18n.language === 'ko' ? '시작 가이드' : 'Getting Started',
      description: i18n.language === 'ko' ? 'Legal AI SaaS 플랫폼을 시작하는 방법을 단계별로 알아보세요.' : 'Learn how to get started with the Legal AI SaaS platform step by step.',
      articles: [
        { title: i18n.language === 'ko' ? '계정 설정하기' : 'Account Setup', readTime: '5 min', author: 'Legal AI Team' },
        { title: i18n.language === 'ko' ? '첫 번째 문서 분석' : 'First Document Analysis', readTime: '10 min', author: 'Legal AI Team' },
        { title: i18n.language === 'ko' ? 'AI 기능 활용하기' : 'Using AI Features', readTime: '15 min', author: 'Legal AI Team' }
      ]
    },
    {
      title: i18n.language === 'ko' ? 'AI 계약서 분석' : 'AI Contract Analysis',
      description: i18n.language === 'ko' ? 'AI 기반 계약서 분석 기능의 상세한 사용법과 팁을 제공합니다.' : 'Detailed usage and tips for AI-powered contract analysis features.',
      articles: [
        { title: i18n.language === 'ko' ? '지원되는 문서 형식' : 'Supported Document Formats', readTime: '3 min', author: 'Technical Team' },
        { title: i18n.language === 'ko' ? '리스크 분석 이해하기' : 'Understanding Risk Analysis', readTime: '12 min', author: 'Legal Team' },
        { title: i18n.language === 'ko' ? '분석 결과 해석하기' : 'Interpreting Analysis Results', readTime: '8 min', author: 'Legal Team' }
      ]
    },
    {
      title: i18n.language === 'ko' ? '컴플라이언스 관리' : 'Compliance Management',
      description: i18n.language === 'ko' ? '규정 준수 모니터링과 관리 도구 사용법을 안내합니다.' : 'Guide to using compliance monitoring and management tools.',
      articles: [
        { title: i18n.language === 'ko' ? '컴플라이언스 체크리스트' : 'Compliance Checklist', readTime: '7 min', author: 'Compliance Team' },
        { title: i18n.language === 'ko' ? '자동 알림 설정' : 'Setting Up Automated Alerts', readTime: '5 min', author: 'Technical Team' },
        { title: i18n.language === 'ko' ? '보고서 생성하기' : 'Generating Reports', readTime: '10 min', author: 'Legal Team' }
      ]
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
        <meta property="og:url" content="https://legal-ai-saas.com/docs" />
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
              <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-8 text-white text-center">
                <div className="flex items-center justify-center mb-4">
                  <Book className="h-8 w-8 mr-3" />
                  <h2 className="text-2xl font-bold">
                    {i18n.language === 'ko' ? '📚 완전한 AI 법률 가이드를 찾고 계셨군요!' :
                     i18n.language === 'ja' ? '📚 完全なAI法務ガイドをお探しでしたね！' :
                     i18n.language === 'zh' ? '📚 您在寻找完整的AI法务指南！' :
                     '📚 Looking for the Complete AI Legal Guide!'}
                  </h2>
                </div>
                <p className="text-green-100 mb-6 text-lg">
                  {i18n.language === 'ko' ? '이 모든 기능들을 실제로 사용해보고 싶으시다면, 지금 무료 체험을 시작하세요!' :
                   i18n.language === 'ja' ? 'これらすべての機能を実際に使ってみたい場合は、今すぐ無料トライアルを開始してください！' :
                   i18n.language === 'zh' ? '如果您想实际使用所有这些功能，请立即开始免费试用！' :
                   'Want to actually use all these features? Start your free trial now!'}
                </p>
                <button
                  onClick={handleCtaClick}
                  className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center text-lg"
                >
                  {i18n.language === 'ko' ? '무료로 시작하기' :
                   i18n.language === 'ja' ? '無料で始める' :
                   i18n.language === 'zh' ? '免费开始' :
                   'Start Free'}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {i18n.language === 'ko' ? 'Legal AI 문서' :
               i18n.language === 'ja' ? 'Legal AIドキュメント' :
               i18n.language === 'zh' ? 'Legal AI文档' :
               'Legal AI Documentation'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {i18n.language === 'ko' ? 'AI 기반 법률 자동화 플랫폼의 모든 기능을 마스터하세요. 단계별 가이드와 전문가 팁을 제공합니다.' :
               i18n.language === 'ja' ? 'AI駆動の法務自動化プラットフォームのすべての機能をマスターしましょう。ステップバイステップガイドと専門家のヒントを提供します。' :
               i18n.language === 'zh' ? '掌握AI驱动的法务自动化平台的所有功能。提供分步指南和专家提示。' :
               'Master all features of the AI-powered legal automation platform. Step-by-step guides and expert tips included.'}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={i18n.language === 'ko' ? '문서 검색...' : 'Search documentation...'}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="space-y-12">
            {docSections.map((section, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Book className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.articles.map((article, articleIndex) => (
                    <div key={articleIndex} className="group cursor-pointer bg-gray-50 hover:bg-blue-50 rounded-lg p-6 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <FileText className="h-5 w-5 text-blue-600 mt-1" />
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {article.readTime}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {article.author}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center text-white">
            <div className="flex items-center justify-center mb-6">
              <Download className="h-8 w-8 mr-3" />
              <h2 className="text-3xl font-bold">
                {i18n.language === 'ko' ? '실제로 사용해보세요' :
                 i18n.language === 'ja' ? '実際に使ってみましょう' :
                 i18n.language === 'zh' ? '实际使用看看' :
                 'Try It In Action'}
              </h2>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {i18n.language === 'ko' ? '문서를 읽는 것보다 직접 체험해보는 것이 더 좋습니다. 지금 바로 무료 체험을 시작하세요.' :
               i18n.language === 'ja' ? 'ドキュメントを読むよりも、直接体験する方が良いでしょう。今すぐ無料トライアルを開始してください。' :
               i18n.language === 'zh' ? '比阅读文档更好的是直接体验。立即开始免费试用。' :
               'Better than reading docs is experiencing it firsthand. Start your free trial now.'}
            </p>
            <button
              onClick={handleCtaClick}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center text-lg"
            >
              {i18n.language === 'ko' ? '무료 체험 시작' :
               i18n.language === 'ja' ? '無料トライアル開始' :
               i18n.language === 'zh' ? '开始免费试用' :
               'Start Free Trial'}
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
    const title = 'Legal AI Documentation - Complete Guide to AI Legal Automation';
    const content = `Complete documentation for Legal AI SaaS platform. Learn AI contract analysis, compliance management, document automation, and legal AI tools. Step-by-step guides for legal professionals to leverage artificial intelligence in legal practice. Comprehensive tutorials for contract review, risk analysis, and legal workflow automation.`;
    const locale = context.locale || 'ko';

    // Call the meta-generator API
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
      metaDescription: 'Complete documentation for Legal AI SaaS platform with step-by-step guides.',
      keywords: ['legal AI', 'documentation', 'legal automation', 'contract analysis'],
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
          metaTitle: 'Legal AI Documentation - Complete Guide',
          metaDescription: 'Complete documentation for Legal AI SaaS platform with step-by-step guides.',
          keywords: ['legal AI', 'documentation', 'legal automation'],
          openGraphImageUrl: undefined,
        },
      },
    };
  }
};

export default DocsPage;