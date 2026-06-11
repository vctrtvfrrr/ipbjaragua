import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.177'],
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
