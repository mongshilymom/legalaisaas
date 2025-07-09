import { useEffect, useState } from 'react';

export default function LogDashboard() {
  const [logs, setLogs] = useState([]);
  const [emailFilter, setEmailFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (emailFilter) params.append('email', emailFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch('/api/get-plan-change-logs?' + params.toString());
      if (!res.ok) throw new Error('불러오기 실패');
      const data = await res.json();
      setLogs(data.logs);
    } catch (err) {
      setError('❌ 로그 불러오기 오류');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['이메일', '이전 플랜', '변경된 플랜', '변경일'],
      ...logs.map((log) => [
        log.email,
        log.oldPlan,
        log.newPlan,
        new Date(log.changedAt).toLocaleString()
      ])
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan_change_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📊 플랜 변경 로그 대시보드</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="이메일 검색"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded w-52"
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        />
        <span>~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        />
        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔍 필터 적용
        </button>
        <button
          onClick={exportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📤 CSV 다운로드
        </button>
      </div>

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
                  <td className="p-2 text-gray-500">
                    {new Date(log.changedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
