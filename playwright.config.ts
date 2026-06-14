import { defineConfig, devices } from '@playwright/test'

const PORT = 3210
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  reporter: 'list',
  use: { baseURL },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
  webServer: {
    command: `next dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DATABASE_PATH: './data/e2e.sqlite' },
  },
})
