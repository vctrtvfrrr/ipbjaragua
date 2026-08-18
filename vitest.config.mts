import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    testTimeout: 20_000,
    // The first createTestDb of a worker boots PGlite and applies every migration,
    // which outlasts the 10s default once CI runs several workers at once.
    hookTimeout: 20_000,
    env: { DATABASE_URL: 'postgres://placeholder' },
    projects: [
      {
        extends: true,
        test: {
          name: 'db',
          environment: 'node',
          include: ['db/**/*.test.ts', 'tests/db.test.ts'],
          exclude: ['node_modules/**', 'tests/e2e/**', '.next/**', '.claude/**'],
          isolate: false,
          fileParallelism: false,
          maxWorkers: 1,
          sequence: { groupOrder: 1 },
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['**/*.test.ts'],
          exclude: ['node_modules/**', 'tests/e2e/**', '.next/**', '.claude/**', 'db/**/*.test.ts', 'tests/db.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          include: ['**/*.test.tsx'],
          exclude: ['node_modules/**', 'tests/e2e/**', '.next/**', '.claude/**'],
        },
      },
    ],
  },
})
