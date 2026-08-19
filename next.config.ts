import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['192.168.0.177'],
  outputFileTracingIncludes: {
    '**': [
      './node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/lib/*',
      './assets/fonts/*',
      // Tracing keeps only the modules it can see imported, which strips the browser
      // registry Playwright reads at launch; the PDF renderer needs the whole package.
      './node_modules/.pnpm/playwright-core@*/node_modules/playwright-core/**',
      './node_modules/.pnpm/playwright@*/node_modules/playwright/**',
    ],
  },
  serverExternalPackages: ['playwright'],
  experimental: {
    authInterrupts: true,
    proxyClientMaxBodySize: '16mb',
    serverActions: {
      bodySizeLimit: '16mb',
    },
  },
}

export default nextConfig
