/**
 * NextAuth v5 API route handler
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const { handlers, auth: nextAuth } = NextAuth(authOptions);

export const { GET, POST } = handlers;
export const auth = nextAuth;
