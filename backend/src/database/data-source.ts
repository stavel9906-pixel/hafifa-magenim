/**
 * DataSource used only by the TypeORM CLI (migrations). The Nest app builds
 * its connection through TypeOrmModule with the same options.
 */
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/database.config.js';
import { envSchema } from '../config/env.schema.js';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on variables already set in the environment.
}

export default new DataSource(
  buildDataSourceOptions(envSchema.parse(process.env)),
);
