/**
 * NextAuth type extensions
 */

import { DefaultSession } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      schoolId: string;
      athlete?: {
        userId: string;
        sport: string;
        year: string;
        teamPosition?: string;
      } | null;
      coach?: {
        userId: string;
        sport: string;
        title?: string;
      } | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    schoolId: string;
    athlete?: {
      userId: string;
      sport: string;
      year: string;
      teamPosition?: string;
    } | null;
    coach?: {
      userId: string;
      sport: string;
      title?: string;
    } | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    schoolId: string;
    athlete?: {
      userId: string;
      sport: string;
      year: string;
      teamPosition?: string;
    } | null;
    coach?: {
      userId: string;
      sport: string;
      title?: string;
    } | null;
  }
}
