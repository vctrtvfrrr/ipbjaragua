import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.0.177'],
  outputFileTracingIncludes: {
    '**': ['./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/*'],
  },
  experimental: {
    authInterrupts: true,
  },
}

export default nextConfig
