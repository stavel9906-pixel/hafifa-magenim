import pg from 'pg';
import type { Env } from '../config/env.schema.js';

type ConnectionEnv = Pick<
  Env,
  'DB_HOST' | 'DB_PORT' | 'DB_USERNAME' | 'DB_PASSWORD' | 'DB_NAME'
>;

/**
 * Creates the database named by DB_NAME if it does not exist yet, by
 * connecting to the built-in `postgres` maintenance database.
 *
 * @returns `true` if the database was created, `false` if it already existed.
 */
export async function ensureDatabaseExists(
  env: ConnectionEnv,
): Promise<boolean> {
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
      return false;
    }
    // Identifiers can't be bound as query parameters, so escape explicitly.
    await client.query(
      `CREATE DATABASE ${client.escapeIdentifier(env.DB_NAME)}`,
    );
    return true;
  } finally {
    await client.end();
  }
}
