import type { INestApplication } from '@nestjs/common';

/** App-wide HTTP setup, shared by `main.ts` and the e2e tests. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
}
