import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Search, TrendingUp, Users, MousePointer, Globe, 
  Download, RefreshCw, Shield, ArrowLeft, AlertCircle,
  ExternalLink, Calendar, Filter
} from 'lucide-react';
import { 
  LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { getSeoStats } from '../../../lib/logUserAction';

interface SeoReportsProps {
  initialData: {
    totalVisits: number;
    uniquePages: string[];
    topTags: { tag: string; count: number }[];
    conversionRate: number;
    recentVisits: Array<{
      timestamp: string;
      page: string;
      tag: string;
      referer: string;
      ip: string;
    }>;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SeoReports: NextPage<SeoReportsProps> = ({ initialData }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [seoData, setSeoData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('7d');

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

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/seo-stats?period=${dateFilter}`);
      if (response.ok) {
        const data = await response.json();
        setSeoData(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const csvHeader = 'Timestamp,Page,SEO Tag,Conversion Rate,Referer,IP\n';
      const csvContent = csvHeader + seoData.recentVisits.map(visit => 
        `${visit.timestamp},${visit.page},${visit.tag},${seoData.conversionRate},${visit.referer},${visit.ip}`
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `seo-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download CSV:', error);
    }
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

  return (
    <>
      <Head>
        <title>SEO Reports | Legal AI SaaS Admin</title>
        <meta name="description" content="SEO traffic and conversion analytics dashboard" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/admin/growth" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to Growth
                </Link>
                <div className="flex items-center">
                  <Search className="h-6 w-6 text-green-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">SEO Reports</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="1d">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <span className="text-sm text-gray-600">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </span>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={downloadCSV}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO Traffic Analytics</h1>
            <p className="text-gray-600">Track SEO visitor flows and conversion performance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">SEO Visits</p>
                  <p className="text-2xl font-bold text-gray-900">{seoData.totalVisits}</p>
                  <p className="text-sm text-green-600">Organic traffic</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MousePointer className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{seoData.conversionRate}%</p>
                  <p className="text-sm text-gray-500">CTA clicks</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unique Pages</p>
                  <p className="text-2xl font-bold text-gray-900">{seoData.uniquePages.length}</p>
                  <p className="text-sm text-gray-500">Landing pages</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Top SEO Tag</p>
                  <p className="text-2xl font-bold text-gray-900">{seoData.topTags[0]?.tag || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{seoData.topTags[0]?.count || 0} visits</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top SEO Tags</h3>
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={seoData.topTags.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tag" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Page Performance</h3>
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-4">
                {seoData.uniquePages.slice(0, 8).map((page, index) => {
                  const pageVisits = seoData.topTags.reduce((acc, tag) => 
                    tag.tag.includes(page.replace('/', '')) ? acc + tag.count : acc, 0);
                  return (
                    <div key={page} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <ExternalLink className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-700">{page}</span>
                      </div>
                      <span className="text-sm text-gray-600">{pageVisits} visits</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent SEO Visits</h3>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Timestamp</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Page</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">SEO Tag</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Referer</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {seoData.recentVisits.slice(0, 20).map((visit, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4 text-sm">{new Date(visit.timestamp).toLocaleString()}</td>
                      <td className="py-2 px-4 text-sm font-medium">{visit.page}</td>
                      <td className="py-2 px-4 text-sm">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {visit.tag}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-sm text-gray-500 truncate max-w-48">{visit.referer}</td>
                      <td className="py-2 px-4 text-sm text-gray-500">{visit.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">SEO Tracking Active</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Monitoring organic traffic from search engines and utm_source=seo parameters. 
                  Conversion tracking includes CTA clicks and upgrade attempts.
                </p>
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
    const seoStats = await getSeoStats();
    
    const mockRecentVisits = [
      {
        timestamp: new Date().toISOString(),
        page: '/pricing',
        tag: 'pricing.ko',
        referer: 'https://google.com/search',
        ip: '192.168.1.1'
      },
      {
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        page: '/features',
        tag: 'features.en',
        referer: 'https://naver.com/search',
        ip: '192.168.1.2'
      }
    ];
    
    return {
      props: {
        initialData: {
          ...seoStats,
          recentVisits: mockRecentVisits
        }
      }
    };
  } catch (error) {
    console.error('Failed to fetch SEO data:', error);
    
    return {
      props: {
        initialData: {
          totalVisits: 0,
          uniquePages: [],
          topTags: [],
          conversionRate: 0,
          recentVisits: []
        }
      }
    };
  }
};

export default SeoReports;