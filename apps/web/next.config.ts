import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
