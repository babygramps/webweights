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
};

export default nextConfig;
