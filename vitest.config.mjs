import { defineConfig } from 'vitest/config';

// Unit tests live in tests/. The Playwright interop suite (e2e/) runs separately.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.mjs'],
  },
});
