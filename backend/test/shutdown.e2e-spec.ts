import { Logger, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { setTimeout as sleep } from 'node:timers/promises';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { buildDataSourceOptions } from '../src/config/database.config.js';
import { envSchema } from '../src/config/env.schema.js';
import { DroneSimulationService } from '../src/simulation/drone-simulation.service.js';

describe('Graceful shutdown (e2e)', () => {
  let app: INestApplication;
  let observer: DataSource;

  const countDrones = async (): Promise<number> => {
    const [{ count }] = await observer.query<{ count: number }[]>(
      'SELECT count(*)::int AS count FROM drones',
    );
    return count;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    observer = new DataSource(
      buildDataSourceOptions(envSchema.parse(process.env)),
    );
    await observer.initialize();
    await observer.query('TRUNCATE TABLE "drones"');
  });

  afterAll(async () => {
    await observer.destroy();
  });

  it('stops generating and closes cleanly while the loop is running', async () => {
    const errors = vi.spyOn(Logger.prototype, 'error');
    app.get(DroneSimulationService).start();
    while ((await countDrones()) < 3) {
      await sleep(50);
    }

    await expect(app.close()).resolves.toBeUndefined();
    const countAtClose = await countDrones();
    await sleep(1000);

    expect(await countDrones()).toBe(countAtClose);
    expect(errors).not.toHaveBeenCalled();
  });
});
