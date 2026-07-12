import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.0.177'],
  outputFileTracingIncludes: {
    '**': [
      './node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/*',
      './assets/fonts/*',
    ],
  },
  experimental: {
    authInterrupts: true,
    proxyClientMaxBodySize: '16mb',
    serverActions: {
      bodySizeLimit: '16mb',
    },
  },
}

export default nextConfig
