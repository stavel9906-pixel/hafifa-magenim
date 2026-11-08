import { defineConfig } from 'vitest/config';
import { TEST_DB_NAME } from './test/test-database.js';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // The generation loop would insert drones mid-test; e2e tests create their own.
    env: { DB_NAME: TEST_DB_NAME, SIMULATION_ENABLED: 'false' },
    // Suites share one database, so run them one at a time.
    fileParallelism: false,
  },
});
