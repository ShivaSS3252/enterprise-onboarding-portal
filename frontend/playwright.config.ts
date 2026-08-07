import { defineConfig, devices } from '@playwright/test';

// Runs against a dedicated port (3002) so it never collides with a frontend
// dev server you might already have running on 3001 during manual testing.
// The backend (Nest + Postgres) is NOT started by this config — it's a real
// dependency, not mocked, so it must already be running separately
// (see frontend/e2e/README.md).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev -- -p 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
