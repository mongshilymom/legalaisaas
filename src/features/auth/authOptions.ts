import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// import GithubProvider from 'next-auth/providers/github'; // 예시: GitHub OAuth
// import { PrismaAdapter } from '@next-auth/prisma-adapter';
// import { prisma } from './prisma'; // DB 연결 시

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 🔐 여기에 사용자 인증 로직 추가
        if (
          credentials?.email === 'admin@example.com' &&
          credentials?.password === '1234'
        ) {
          return { id: 'user_001', name: '관리자', email: 'admin@example.com' };
        }
        return null;
      }
    })
    // GithubProvider({ clientId: '...', clientSecret: '...' })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      return session;
    }
  }
};
