import svgLoader from 'vite-svg-loader';
import { defineConfig } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./tests/setup.ts'],
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
          include: ['**/*.{test,nuxt}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
  plugins: [svgLoader()],
});
