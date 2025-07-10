import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function MyPage() {
  const { data: session, status } = useSession();
  const [resetMessage, setResetMessage] = useState('');

  if (status === 'loading') {
    return <div className="p-6 text-center text-gray-500">로딩 중...</div>;
  }

  if (!session) {
    return (
      <div className="p-6 text-center text-red-500">
        로그인 후 이용 가능한 페이지입니다.
      </div>
    );
  }

  const user = session.user;

  const handleResetPlan = async () => {
    try {
      await fetch('/api/save-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: 'basic' })
      });
      localStorage.setItem('userPlan', 'basic');
      setResetMessage('✅ 요금제가 basic(무료)으로 초기화되었습니다.');
    } catch (error) {
      setResetMessage('❌ 초기화 실패');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 px-6">
      <h1 className="text-3xl font-bold mb-4">🙋 마이페이지</h1>
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md text-left">
        <p className="mb-2"><strong>이메일:</strong> {user.email}</p>
        <p className="mb-2"><strong>요금제:</strong> {user.plan ? user.plan : 'basic (무료)'}</p>
        <p className="text-sm text-gray-500 mb-4">프리미엄 기능을 이용하려면 요금제를 업그레이드하세요.</p>
        <button
          onClick={handleResetPlan}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded transition"
        >
          요금제 초기화 (basic으로)
        </button>
        {resetMessage && <p className="mt-4 text-sm text-blue-600">{resetMessage}</p>}
      </div>
    </div>
  );
}
