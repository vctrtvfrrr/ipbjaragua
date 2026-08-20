import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Every one of these renders with a real Chromium, and the service is sized for exactly one
// browser at a time. Left to the default parallelism they boot three and starve each other.
const PDF_TESTS = [
  'tests/pdf/**/*.test.ts',
  'lib/meeting-minute-pdf.test.ts',
  'app/(admin)/admin/meeting-minutes/actions.test.ts',
]

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
          name: 'postgres',
          environment: 'node',
          include: ['tests/postgres/**/*.test.ts'],
          // Each case recreates a scratch database on the same server.
          fileParallelism: false,
          maxWorkers: 1,
          sequence: { groupOrder: 2 },
        },
      },
      {
        extends: true,
        test: {
          name: 'pdf',
          environment: 'node',
          include: PDF_TESTS,
          fileParallelism: false,
          maxWorkers: 1,
          sequence: { groupOrder: 3 },
        },
      },
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['**/*.test.ts'],
          exclude: [
            'node_modules/**',
            'tests/e2e/**',
            'tests/postgres/**',
            '.next/**',
            '.claude/**',
            'db/**/*.test.ts',
            'tests/db.test.ts',
            ...PDF_TESTS,
          ],
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
