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
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  // Sentry configuration
  sentry: {
    // Hide source maps from generated client bundles
    hideSourceMaps: true,
    // Only upload source maps in production builds
    disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
    disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
  },
};

export default nextConfig;
