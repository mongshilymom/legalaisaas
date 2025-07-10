import { useEffect, useState } from 'react';

export default function LogDashboard() {
  const [logs, setLogs] = useState<Array<{ email: string; oldPlan: string; newPlan: string; changedAt: string }>>([]);

  useEffect(() => {
    // TODO: 실제 API 연동 필요
    setLogs([
      { email: 'user1@example.com', oldPlan: 'basic', newPlan: 'premium', changedAt: '2025-07-09T09:30:00Z' },
      { email: 'user2@example.com', oldPlan: 'premium', newPlan: 'enterprise', changedAt: '2025-07-10T11:10:00Z' },
      { email: 'user3@example.com', oldPlan: 'basic', newPlan: 'premium', changedAt: '2025-07-12T14:00:00Z' }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📊 플랜 변경 로그 대시보드</h1>
      <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
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
        {logs.length === 0 && <p className="text-gray-500 mt-4">로그가 없습니다.</p>}
      </div>
    </div>
  );
}
