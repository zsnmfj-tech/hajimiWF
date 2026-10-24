import { defineConfig } from 'vitest/config';
export default defineConfig({
  base: '/hajimiWF/',
  test: { include: ['tests/**/*.test.ts'] },
});
