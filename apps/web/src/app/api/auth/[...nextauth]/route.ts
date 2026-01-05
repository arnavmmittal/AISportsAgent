/**

 * NextAuth v5 API route handler
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const { handlers } = NextAuth(authOptions);

export const { GET, POST } = handlers;
