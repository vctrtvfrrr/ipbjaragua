import { defineConfig, devices } from '@playwright/test'
import { E2E_DATABASE_URL } from './tests/e2e/seed-db'

const PORT = 3210
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  use: { baseURL },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: `tsx -e "import('./tests/e2e/seed-db.ts').then((m) => m.seedE2eDatabase())" && next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_URL: E2E_DATABASE_URL },
  },
})
