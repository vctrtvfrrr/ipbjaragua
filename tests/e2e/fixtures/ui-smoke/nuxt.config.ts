// Minimal fixture that mirrors the real app's Nuxt UI wiring (module + CSS
// entry, no standalone @tailwindcss/vite plugin) so the e2e smoke test boots a
// genuine SSR server and asserts a U* component renders server-side.
export default defineNuxtConfig({
  compatibilityDate: '2024-12-05',
  ssr: true,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
});
