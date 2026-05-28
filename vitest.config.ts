import svgLoader from 'vite-svg-loader';
import { defineVitestProject } from '@nuxt/test-utils/config';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => ({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['**/*.spec.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['**/*.e2e.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['**/*.nuxt.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
  plugins: [svgLoader()],
}));
