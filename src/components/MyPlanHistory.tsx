import { useEffect, useState } from 'react';

export default function MyPlanHistory() {
  const [logs, setLogs] = useState<Array<{ oldPlan: string; newPlan: string; changedAt: string }>>([]);

  useEffect(() => {
    // TODO: 실제 API 호출로 교체 가능
    setLogs([
      { oldPlan: 'basic', newPlan: 'premium', changedAt: '2025-07-09T09:30:00Z' },
      { oldPlan: 'premium', newPlan: 'enterprise', changedAt: '2025-07-12T14:00:00Z' }
    ]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-800 px-4">
      <h1 className="text-2xl font-bold mb-6">📜 플랜 변경 이력</h1>
      <div className="bg-gray-50 p-6 rounded shadow w-full max-w-xl">
        {logs.length === 0 ? (
          <p className="text-gray-500">플랜 변경 이력이 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log, i) => (
              <li key={i} className="border-b pb-2">
                <p>
                  <strong>{log.oldPlan}</strong> → <strong>{log.newPlan}</strong>
                </p>
                <p className="text-sm text-gray-500">{new Date(log.changedAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
