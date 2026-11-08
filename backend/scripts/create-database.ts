/**
 * Creates the application database (DB_NAME) if it does not exist yet.
 *
 * Usage: npm run db:create
 */
import { envSchema } from '../src/config/env.schema.js';
import { ensureDatabaseExists } from '../src/database/ensure-database.js';

async function main(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No .env file: rely on variables already set in the environment.
  }
  const env = envSchema.parse(process.env);

  const created = await ensureDatabaseExists(env);
  console.log(
    created
      ? `Database "${env.DB_NAME}" created.`
      : `Database "${env.DB_NAME}" already exists.`,
  );
}

main().catch((error: unknown) => {
  console.error(
    'Failed to create database:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
