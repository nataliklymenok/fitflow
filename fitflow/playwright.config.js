import { defineConfig, devices } from '@playwright/test'

// Runs against a production build served by `vite preview`, or against
// BASE_URL when it is set (e.g. the live site after a deploy).
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173'

const desktop = { viewport: { width: 1280, height: 900 } }
const phone = { viewport: { width: 390, height: 844 } }

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], ...desktop } },
    { name: 'chromium-phone', use: { ...devices['Desktop Chrome'], ...phone } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], ...desktop } },
    { name: 'firefox-phone', use: { ...devices['Desktop Firefox'], ...phone } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], ...desktop } },
    { name: 'webkit-phone', use: { ...devices['Desktop Safari'], ...phone } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run build && npx vite preview --port 4173 --strictPort',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
