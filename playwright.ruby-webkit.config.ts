import { defineConfig, devices } from '@playwright/test'

const PORT = 5274

/**
 * Focused native-ruby suite. The main E2E configuration intentionally stays
 * Chromium-only; run this locally (and in a WebKit-enabled job) when changing
 * native inter-character geometry.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: [
    'ruby-zhuyin-calibration.spec.ts',
    'ruby-zhuyin-config-webkit.spec.ts',
  ],
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'webkit-ruby', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'node build/serve.js',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    env: { PORT: String(PORT) },
  },
})
