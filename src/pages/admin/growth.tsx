import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  TrendingUp, Users, DollarSign, BarChart, Globe, 
  Download, RefreshCw, Shield, ArrowLeft, AlertCircle,
  UserPlus, CreditCard, Brain, UserX, MapPin, Languages
} from 'lucide-react';
import { 
  LineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { GrowthData, getCachedGrowthStats, generateCSVReport } from '../../lib/logs/growthTracker';

interface GrowthDashboardProps {
  initialData: GrowthData;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const GrowthDashboard: NextPage<GrowthDashboardProps> = ({ initialData }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [growthData, setGrowthData] = useState<GrowthData>(initialData);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date(initialData.lastUpdated));

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // Check if user is admin (you can implement your own admin check logic)
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
      const response = await fetch('/api/admin/growth-stats');
      if (response.ok) {
        const data = await response.json();
        setGrowthData(data);
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
      const csvContent = await generateCSVReport(growthData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `growth-report-${new Date().toISOString().split('T')[0]}.csv`);
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
        <title>Growth Dashboard | Legal AI SaaS Admin</title>
        <meta name="description" content="Admin growth analytics dashboard" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back to App
                </Link>
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-red-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">Admin Dashboard</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
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
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Growth Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time insights into user growth, engagement, and revenue.</p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{growthData.userGrowth.totalUsers}</p>
                  <p className="text-sm text-green-600">+{growthData.userGrowth.recentUsers} this week</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{growthData.upselling.conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{growthData.upselling.conversions}/{growthData.upselling.totalRecommendations} conversions</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                  <p className="text-2xl font-bold text-gray-900">${growthData.upselling.revenueImpact}</p>
                  <p className="text-sm text-green-600">From upselling</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{growthData.churn.churnRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{growthData.churn.sevenDayChurn} inactive users</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* User Signups Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Daily User Signups</h3>
                <UserPlus className="h-5 w-5 text-blue-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={growthData.userGrowth.dailySignups}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Plan Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Plan Distribution</h3>
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={growthData.planChanges.planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ plan, percentage }) => `${plan} (${percentage.toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {growthData.planChanges.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Model Usage */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Model Usage</h3>
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={growthData.modelUsage.modelBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#8B5CF6" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Geographic Distribution</h3>
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={growthData.geographic.countryDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#10B981" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Signup Trends</h3>
              <BarChart className="h-5 w-5 text-blue-600" />
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={growthData.userGrowth.weeklySignups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Stats Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Changes Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Change Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Plan Changes</span>
                  <span className="font-semibold">{growthData.planChanges.totalPlanChanges}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upgrades</span>
                  <span className="font-semibold text-green-600">{growthData.planChanges.upgrades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Downgrades</span>
                  <span className="font-semibold text-red-600">{growthData.planChanges.downgrades}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Upgrade Rate</span>
                  <span className="font-semibold">{growthData.planChanges.upgradeRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Language Preferences */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Preferences</h3>
              <div className="space-y-3">
                {growthData.geographic.languagePreferences.map((lang, index) => (
                  <div key={lang.language} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Languages className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">{lang.language.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">{lang.users} users</span>
                      <span className="text-sm font-semibold">{lang.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Model Costs */}
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Model Cost Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Model</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">API Calls</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Total Cost</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Avg Cost/Call</th>
                  </tr>
                </thead>
                <tbody>
                  {growthData.modelUsage.modelBreakdown.map((model, index) => (
                    <tr key={model.model} className="border-b">
                      <td className="py-2 px-4 font-medium">{model.model}</td>
                      <td className="py-2 px-4">{model.calls.toLocaleString()}</td>
                      <td className="py-2 px-4">${model.cost.toFixed(2)}</td>
                      <td className="py-2 px-4">${(model.cost / model.calls).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alert Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Data Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This dashboard shows mock data for demonstration purposes. 
                  In production, connect to your actual database for real-time analytics.
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
    // In production, you would check authentication here
    // For now, we'll just return the initial data
    const initialData = await getCachedGrowthStats();
    
    return {
      props: {
        initialData: JSON.parse(JSON.stringify(initialData)) // Ensure serializable
      }
    };
  } catch (error) {
    console.error('Failed to fetch growth data:', error);
    
    // Return empty/default data if fetch fails
    return {
      props: {
        initialData: {
          userGrowth: { totalUsers: 0, recentUsers: 0, dailySignups: [], weeklySignups: [] },
          planChanges: { totalPlanChanges: 0, upgradeRate: 0, downgrades: 0, upgrades: 0, planDistribution: [] },
          upselling: { totalRecommendations: 0, conversions: 0, conversionRate: 0, revenueImpact: 0 },
          modelUsage: { totalApiCalls: 0, modelBreakdown: [], dailyUsage: [] },
          churn: { sevenDayChurn: 0, thirtyDayChurn: 0, churnRate: 0, retentionRate: 0 },
          geographic: { countryDistribution: [], languagePreferences: [] },
          lastUpdated: new Date().toISOString()
        }
      }
    };
  }
};

export default GrowthDashboard;