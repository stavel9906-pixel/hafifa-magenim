/**
 * E2E tests run against their own database so they never touch dev data.
 * vitest.config.e2e.ts sets DB_NAME to this for every test worker.
 */
export const TEST_DB_NAME = 'drone_simulation_test';
