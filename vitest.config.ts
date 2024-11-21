import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    includeSource: ['app/**/*.{js,ts,tsx}'],
  },
});
