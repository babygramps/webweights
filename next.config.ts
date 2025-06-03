import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    '172.17.112.1',
    '192.168.4.101:3000',
    '192.168.4.25',
    'localhost',
    '127.0.0.1',
  ],
  // Ensure environment variables are available at runtime
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Enable experimental features for better serverless support
  experimental: {
    serverComponentsExternalPackages: ['postgres'],
  },
};

export default nextConfig;
