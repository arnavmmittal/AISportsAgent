/**
 * NextAuth v5 API route handler
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export const GET = handlers.GET;
export const POST = handlers.POST;

// Export auth for use in server components and API routes
export { auth };
