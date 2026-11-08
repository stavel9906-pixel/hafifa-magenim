import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../src/config/database.config.js';
import { envSchema } from '../src/config/env.schema.js';
import { ensureDatabaseExists } from '../src/database/ensure-database.js';
import { TEST_DB_NAME } from './test-database.js';

/** Runs once before the e2e suite: creates the test database and migrates it. */
export default async function setup(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No .env file: rely on variables already set in the environment.
  }
  const env = envSchema.parse({ ...process.env, DB_NAME: TEST_DB_NAME });

  await ensureDatabaseExists(env);

  const dataSource = new DataSource(buildDataSourceOptions(env));
  await dataSource.initialize();
  try {
    await dataSource.runMigrations({ transaction: 'each' });
  } finally {
    await dataSource.destroy();
  }
}
