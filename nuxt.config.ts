import svgLoader from 'vite-svg-loader';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2024-12-05',
  ssr: true,
  devtools: { enabled: true },
  imports: { autoImport: false },
  ignore: ['**/__specs__/**'],
  app: {
    baseURL: process.env.BASE_URL,
    head: {
      title: 'IPB de Jaguará do Sul',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  modules: ['@pinia/nuxt', '@nuxt/devtools', '@nuxt/fonts'],
  css: ['@/assets/style/tailwind.css'],
  vite: {
    plugins: [svgLoader(), tailwindcss()],
  },
  nitro: {
    preset: 'node-server',
    externals: {
      external: ['better-sqlite3'],
      inline: ['marked'],
    },
    ignore: ['**/__specs__/**'],
  },
  devServer: {
    port: 3000,
    host: 'localhost',
  },
});
