import { useEffect, useState } from 'react';

export default function LogDashboard() {
  const [logs, setLogs] = useState<Array<{ email: string; oldPlan: string; newPlan: string; changedAt: string }>>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/get-plan-change-logs');
        if (!res.ok) throw new Error('불러오기 실패');
        const data = await res.json();
        setLogs(data.logs);
      } catch (err) {
        setError('❌ 로그 불러오기 오류');
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📊 플랜 변경 로그 대시보드</h1>
      <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-500">로그가 없습니다.</p>
        ) : (
          <table className="w-full table-auto text-sm text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 border-b">
                <th className="p-2">이메일</th>
                <th className="p-2">이전 플랜</th>
                <th className="p-2">변경된 플랜</th>
                <th className="p-2">변경일</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2">{log.email}</td>
                  <td className="p-2">{log.oldPlan}</td>
                  <td className="p-2">{log.newPlan}</td>
                  <td className="p-2 text-gray-500">{new Date(log.changedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
