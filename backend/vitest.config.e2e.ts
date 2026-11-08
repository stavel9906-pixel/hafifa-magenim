import { defineConfig } from 'vitest/config';
import { TEST_DB_NAME } from './test/test-database.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    env: { DB_NAME: TEST_DB_NAME },
    // Suites share one database, so run them one at a time.
    fileParallelism: false,
  },
});
