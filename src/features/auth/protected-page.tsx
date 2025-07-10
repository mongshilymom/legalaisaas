import { getSession, useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';

export default function ProtectedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-blue-800 px-6">
      <h1 className="text-3xl font-bold mb-4">🔐 보호된 페이지</h1>
      <p className="mb-2 text-lg">환영합니다, {session?.user?.email} 님!</p>
      <p className="text-sm text-gray-600">이 페이지는 로그인된 사용자만 접근할 수 있습니다.</p>
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
  return {
    props: { session }
  };
};
