/**
 * Creates the application database (DB_NAME) if it does not exist yet.
 * Connects to the built-in `postgres` maintenance database to do so.
 *
 * Usage: npm run db:create
 */
import pg from 'pg';
import { envSchema } from '../src/config/env.schema.js';

async function createDatabase(): Promise<void> {
  try {
    process.loadEnvFile('.env');
  } catch {
    // No .env file: rely on variables already set in the environment.
  }
  const env = envSchema.parse(process.env);

  const client = new pg.Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: 'postgres',
  });

  await client.connect();
  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [env.DB_NAME],
    );
    if (rowCount) {
      console.log(`Database "${env.DB_NAME}" already exists.`);
      return;
    }
    // Identifiers can't be bound as query parameters, so escape explicitly.
    await client.query(
      `CREATE DATABASE ${client.escapeIdentifier(env.DB_NAME)}`,
    );
    console.log(`Database "${env.DB_NAME}" created.`);
  } finally {
    await client.end();
  }
}

createDatabase().catch((error: unknown) => {
  console.error(
    'Failed to create database:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
