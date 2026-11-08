import { z } from 'zod';

const port = z.coerce.number().int().min(1).max(65535);

/**
 * Every environment variable the backend reads. The app refuses to start
 * if any of them is missing or invalid.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: port.default(3001),

  DB_HOST: z.string().min(1),
  DB_PORT: port.default(5432),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  /** Set to false to run the API without generating drones (e.g. in e2e tests). */
  SIMULATION_ENABLED: z.stringbool().default(true),
  SIMULATION_INTERVAL_MS: z.coerce.number().int().min(100).default(5000),
});

export type Env = z.infer<typeof envSchema>;
