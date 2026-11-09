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
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),

  DB_HOST: z.string().min(1),
  DB_PORT: port.default(5432),
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  /** Set to false to run the API without generating drones (e.g. in e2e tests). */
  SIMULATION_ENABLED: z.stringbool().default(true),
  SIMULATION_INTERVAL_MS: z.coerce.number().int().min(100).default(5000),
  DRONES_MAX_COUNT: z.coerce.number().int().min(1).default(20),

  CAMERA_HOST: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined),
  CAMERA_RTSP_PORT: port.default(554),
  CAMERA_STREAM_PATH: z.string().trim().min(1).default('stream1'),
  CAMERA_USERNAME: z.string().default(''),
  CAMERA_PASSWORD: z.string().default(''),
  MEDIAMTX_PATH: z.string().trim().min(1).default('mediamtx'),
  MEDIAMTX_WEBRTC_PORT: port.default(8889),
});

export type Env = z.infer<typeof envSchema>;
