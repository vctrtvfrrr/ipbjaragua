import svgLoader from 'vite-svg-loader';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2024-12-05',
  devtools: { enabled: true },
  components: { dirs: [] },
  imports: { autoImport: false },
  app: {
    baseURL: process.env.BASE_URL,
    head: {
      title: 'IPB de Jaguará do Sul',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  modules: ['@pinia/nuxt', '@nuxt/devtools'],
  css: ['@/assets/style/animations.scss', '@/assets/style/tailwind.css'],
  vite: {
    plugins: [svgLoader(), tailwindcss()],
  },
  nitro: {
    externals: {
      inline: ['gray-matter', 'marked'],
    },
  },
  devServer: {
    port: 3000,
    host: 'localhost',
  },
});
