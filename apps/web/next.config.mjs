/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  // External packages that should not be bundled (moved from experimental)
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Optimize build performance
  outputFileTracingRoot: undefined, // Let Next.js auto-detect in monorepo
};

export default nextConfig;
