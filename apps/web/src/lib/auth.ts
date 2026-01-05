/**
 * NextAuth configuration for server-side usage
 */

import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Role, User as PrismaUser, Session } from '@prisma/client';

// DEPRECATED: NextAuth types - now using Supabase Auth (see auth-helpers.ts)
// Keeping file for reference during migration, will be removed in Phase 3
/*
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    schoolId: string;
    athlete?: any;
    coach?: any;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      schoolId: string;
      athlete?: any;
      coach?: any;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    schoolId: string;
    athlete?: any;
    coach?: any;
  }
}
*/

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        // Database authentication for real users
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              School: true,
              Athlete: true,
              Coach: true,
            },
          });

          if (!user || !user.password) {
            throw new Error('Invalid credentials');
          }

          const isValid = await compare(credentials.password as string, user.password);

          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            email: user.email ?? '',
            name: user.name ?? '',
            role: user.role,
            schoolId: user.schoolId,
            athlete: user.Athlete,
            coach: user.Coach,
          };
        } catch (error) {
          // If database is not available, only demo account works
          throw new Error('Invalid credentials or database unavailable');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.athlete = user.athlete;
        token.coach = user.coach;
      }
      return token;
    },
    async session({ session, token }): Promise<any> {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role as Role;
        session.user.schoolId = token.schoolId as string;
        session.user.athlete = token.athlete ?? null;
        session.user.coach = token.coach ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
