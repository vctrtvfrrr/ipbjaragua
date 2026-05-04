import { defineConfig } from 'vitest/config';
import { defineVitestProject } from '@nuxt/test-utils/config';

export default defineConfig({
  test: {
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
});
