import type { DataSourceOptions } from 'typeorm';
import type { Env } from './env.schema.js';

type DatabaseEnv = Pick<
  Env,
  'DB_HOST' | 'DB_PORT' | 'DB_USERNAME' | 'DB_PASSWORD' | 'DB_NAME'
>;

/**
 * Single source of TypeORM connection options, shared by the Nest app and
 * the TypeORM migration CLI so both always point at the same database.
 *
 * The schema is managed only through migrations, never `synchronize`.
 */
export function buildDataSourceOptions(env: DatabaseEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: false,
    entities: [],
    migrations: [],
  };
}
