import svgLoader from 'vite-svg-loader';

export default defineNuxtConfig({
  compatibilityDate: '2024-12-05',
  ssr: true,
  devtools: { enabled: true },
  ignore: ['**/__specs__/**'],
  app: {
    baseURL: process.env.BASE_URL,
    head: {
      title: 'IPB de Jaguará do Sul',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },
  modules: ['@pinia/nuxt', '@nuxt/devtools', '@nuxt/ui', 'nuxt-og-image'],
  ogImage: {
    // Disable in test environment: when SSR is off (forced by @nuxt/test-utils),
    // the module skips registering auto-imports entirely, breaking the transform.
    // Disabling it makes the module register no-op mock imports instead.
    enabled: process.env.NODE_ENV !== 'test',
  },
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL ?? 'https://ipbjaragua.org.br',
    name: 'IPB de Jaguará do Sul',
  },
  css: ['@/assets/css/main.css'],
  vite: {
    plugins: [svgLoader()],
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
