import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Mail, Send, CheckCircle, XCircle, ArrowLeft, Shield, 
  AlertTriangle, RefreshCw, Settings, Globe, Users, Clock
} from 'lucide-react';

const EmailTestDashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailType, setEmailType] = useState<'test' | 'growth'>('test');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [recipients, setRecipients] = useState('');
  const [testResults, setTestResults] = useState<Array<{
    id: string;
    type: string;
    success: boolean;
    timestamp: string;
    messageId?: string;
    error?: string;
    recipients: number;
  }>>([]);

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

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: emailType,
          language: emailType === 'growth' ? language : undefined,
          recipients: recipients ? recipients.split(',').map(email => email.trim()) : undefined,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const newResult = {
          id: Date.now().toString(),
          type: emailType,
          success: true,
          timestamp: new Date().toISOString(),
          messageId: result.data.messageId,
          recipients: result.data.recipients,
        };
        
        setTestResults(prev => [newResult, ...prev].slice(0, 10));
        alert('✅ 이메일이 성공적으로 전송되었습니다!');
      } else {
        throw new Error(result.message || result.error);
      }
    } catch (error) {
      console.error('Email test failed:', error);
      
      const errorResult = {
        id: Date.now().toString(),
        type: emailType,
        success: false,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        recipients: 0,
      };
      
      setTestResults(prev => [errorResult, ...prev].slice(0, 10));
      alert('❌ 이메일 전송에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const triggerGrowthEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cron/daily/send-growth-email?test=true&key=' + process.env.CRON_SECRET, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Growth 이메일이 성공적으로 전송되었습니다!');
        console.log('Growth email result:', result.data);
      } else {
        throw new Error(result.message || result.error);
      }
    } catch (error) {
      console.error('Growth email test failed:', error);
      alert('❌ Growth 이메일 전송에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
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
        <title>Email Test Dashboard | Legal AI SaaS Admin</title>
        <meta name="description" content="Email system testing and verification" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/admin/growth" className="flex items-center text-blue-600 hover:text-blue-700 transition-colors mr-6">
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Growth Dashboard
                </Link>
                <div className="flex items-center">
                  <Shield className="h-6 w-6 text-green-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">Email Test Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email System Testing</h1>
            <p className="text-gray-600">Test and verify email delivery for Growth reports and system notifications</p>
          </div>

          {/* Email Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Email Configuration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Type
                </label>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value as 'test' | 'growth')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="test">Simple Test Email</option>
                  <option value="growth">Growth Report Email</option>
                </select>
              </div>

              {emailType === 'growth' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as 'ko' | 'en')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ko">🇰🇷 한국어</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipients (optional)
                </label>
                <input
                  type="text"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@example.com, email2@example.com (leave empty for admin emails)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to use default admin emails from environment variables
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={sendTestEmail}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
              >
                <Send className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>

              {emailType === 'growth' && (
                <button
                  onClick={triggerGrowthEmail}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  <Clock className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
                  {loading ? 'Sending...' : 'Trigger Growth CRON'}
                </button>
              )}
            </div>
          </div>

          {/* Environment Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚙️ SMTP Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">SMTP Host:</span>
                <span className="ml-2 text-gray-600">{process.env.SMTP_HOST || 'Not configured'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">SMTP Port:</span>
                <span className="ml-2 text-gray-600">{process.env.SMTP_PORT || 'Not configured'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">SMTP User:</span>
                <span className="ml-2 text-gray-600">{process.env.SMTP_USER || 'Not configured'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Environment:</span>
                <span className="ml-2 text-gray-600">{process.env.NODE_ENV || 'development'}</span>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Test Results</h2>
            
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No email tests have been run yet.</p>
                <p>Send a test email to see results here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mr-2" />
                        )}
                        <span className="font-medium capitalize">{result.type} Email</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-700">
                      <p>Recipients: {result.recipients}</p>
                      {result.success && result.messageId && (
                        <p>Message ID: {result.messageId}</p>
                      )}
                      {result.error && (
                        <p className="text-red-600 mt-1">Error: {result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Email Testing Guide</h3>
            <div className="text-blue-800 space-y-2">
              <p><strong>1. Simple Test:</strong> Sends a basic test email to verify SMTP configuration.</p>
              <p><strong>2. Growth Report:</strong> Sends a full Growth report with real statistics and metrics.</p>
              <p><strong>3. CRON Trigger:</strong> Manually triggers the scheduled growth email (same as daily 9AM automation).</p>
              <p><strong>4. Language Support:</strong> Test both Korean and English templates.</p>
              <p><strong>5. Production Schedule:</strong> Growth emails are automatically sent daily at 9:00 AM UTC.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailTestDashboard;