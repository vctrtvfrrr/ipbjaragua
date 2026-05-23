import svgLoader from 'vite-svg-loader';
import { defineConfig } from 'vitest/config';

export default defineConfig({
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
    ],
  },
  plugins: [svgLoader()],
});
