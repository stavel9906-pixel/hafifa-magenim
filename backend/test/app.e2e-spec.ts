import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DronesService } from '../src/drones/drones.service.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// Boots the real application against the PostgreSQL test database.
describe('App (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let dronesService: DronesService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);
    dronesService = app.get(DronesService);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "drones"');
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health reports the database as up', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  describe('GET /api/drones', () => {
    it('returns an empty list when no drones exist', () => {
      return request(app.getHttpServer())
        .get('/api/drones')
        .expect(200)
        .expect([]);
    });

    it('returns persisted drones oldest first, in the public format', async () => {
      const first = await dronesService.create({
        latitude: 32.0853,
        longitude: 34.7818,
      });
      const second = await dronesService.create({
        latitude: 31.7683,
        longitude: 35.2137,
      });

      const response = await request(app.getHttpServer())
        .get('/api/drones')
        .expect(200);

      expect(response.body).toEqual([
        {
          id: first.id,
          latitude: 32.0853,
          longitude: 34.7818,
          createdAt: first.createdAt.toISOString(),
        },
        {
          id: second.id,
          latitude: 31.7683,
          longitude: 35.2137,
          createdAt: second.createdAt.toISOString(),
        },
      ]);
    });
  });

  describe('drones table', () => {
    it('assigns a unique UUID v4 and a creation time to each drone', async () => {
      const a = await dronesService.create({ latitude: 31, longitude: 35 });
      const b = await dronesService.create({ latitude: 31, longitude: 35 });

      expect(a.id).toMatch(UUID_PATTERN);
      expect(b.id).toMatch(UUID_PATTERN);
      expect(a.id).not.toBe(b.id);
      expect(a.createdAt).toBeInstanceOf(Date);
    });

    it.each([
      { latitude: 91, longitude: 35 },
      { latitude: -91, longitude: 35 },
      { latitude: 31, longitude: 181 },
      { latitude: 31, longitude: -181 },
    ])('rejects out-of-range coordinates %o', async (coordinates) => {
      await expect(dronesService.create(coordinates)).rejects.toThrow(
        /violates check constraint/,
      );
    });
  });
});
