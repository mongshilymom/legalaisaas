import { getSession, useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';

export default function PremiumOnlyPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 text-yellow-800 px-6">
      <h1 className="text-3xl font-bold mb-4">⭐ 프리미엄 전용 페이지</h1>
      <p className="mb-2 text-lg">안녕하세요, {session?.user?.email} 님!</p>
      <p className="text-sm text-gray-600">이 페이지는 프리미엄 플랜 이상만 이용할 수 있습니다.</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false
      }
    };
  }

  // 👉 userPlan은 클라이언트 또는 DB에 따라 수정 가능
  const userPlan = session.user?.plan || null;

  if (userPlan !== 'premium' && userPlan !== 'enterprise') {
    return {
      redirect: {
        destination: '/upgrade',
        permanent: false
      }
    };
  }

  return {
    props: { session }
  };
};
