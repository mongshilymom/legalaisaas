import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function MyPageAdmin() {
  const { data: session, status } = useSession();
  const [targetEmail, setTargetEmail] = useState('');
  const [message, setMessage] = useState('');

  if (status === 'loading') {
    return <div className="p-6 text-center text-gray-500">로딩 중...</div>;
  }

  if (!session || session.user.email !== 'admin@example.com') {
    return (
      <div className="p-6 text-center text-red-500">
        관리자만 접근 가능한 페이지입니다.
      </div>
    );
  }

  const handleResetTargetPlan = async () => {
    try {
      const res = await fetch('/api/reset-plan-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const result = await res.json();
      if (res.ok) {
        setMessage(`✅ ${targetEmail} 요금제가 초기화되었습니다.`);
      } else {
        setMessage(`❌ 실패: ${result.error}`);
      }
    } catch (err) {
      setMessage('❌ 네트워크 오류');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 px-6">
      <h1 className="text-2xl font-bold mb-4">🔐 관리자 요금제 초기화</h1>
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <label className="block mb-2 font-semibold">사용자 이메일</label>
        <input
          type="email"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="user@example.com"
        />
        <button
          onClick={handleResetTargetPlan}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded w-full"
        >
          요금제 초기화 (basic)
        </button>
        {message && <p className="mt-4 text-sm text-blue-600">{message}</p>}
      </div>
    </div>
  );
}
