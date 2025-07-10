import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { ChevronRight, Shield, Zap, Globe, Users, CheckCircle, Star } from 'lucide-react';

const HomePage: NextPage = () => {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email signup logic
    console.log('Email signup:', email);
  };

  return (
    <>
      <Head>
        <title>Legal AI SaaS – 법률 자동화의 미래 | AI 기반 컴플라이언스 플랫폼</title>
        <meta name="description" content="AI 기반 법률 자동화 플랫폼으로 계약서 분석, 컴플라이언스 체크, 규제 준수를 자동화하세요. 법률 업무 효율성을 극대화하는 Legal AI SaaS 솔루션." />
        <meta name="keywords" content="법률 AI, 계약서 분석, 컴플라이언스, 규제 준수, 법률 자동화, Legal AI, SaaS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Legal AI SaaS – 법률 자동화의 미래" />
        <meta property="og:description" content="AI 기반 법률 자동화 플랫폼으로 계약서 분석, 컴플라이언스 체크, 규제 준수를 자동화하세요." />
        <meta property="og:image" content="/og-image.jpg" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={process.env.NEXT_PUBLIC_APP_URL} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Legal AI SaaS – 법률 자동화의 미래" />
        <meta name="twitter:description" content="AI 기반 법률 자동화 플랫폼으로 계약서 분석, 컴플라이언스 체크, 규제 준수를 자동화하세요." />
        <meta name="twitter:image" content="/og-image.jpg" />
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Legal AI SaaS</span>
              </div>
              <div className="flex items-center space-x-4">
                {session ? (
                  <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                    대시보드
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/signin" className="text-gray-700 hover:text-blue-600 transition-colors">
                      로그인
                    </Link>
                    <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                      무료 체험
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Legal AI SaaS
                </span>
                <br />
                <span className="text-3xl md:text-4xl text-gray-700">
                  법률 자동화의 미래
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                AI 기반 법률 자동화 플랫폼으로 계약서 분석, 컴플라이언스 체크, 규제 준수를 자동화하세요.
                <br />법률 업무 효율성을 극대화하는 차세대 솔루션입니다.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center">
                  무료로 시작하기
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
                <Link href="/demo" className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
                  데모 보기
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                왜 Legal AI SaaS를 선택해야 할까요?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                최첨단 AI 기술로 법률 업무를 혁신하고 효율성을 극대화하세요.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">빠른 분석</h3>
                <p className="text-gray-600">수백 페이지 계약서를 몇 초 만에 분석하고 핵심 위험 요소를 식별합니다.</p>
              </div>
              <div className="text-center p-6">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">컴플라이언스 보장</h3>
                <p className="text-gray-600">실시간 규제 업데이트와 자동 컴플라이언스 체크로 리스크를 최소화합니다.</p>
              </div>
              <div className="text-center p-6">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">다국가 지원</h3>
                <p className="text-gray-600">한국, 일본, 미국 등 다양한 국가의 법률 체계를 지원합니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-white mb-2">10,000+</div>
                <div className="text-blue-100">분석된 계약서</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">500+</div>
                <div className="text-blue-100">활성 사용자</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="text-blue-100">정확도</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-blue-100">고객 지원</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                고객 후기
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "계약서 검토 시간이 90% 단축되었습니다. 정말 혁신적인 서비스입니다."
                </p>
                <div className="font-semibold text-gray-900">김변호사, 법무법인 A</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "컴플라이언스 리스크를 사전에 발견할 수 있어서 매우 유용합니다."
                </p>
                <div className="font-semibold text-gray-900">이팀장, B기업 법무팀</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "사용법이 직관적이고 정확도가 높아서 업무 효율성이 크게 향상되었습니다."
                </p>
                <div className="font-semibold text-gray-900">박대표, 스타트업 C</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              무료 체험으로 Legal AI SaaS의 강력한 기능을 경험해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <form onSubmit={handleEmailSignup} className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 min-w-[300px]"
                  required
                />
                <button
                  type="submit"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  무료 체험 시작
                </button>
              </form>
            </div>
            <p className="text-blue-100 text-sm mt-4">
              신용카드 불필요 • 30일 무료 체험 • 언제든 취소 가능
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <Shield className="h-8 w-8 text-blue-400" />
                  <span className="ml-2 text-xl font-bold">Legal AI SaaS</span>
                </div>
                <p className="text-gray-400">
                  AI 기반 법률 자동화 플랫폼으로 법률 업무의 미래를 만들어갑니다.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">서비스</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/features" className="hover:text-white transition-colors">기능 소개</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors">요금제</Link></li>
                  <li><Link href="/demo" className="hover:text-white transition-colors">데모</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">지원</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/support" className="hover:text-white transition-colors">고객 지원</Link></li>
                  <li><Link href="/docs" className="hover:text-white transition-colors">문서</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">연락처</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">회사</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">회사 소개</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
                  <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Legal AI SaaS. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
