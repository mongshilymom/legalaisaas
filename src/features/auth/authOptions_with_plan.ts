import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
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
        if (
          credentials?.email === 'admin@example.com' &&
          credentials?.password === '1234'
        ) {
          return {
            id: 'user_001',
            name: '관리자',
            email: 'admin@example.com',
            plan: 'premium'
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.plan = token.plan;
      return session;
    }
  }
};
