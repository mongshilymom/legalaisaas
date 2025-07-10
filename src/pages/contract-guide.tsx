import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import { 
  Shield, ArrowLeft, FileText, CheckCircle, AlertTriangle, Users,
  ChevronRight, Clock, User, ArrowRight, Search, Download, BookOpen
} from 'lucide-react';
import { logUserAction } from '../lib/logUserAction';

interface MetaTags {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  openGraphImageUrl?: string;
}

interface ContractGuidePageProps {
  metaTags: MetaTags;
}

const ContractGuidePage: NextPage<ContractGuidePageProps> = ({ metaTags }) => {
  const { t, i18n } = useTranslation();
  const { data: session } = useSession();
  const [seoSource, setSeoSource] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const seoTag = urlParams.get('seo_tag');
    
    if (utmSource === 'seo' || seoTag || document.referrer.includes('google.') || document.referrer.includes('naver.')) {
      const tag = seoTag || 'contract-guide.general';
      setSeoSource(tag);
      
      logUserAction({
        type: 'SEO_VISITOR',
        page: '/contract-guide',
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
        page: '/contract-guide',
        tag: seoSource,
        userId: session?.user?.id,
        source: 'seo'
      });
    }
    window.location.href = '/pricing';
  };

  const contractTypes = [
    {
      type: i18n.language === 'ko' ? '고용 계약서' : 'Employment Contracts',
      description: i18n.language === 'ko' ? '근로자 고용 시 필수 조항과 주의사항' : 'Essential clauses and precautions when hiring employees',
      checklist: [
        i18n.language === 'ko' ? '근로조건 명시' : 'Specify working conditions',
        i18n.language === 'ko' ? '급여 및 수당 규정' : 'Salary and allowance regulations', 
        i18n.language === 'ko' ? '근무시간 및 휴가' : 'Working hours and vacation',
        i18n.language === 'ko' ? '기밀유지 조항' : 'Confidentiality clauses'
      ],
      risks: [
        i18n.language === 'ko' ? '불명확한 직무 범위' : 'Unclear job scope',
        i18n.language === 'ko' ? '부적절한 해지 조건' : 'Inappropriate termination conditions'
      ],
      downloadUrl: '#'
    },
    {
      type: i18n.language === 'ko' ? '서비스 계약서' : 'Service Agreements',
      description: i18n.language === 'ko' ? '서비스 제공 업체와의 계약 시 핵심 사항' : 'Key points when contracting with service providers',
      checklist: [
        i18n.language === 'ko' ? '서비스 범위 정의' : 'Define service scope',
        i18n.language === 'ko' ? '성과 지표 설정' : 'Set performance indicators',
        i18n.language === 'ko' ? '책임과 의무 명시' : 'Specify responsibilities and obligations',
        i18n.language === 'ko' ? '지적재산권 보호' : 'Intellectual property protection'
      ],
      risks: [
        i18n.language === 'ko' ? '서비스 품질 보장 부족' : 'Lack of service quality assurance',
        i18n.language === 'ko' ? '데이터 보안 위험' : 'Data security risks'
      ],
      downloadUrl: '#'
    },
    {
      type: i18n.language === 'ko' ? '공급업체 계약서' : 'Supplier Contracts',
      description: i18n.language === 'ko' ? '안정적인 공급망 구축을 위한 계약 가이드' : 'Contract guide for building stable supply chains',
      checklist: [
        i18n.language === 'ko' ? '납기 및 품질 기준' : 'Delivery and quality standards',
        i18n.language === 'ko' ? '가격 조정 메커니즘' : 'Price adjustment mechanism',
        i18n.language === 'ko' ? '불가항력 조항' : 'Force majeure clauses',
        i18n.language === 'ko' ? '계약 해지 조건' : 'Contract termination conditions'
      ],
      risks: [
        i18n.language === 'ko' ? '공급 중단 위험' : 'Supply disruption risk',
        i18n.language === 'ko' ? '품질 보증 부족' : 'Lack of quality assurance'
      ],
      downloadUrl: '#'
    },
    {
      type: i18n.language === 'ko' ? 'SaaS 계약서' : 'SaaS Agreements',
      description: i18n.language === 'ko' ? '소프트웨어 서비스 이용 계약의 중요 포인트' : 'Important points in software service agreements',
      checklist: [
        i18n.language === 'ko' ? '서비스 수준 협약(SLA)' : 'Service Level Agreement (SLA)',
        i18n.language === 'ko' ? '데이터 소유권 및 보안' : 'Data ownership and security',
        i18n.language === 'ko' ? '업그레이드 및 유지보수' : 'Upgrades and maintenance',
        i18n.language === 'ko' ? '서비스 종료 시 데이터 처리' : 'Data handling upon service termination'
      ],
      risks: [
        i18n.language === 'ko' ? '벤더 종속성 위험' : 'Vendor lock-in risk',
        i18n.language === 'ko' ? '데이터 유출 가능성' : 'Data breach possibility'
      ],
      downloadUrl: '#'
    }
  ];

  const aiFeatures = [
    {
      title: i18n.language === 'ko' ? '자동 리스크 탐지' : 'Automatic Risk Detection',
      description: i18n.language === 'ko' ? 'AI가 계약서에서 잠재적 위험 요소를 자동으로 식별합니다.' : 'AI automatically identifies potential risk factors in contracts.',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: i18n.language === 'ko' ? '스마트 조항 추천' : 'Smart Clause Recommendations',
      description: i18n.language === 'ko' ? '업계 모범 사례를 바탕으로 최적의 계약 조항을 제안합니다.' : 'Suggests optimal contract clauses based on industry best practices.',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: i18n.language === 'ko' ? '실시간 컴플라이언스 검사' : 'Real-time Compliance Check',
      description: i18n.language === 'ko' ? '법령 및 규정 준수 여부를 실시간으로 확인합니다.' : 'Checks compliance with laws and regulations in real-time.',
      icon: Shield,
      color: 'blue'
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
        <meta property="og:url" content="https://legal-ai-saas.com/contract-guide" />
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
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
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-8 text-white text-center">
                <div className="flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 mr-3" />
                  <h2 className="text-2xl font-bold">
                    {i18n.language === 'ko' ? '📋 완벽한 계약서 가이드를 찾고 계셨군요!' :
                     i18n.language === 'ja' ? '📋 完璧な契約書ガイドをお探しでしたね！' :
                     i18n.language === 'zh' ? '📋 您在寻找完美的合同指南！' :
                     '📋 Looking for the Perfect Contract Guide!'}
                  </h2>
                </div>
                <p className="text-green-100 mb-6 text-lg">
                  {i18n.language === 'ko' ? '이 모든 가이드를 AI로 자동화해서 사용하고 싶으시다면, 지금 무료 체험을 시작하세요!' :
                   i18n.language === 'ja' ? 'これらすべてのガイドをAIで自動化して使いたい場合は、今すぐ無料トライアルを開始してください！' :
                   i18n.language === 'zh' ? '如果您想使用AI自动化所有这些指南，请立即开始免费试用！' :
                   'Want to automate all these guides with AI? Start your free trial now!'}
                </p>
                <button
                  onClick={handleCtaClick}
                  className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center text-lg"
                >
                  {i18n.language === 'ko' ? 'AI 계약 분석 체험하기' :
                   i18n.language === 'ja' ? 'AI契約分析を試す' :
                   i18n.language === 'zh' ? '体验AI合同分析' :
                   'Try AI Contract Analysis'}
                  <ArrowRight className="ml-3 h-6 w-6" />
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {i18n.language === 'ko' ? '계약서 작성 가이드' :
               i18n.language === 'ja' ? '契約書作成ガイド' :
               i18n.language === 'zh' ? '合同起草指南' :
               'Contract Drafting Guide'}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {i18n.language === 'ko' ? '전문가가 검증한 계약서 템플릿과 체크리스트로 완벽한 계약서를 작성하세요. AI 기반 리스크 분석으로 더욱 안전하게.' :
               i18n.language === 'ja' ? '専門家が検証した契約書テンプレートとチェックリストで完璧な契約書を作成しましょう。AI基盤のリスク分析でより安全に。' :
               i18n.language === 'zh' ? '使用专家验证的合同模板和检查清单起草完美的合同。通过基于AI的风险分析更安全。' :
               'Draft perfect contracts with expert-verified templates and checklists. Enhanced safety through AI-powered risk analysis.'}
            </p>
          </div>

          {/* AI Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
              {i18n.language === 'ko' ? 'AI 계약 분석 기능' : 'AI Contract Analysis Features'}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {aiFeatures.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className={`w-16 h-16 bg-${feature.color}-100 rounded-xl flex items-center justify-center mx-auto mb-6`}>
                    <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contract Types */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              {i18n.language === 'ko' ? '계약서 유형별 가이드' : 'Contract Type Guides'}
            </h2>
            
            {contractTypes.map((contract, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{contract.type}</h3>
                      <p className="text-gray-600 text-lg">{contract.description}</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      {i18n.language === 'ko' ? '템플릿' : 'Template'}
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {i18n.language === 'ko' ? '필수 체크리스트' : 'Essential Checklist'}
                      </h4>
                      <ul className="space-y-2">
                        {contract.checklist.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        {i18n.language === 'ko' ? '주요 위험 요소' : 'Key Risk Factors'}
                      </h4>
                      <ul className="space-y-2">
                        {contract.risks.map((risk, riskIndex) => (
                          <li key={riskIndex} className="flex items-center text-gray-700">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 text-center text-white">
            <div className="flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 mr-3" />
              <h2 className="text-3xl font-bold">
                {i18n.language === 'ko' ? 'AI로 더 스마트하게' :
                 i18n.language === 'ja' ? 'AIでよりスマートに' :
                 i18n.language === 'zh' ? '通过AI更智能' :
                 'Smarter with AI'}
              </h2>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {i18n.language === 'ko' ? '이 모든 체크리스트와 가이드를 AI가 자동으로 적용해서 계약서를 분석해드립니다. 수동 검토는 이제 그만!' :
               i18n.language === 'ja' ? 'これらすべてのチェックリストとガイドをAIが自動で適用して契約書を分析いたします。手動レビューはもうやめましょう！' :
               i18n.language === 'zh' ? 'AI将自动应用所有这些检查清单和指南来分析合同。告别手动审查！' :
               'AI automatically applies all these checklists and guides to analyze your contracts. No more manual reviews!'}
            </p>
            <button
              onClick={handleCtaClick}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center text-lg"
            >
              {i18n.language === 'ko' ? 'AI 계약 분석 시작하기' :
               i18n.language === 'ja' ? 'AI契約分析を開始' :
               i18n.language === 'zh' ? '开始AI合同分析' :
               'Start AI Contract Analysis'}
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
    const title = 'Contract Drafting Guide - AI-Powered Legal Contract Templates';
    const content = `Complete contract drafting guide with expert-verified templates, checklists, and AI-powered risk analysis. Covers employment contracts, service agreements, supplier contracts, and SaaS agreements. Essential clauses, compliance checks, and legal best practices for contract creation and review.`;
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
      metaDescription: 'Complete contract drafting guide with AI-powered templates and risk analysis.',
      keywords: ['contract guide', 'legal templates', 'AI contract analysis', 'contract drafting'],
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
          metaTitle: 'Contract Drafting Guide - AI-Powered Templates',
          metaDescription: 'Complete contract drafting guide with AI-powered templates.',
          keywords: ['contract guide', 'legal templates', 'AI contract analysis'],
          openGraphImageUrl: undefined,
        },
      },
    };
  }
};

export default ContractGuidePage;