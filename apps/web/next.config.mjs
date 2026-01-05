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
  // Transpile Supabase packages
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
  // External packages that should not be bundled
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'isomorphic-dompurify'],
  // Optimize build performance
  outputFileTracingRoot: undefined, // Let Next.js auto-detect in monorepo
  // Webpack configuration
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
