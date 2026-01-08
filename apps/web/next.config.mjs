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
  // TypeScript configuration for builds
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // TODO: Fix all type errors and remove this
    ignoreBuildErrors: true,
  },
  // ESLint configuration for builds
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
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
