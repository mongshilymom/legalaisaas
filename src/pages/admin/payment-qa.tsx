import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  CreditCard, Play, RefreshCw, CheckCircle, XCircle, Clock, 
  ArrowLeft, Shield, AlertTriangle, TrendingUp, Users, Download,
  DollarSign, Calendar, Mail, FileText, PlayCircle
} from 'lucide-react';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  testUser: string;
  paymentMethod: 'stripe' | 'toss';
  expectedPlan: string;
}

interface TestResult {
  scenarioId: string;
  name: string;
  success: boolean;
  logs: string[];
  errors: string[];
  planChangeLogId?: string;
  executionTime: number;
}

interface QAReport {
  summary: {
    totalScenarios: number;
    successfulScenarios: number;
    failedScenarios: number;
    totalExecutionTime: number;
    timestamp: string;
  };
  results: TestResult[];
  logs: string[];
  errors: string[];
}

interface PlanChangeLog {
  id: string;
  userEmail: string;
  fromPlan: string;
  toPlan: string;
  changeType: string;
  paymentMethod: string;
  amount: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  reason?: string;
}

const PaymentQADashboard: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [runningTest, setRunningTest] = useState(false);
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [recentLogs, setRecentLogs] = useState<PlanChangeLog[]>([]);
  const [lastReport, setLastReport] = useState<QAReport | null>(null);
  const [lastTestRun, setLastTestRun] = useState<string | null>(null);

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

    loadQAData();
  }, [session, status, router]);

  const loadQAData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/payment-scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios);
        setRecentLogs(data.recentTestLogs);
        setLastTestRun(data.lastTestRun);
      }
    } catch (error) {
      console.error('Failed to load QA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setRunningTest(true);
    try {
      const response = await fetch('/api/test/payment-scenarios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const report: QAReport = await response.json();
        setLastReport(report);
        setLastTestRun(report.summary.timestamp);
        
        // Reload data to get updated logs
        await loadQAData();
      } else {
        throw new Error('Test execution failed');
      }
    } catch (error) {
      console.error('Failed to run tests:', error);
      alert('테스트 실행 실패. 콘솔을 확인하세요.');
    } finally {
      setRunningTest(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'upgrade': return 'text-green-600 bg-green-100';
      case 'downgrade': return 'text-orange-600 bg-orange-100';
      case 'cancellation': return 'text-red-600 bg-red-100';
      case 'reactivation': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
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
        <title>Payment QA Dashboard | Legal AI SaaS Admin</title>
        <meta name="description" content="Payment testing and QA automation dashboard" />
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
                  <Shield className="h-6 w-6 text-purple-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">Payment QA Dashboard</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {lastTestRun && (
                  <span className="text-sm text-gray-600">
                    Last run: {new Date(lastTestRun).toLocaleString()}
                  </span>
                )}
                <button
                  onClick={loadQAData}
                  disabled={loading}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={runAllTests}
                  disabled={runningTest}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  <PlayCircle className={`h-4 w-4 mr-2 ${runningTest ? 'animate-spin' : ''}`} />
                  {runningTest ? 'Running Tests...' : 'Run All Tests'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment QA Automation</h1>
            <p className="text-gray-600">Automated testing for Stripe & Toss payment scenarios</p>
          </div>

          {/* Test Summary */}
          {lastReport && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Test Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{lastReport.summary.totalScenarios}</div>
                  <div className="text-sm text-gray-600">Total Scenarios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lastReport.summary.successfulScenarios}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{lastReport.summary.failedScenarios}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{lastReport.summary.totalExecutionTime}ms</div>
                  <div className="text-sm text-gray-600">Execution Time</div>
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-4">
                {lastReport.results.map((result) => (
                  <div key={result.scenarioId} className={`border rounded-lg p-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{result.name}</h3>
                      <div className="flex items-center space-x-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="text-sm text-gray-600">{result.executionTime}ms</span>
                      </div>
                    </div>
                    
                    {result.logs.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                          View Logs ({result.logs.length})
                        </summary>
                        <div className="mt-2 p-3 bg-gray-900 text-green-400 text-xs font-mono rounded overflow-x-auto">
                          {result.logs.map((log, index) => (
                            <div key={index}>{log}</div>
                          ))}
                        </div>
                      </details>
                    )}
                    
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-red-600 font-medium">Errors:</div>
                        <div className="p-3 bg-red-900 text-red-200 text-xs font-mono rounded overflow-x-auto">
                          {result.errors.map((error, index) => (
                            <div key={index}>{error}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Scenarios */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Scenarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <div key={scenario.id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{scenario.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-2 text-gray-400" />
                      <span>{scenario.testUser}</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-3 w-3 mr-2 text-gray-400" />
                      <span className="capitalize">{scenario.paymentMethod}</span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-3 w-3 mr-2 text-gray-400" />
                      <span>Expected: {scenario.expectedPlan}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payment Logs */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Test Logs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">User</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Change</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Method</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="border-b">
                      <td className="py-2 px-3">
                        <div className="flex items-center">
                          {getStatusIcon(log.status)}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm">{log.userEmail}</td>
                      <td className="py-2 px-3 text-sm">
                        {log.fromPlan} → {log.toPlan}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(log.changeType)}`}>
                          {log.changeType}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm capitalize">{log.paymentMethod}</td>
                      <td className="py-2 px-3 text-sm">${log.amount}</td>
                      <td className="py-2 px-3 text-sm">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {recentLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No test logs found. Run the test scenarios to generate logs.
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">QA Testing Instructions</h3>
            <div className="text-blue-800 space-y-2">
              <p><strong>1. 자동 테스트:</strong> "Run All Tests" 버튼을 클릭하여 모든 시나리오를 실행합니다.</p>
              <p><strong>2. 수동 테스트:</strong> 실제 Stripe/Toss 환경에서 테스트 카드로 결제를 진행합니다.</p>
              <p><strong>3. 웹훅 확인:</strong> 결제 완료 후 웹훅이 정상적으로 받아지는지 로그를 확인합니다.</p>
              <p><strong>4. 플랜 반영:</strong> 사용자 플랜이 올바르게 변경되었는지 확인합니다.</p>
              <p><strong>5. 이메일 전송:</strong> 결제 완료/실패 이메일이 정상 발송되는지 확인합니다.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentQADashboard;