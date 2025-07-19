// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',       // Only run tests inside "tests" folder
  testMatch: ['**/*.spec.js', '**/*.test.js'], // Match test file patterns
  timeout: 30000,         // 30 seconds timeout per test
  retries: 1,             // Retry failed tests once (optional)
  use: {
    headless: true,       // Run tests headless by default
  },
});
