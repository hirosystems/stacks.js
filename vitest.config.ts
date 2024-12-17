import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: process.env.CI ? 5_000 : 1_000_000,
    hookTimeout: 1_000_000_000,
  },
});
