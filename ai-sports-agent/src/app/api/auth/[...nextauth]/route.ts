/**
 * NextAuth v5 configuration
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import type { Role } from '@prisma/client';

const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        // Demo account for testing (no database required)
        if (credentials.email === 'demo@athlete.com' && credentials.password === 'demo123') {
          return {
            id: 'demo-user-123',
            email: 'demo@athlete.com',
            name: 'Demo Athlete',
            role: 'ATHLETE' as Role,
            schoolId: 'demo-school-123',
            athlete: {
              userId: 'demo-user-123',
              sport: 'Basketball',
              year: 'Junior',
              teamPosition: 'Point Guard',
            },
            coach: null,
          };
        }

        // Try database authentication for real users
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              school: true,
              athlete: true,
              coach: true,
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
            athlete: user.athlete,
            coach: user.coach,
          };
        } catch (error) {
          // If database is not available, only demo account works
          throw new Error('Invalid credentials or database unavailable');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.athlete = user.athlete;
        token.coach = user.coach;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
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

const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export const GET = handlers.GET;
export const POST = handlers.POST;
