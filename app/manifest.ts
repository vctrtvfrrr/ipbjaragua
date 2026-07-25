import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IPB de Jaraguá do Sul',
    short_name: 'IPB Jaraguá',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // As versões maskable têm margem própria: o sistema recorta as bordas e cortaria a cruz.
      { src: '/icons/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    theme_color: '#386641',
    background_color: '#ebf2fa',
    display: 'standalone',
  }
}
