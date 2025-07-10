import { useSession } from 'next-auth/react';

export default function MyPage() {
  const { data: session, status } = useSession();

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 px-6">
      <h1 className="text-3xl font-bold mb-4">🙋 마이페이지</h1>
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md text-left">
        <p className="mb-2"><strong>이메일:</strong> {user.email}</p>
        <p className="mb-2"><strong>요금제:</strong> {user.plan ? user.plan : 'basic (무료)'}</p>
        <p className="text-sm text-gray-500 mt-4">프리미엄 기능을 이용하려면 요금제를 업그레이드하세요.</p>
      </div>
    </div>
  );
}
