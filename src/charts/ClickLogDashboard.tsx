'use client';
import { useEffect, useState } from 'react';

export default function ClickLogDashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/admin/get-click-logs');
        if (!res.ok) throw new Error('로그 불러오기 실패');
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (e: any) {
        setError(e.message);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">💡 Claude 요금 추천 클릭 로그</h2>

      {error && (
        <div className="text-red-500 mb-4">⚠️ {error}</div>
      )}

      <div className="bg-gray-100 p-4 rounded-lg text-sm max-h-[400px] overflow-y-auto font-mono whitespace-pre-wrap">
        {logs.length > 0 ? logs.join('\n') : '⏳ 로그 불러오는 중...'}
      </div>
    </div>
  );
}
