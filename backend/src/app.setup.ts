import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from './config/env.schema.js';
import { SocketIoAdapter } from './realtime/socket-io.adapter.js';

export function configureApp(app: INestApplication): void {
  const corsOrigins = app
    .get(ConfigService<Env, true>)
    .get('CORS_ORIGINS', { infer: true });

  app.setGlobalPrefix('api');
  app.enableCors({ origin: corsOrigins });
  app.useWebSocketAdapter(new SocketIoAdapter(app, corsOrigins));
  app.enableShutdownHooks();
}
