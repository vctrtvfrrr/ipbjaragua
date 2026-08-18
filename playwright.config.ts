import { defineConfig, devices } from '@playwright/test'
import { E2E_DATABASE_URL, E2E_SESSION_SECRET } from './tests/e2e/seed-db'

const PORT = 3210
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  // The suite runs against `next dev`, so a first navigation also waits for the
  // route to compile — well past the 5s default on a loaded CI runner.
  expect: { timeout: 15_000 },
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `tsx -e "import('./tests/e2e/seed-db.ts').then((m) => m.seedE2eDatabase())" && next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: E2E_DATABASE_URL, SESSION_SECRET: E2E_SESSION_SECRET },
  },
})
