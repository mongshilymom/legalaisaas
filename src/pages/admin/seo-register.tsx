import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Globe, Plus, Search, Save, Download, Copy, RefreshCw, 
  CheckCircle, XCircle, ArrowLeft, Shield, AlertTriangle,
  ExternalLink, FileText, Code, Eye, Edit, Trash2, Filter
} from 'lucide-react';

// SEO 등록 요청 인터페이스
interface SeoRegistrationRequest {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  keywords?: string[];
  language: 'ko' | 'en' | 'ja' | 'zh';
  industry: string;
  category: string;
  generateBlog: boolean;
  autoSave: boolean;
}

// SEO 등록 결과 인터페이스
interface SeoRegistrationResult {
  id: string;
  url: string;
  category: string;
  language: string;
  seoData: {
    title: string;
    description: string;
    keywords: string[];
    ogTitle: string;
    ogDescription: string;
    structuredData: any;
    score: number;
  };
  blogContent?: string;
  createdAt: string;
  status: 'success' | 'error';
  error?: string;
}

const SeoRegister: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [language, setLanguage] = useState<'ko' | 'en' | 'ja' | 'zh'>('ko');
  const [industry, setIndustry] = useState('legal');
  const [category, setCategory] = useState('page');
  const [generateBlog, setGenerateBlog] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [result, setResult] = useState<SeoRegistrationResult | null>(null);
  const [savedResults, setSavedResults] = useState<SeoRegistrationResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');

  // Check admin access
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    const isAdmin = session.user.email?.includes('admin') || 
                   session.user.email === 'developer@legalaisaas.com';
    
    if (!isAdmin) {
      router.push('/unauthorized');
      return;
    }
  }, [session, status, router]);

  // Load saved results
  useEffect(() => {
    loadSavedResults();
  }, []);

  const loadSavedResults = async () => {
    try {
      const response = await fetch('/api/seo/registry/list');
      if (response.ok) {
        const data = await response.json();
        setSavedResults(data.results || []);
      }
    } catch (error) {
      console.error('Failed to load saved results:', error);
    }
  };

  // Auto-crawl URL content
  const crawlUrl = async () => {
    if (!url) {
      alert('URL을 입력해주세요.');
      return;
    }

    setCrawling(true);
    try {
      const response = await fetch('/api/seo/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTitle(data.data.title || '');
        setDescription(data.data.description || '');
        setContent(data.data.content || '');
        setKeywords(data.data.keywords?.join(', ') || '');
        
        alert('✅ 페이지 크롤링이 완료되었습니다!');
      } else {
        throw new Error(data.message || data.error);
      }
    } catch (error) {
      console.error('Crawling failed:', error);
      alert('❌ 크롤링에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setCrawling(false);
    }
  };

  // Generate and register SEO
  const registerSeo = async () => {
    if (!url) {
      alert('URL은 필수입니다.');
      return;
    }

    setLoading(true);
    try {
      const requestData: SeoRegistrationRequest = {
        url,
        title: title || undefined,
        description: description || undefined,
        content: content || undefined,
        keywords: keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : undefined,
        language,
        industry,
        category,
        generateBlog,
        autoSave,
      };

      const response = await fetch('/api/seo/registry/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        if (autoSave) {
          await loadSavedResults();
        }
        alert('✅ SEO 메타태그가 성공적으로 생성되었습니다!');
      } else {
        throw new Error(data.message || data.error);
      }
    } catch (error) {
      console.error('SEO registration failed:', error);
      alert('❌ SEO 등록에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Export results
  const exportResults = (format: 'json' | 'csv') => {
    const filteredResults = savedResults.filter(r => {
      const categoryMatch = filterCategory === 'all' || r.category === filterCategory;
      const languageMatch = filterLanguage === 'all' || r.language === filterLanguage;
      return categoryMatch && languageMatch;
    });

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(filteredResults, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-registry-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['URL', 'Category', 'Language', 'Title', 'Description', 'Score', 'Created At'];
      const rows = filteredResults.map(r => [
        r.url,
        r.category,
        r.language,
        r.seoData.title,
        r.seoData.description,
        r.seoData.score,
        r.createdAt
      ]);
      
      const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-registry-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Clear form
  const clearForm = () => {
    setUrl('');
    setTitle('');
    setDescription('');
    setContent('');
    setKeywords('');
    setResult(null);
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

  const filteredResults = savedResults.filter(r => {
    const categoryMatch = filterCategory === 'all' || r.category === filterCategory;
    const languageMatch = filterLanguage === 'all' || r.language === filterLanguage;
    return categoryMatch && languageMatch;
  });

  return (
    <>
      <Head>
        <title>SEO Registry | Legal AI SaaS Admin</title>
        <meta name="description" content="Automated SEO meta tag generation and content management system" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/dev/seo-tester" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  SEO Tester
                </Link>
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-green-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">SEO Registry</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => exportResults('json')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export JSON
                </button>
                <button
                  onClick={() => exportResults('csv')}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO 자동화 등록 시스템</h1>
            <p className="text-gray-600">URL 크롤링부터 AI 메타태그 생성, 블로그 콘텐츠 자동화까지 한 번에 처리</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Registration Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🌐 URL 등록 및 생성</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대상 URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/page"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={crawlUrl}
                      disabled={crawling || !url}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                    >
                      {crawling ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    크롤링 버튼으로 페이지 내용을 자동 추출할 수 있습니다
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="page">일반 페이지</option>
                      <option value="blog">블로그/아티클</option>
                      <option value="product">제품/서비스</option>
                      <option value="landing">랜딩 페이지</option>
                      <option value="marketing">마케팅 페이지</option>
                      <option value="community">커뮤니티</option>
                      <option value="external">외부 페이지</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      언어
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'ko' | 'en' | 'ja' | 'zh')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ko">🇰🇷 한국어</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="ja">🇯🇵 日本語</option>
                      <option value="zh">🇨🇳 中文</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    페이지 제목 (선택)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="기존 제목 또는 수동 입력"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명 (선택)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="기존 설명 또는 수동 입력"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    콘텐츠 (선택)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="페이지 본문 내용 (크롤링으로 자동 추출 가능)"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    키워드 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="키워드1, 키워드2, 키워드3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    산업 분야
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="legal">⚖️ 법률</option>
                    <option value="tech">💻 기술</option>
                    <option value="ecommerce">🛒 전자상거래</option>
                    <option value="finance">💰 금융</option>
                    <option value="healthcare">🏥 의료</option>
                    <option value="education">📚 교육</option>
                    <option value="other">🏢 기타</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="generateBlog"
                      checked={generateBlog}
                      onChange={(e) => setGenerateBlog(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="generateBlog" className="ml-2 text-sm text-gray-700">
                      📝 자동 블로그 콘텐츠 생성 (.md 파일)
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoSave"
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoSave" className="ml-2 text-sm text-gray-700">
                      💾 자동 저장 (JSON 형태로 저장)
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={registerSeo}
                    disabled={loading || !url}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'AI 생성 중...' : 'SEO 등록 및 생성'}
                  </button>

                  <button
                    onClick={clearForm}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    초기화
                  </button>
                </div>
              </div>
            </div>

            {/* Results Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">🎯 생성 결과</h2>
                {result && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-blue-600 hover:text-blue-700 flex items-center text-sm"
                  >
                    {showPreview ? <Eye className="h-4 w-4 mr-1" /> : <Code className="h-4 w-4 mr-1" />}
                    {showPreview ? 'Hide JSON' : 'Show JSON'}
                  </button>
                )}
              </div>

              {!result ? (
                <div className="text-center py-12 text-gray-500">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>URL을 등록하고 SEO를 생성하면 결과가 여기에 표시됩니다.</p>
                </div>
              ) : result.status === 'success' ? (
                <div className="space-y-4">
                  {/* SEO Score */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">SEO Score</span>
                      <span className="text-2xl font-bold text-green-600">{result.seoData.score}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${result.seoData.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Meta Tags */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">제목</label>
                      <div className="bg-gray-50 p-3 rounded border text-sm mt-1">
                        {result.seoData.title}
                        <span className="text-gray-500 ml-2">({result.seoData.title.length} chars)</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">설명</label>
                      <div className="bg-gray-50 p-3 rounded border text-sm mt-1">
                        {result.seoData.description}
                        <span className="text-gray-500 ml-2">({result.seoData.description.length} chars)</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">키워드</label>
                      <div className="bg-gray-50 p-3 rounded border text-sm mt-1">
                        {result.seoData.keywords.join(', ')}
                      </div>
                    </div>

                    {result.blogContent && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">생성된 블로그 콘텐츠</label>
                        <div className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto mt-1">
                          <pre>{result.blogContent.substring(0, 500)}...</pre>
                        </div>
                      </div>
                    )}
                  </div>

                  {showPreview && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium text-gray-900 mb-2">Raw JSON Data</h3>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">생성 실패</h3>
                  <p className="text-gray-600">{result.error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Saved Results */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">📚 저장된 SEO 결과</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">모든 카테고리</option>
                    <option value="page">일반 페이지</option>
                    <option value="blog">블로그</option>
                    <option value="product">제품</option>
                    <option value="landing">랜딩</option>
                    <option value="marketing">마케팅</option>
                  </select>
                  <select
                    value={filterLanguage}
                    onChange={(e) => setFilterLanguage(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">모든 언어</option>
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                <span className="text-sm text-gray-500">
                  총 {filteredResults.length}개 결과
                </span>
              </div>
            </div>

            {filteredResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>저장된 SEO 결과가 없습니다.</p>
                <p>위에서 URL을 등록하여 첫 번째 SEO를 생성해보세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResults.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-blue-600">{item.category}</span>
                          <span className="text-sm text-gray-500">{item.language}</span>
                          <span className="text-sm font-semibold text-green-600">
                            {item.seoData.score}/100
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">
                          {item.seoData.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.seoData.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{item.url}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => {
                            setUrl(item.url);
                            setCategory(item.category);
                            setLanguage(item.language as any);
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SeoRegister;