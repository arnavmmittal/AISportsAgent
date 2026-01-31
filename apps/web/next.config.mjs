import { withSentryConfig } from '@sentry/nextjs';

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

// Sentry configuration options
const sentryOptions = {
  // Suppress source map upload warnings
  silent: true,
  // Upload source maps for better stack traces
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
  // Hide source maps from generated client bundles
  hideSourceMaps: true,
  // Transpile SDK to work with older browsers
  transpileClientSDK: true,
  // Route browser requests to Sentry through a Next.js rewrite
  tunnelRoute: '/monitoring',
  // Automatically instrument server-side route handlers and data fetchers
  automaticVercelMonitors: true,
};

// Only wrap with Sentry if DSN is configured
const config = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryOptions)
  : nextConfig;

export default config;
