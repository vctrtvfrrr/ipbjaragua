import { defineConfig, devices } from '@playwright/test'
import { E2E_DATABASE_URL, E2E_SESSION_SECRET } from './tests/e2e/seed-db'

const PORT = 3210
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  // The suite runs against `next dev`, so a first navigation also waits for the route to
  // compile — well past the 5s default on a loaded CI runner.
  expect: { timeout: 15_000 },
  // Compiling is charged to whichever test arrives first, and the article journey walks seven
  // routes: on a runner where it takes 10s alone it takes 30 next to three other workers, so
  // the default budget leaves a passing suite one test away from a red one.
  timeout: 60_000,
  use: { baseURL },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /meeting-minutes\.spec\.ts/ },
    // Exporting a Livro holds the server's single render queue for a minute at a time, so the
    // journey through the Atas runs after the rest instead of starving specs that only need a
    // page to answer.
    {
      name: 'meeting-minutes',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /meeting-minutes\.spec\.ts/,
      dependencies: ['chromium'],
    },
  ],
  webServer: {
    command: `tsx -e "import('./tests/e2e/seed-db.ts').then((m) => m.seedE2eDatabase())" && next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: E2E_DATABASE_URL, SESSION_SECRET: E2E_SESSION_SECRET },
  },
})
