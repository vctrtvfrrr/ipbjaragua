import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.0.177'],
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
