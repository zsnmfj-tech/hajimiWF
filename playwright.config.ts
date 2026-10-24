import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', timeout: 120000,
  workers: 1, use: { baseURL: 'http://127.0.0.1:5173/hajimiWF/', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }, { name: 'webkit', use: { ...devices['Desktop Safari'] } }],
  webServer: { command: 'npm run dev -- --port 5173', url: 'http://127.0.0.1:5173/hajimiWF/', reuseExistingServer: !process.env.CI },
});
