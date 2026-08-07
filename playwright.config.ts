import { defineConfig, devices } from '@playwright/test'

const PORT = 5273
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  // Chromium-only across CI and local (decided 2026-05-01). The reason
  // stands on its own below; the plan this used to cite
  // (docs/plans/2026-04-29-state-of-repo.md) has never existed in this
  // repo — it was a dead link, not a moved file. Visual
  // baselines are platform-sensitive and the per-engine snapshot churn
  // isn't worth it for a single-author project. Cross-engine coverage
  // stays manual (T23-style smoke checks in real Safari + Firefox).
  // Re-enable the firefox/webkit projects below when there's
  // contributor bandwidth for per-platform baseline maintenance.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'node build/serve.js',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    env: { PORT: String(PORT) },
  },
})
