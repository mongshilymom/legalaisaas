import { getProviders, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SignIn() {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800 p-6">
      <h1 className="text-2xl font-bold mb-6">🔐 로그인</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const email = e.currentTarget.email.value;
            const password = e.currentTarget.password.value;
            await signIn('credentials', {
              email,
              password,
              callbackUrl: '/'
            });
          }}
        >
          <label className="block mb-2 font-semibold">이메일</label>
          <input name="email" type="email" required className="w-full p-2 border border-gray-300 rounded mb-4" />
          <label className="block mb-2 font-semibold">비밀번호</label>
          <input name="password" type="password" required className="w-full p-2 border border-gray-300 rounded mb-4" />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
            로그인
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-500">관리자 계정: admin@example.com / 1234</p>
      </div>
    </div>
  );
}
