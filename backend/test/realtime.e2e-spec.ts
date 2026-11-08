import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import type { DroneDto } from '../src/drones/dto/drone.dto.js';
import { DRONE_CREATED_EVENT } from '../src/realtime/drone-events.js';
import { DroneSimulationService } from '../src/simulation/drone-simulation.service.js';

describe('Realtime drones (e2e)', () => {
  let app: INestApplication;
  let url: string;
  let dataSource: DataSource;
  let simulation: DroneSimulationService;
  const clients: Socket[] = [];

  function connectClient(): Promise<Socket> {
    const client = io(url, { transports: ['websocket'], reconnection: false });
    clients.push(client);
    return new Promise((resolve, reject) => {
      client.once('connect', () => resolve(client));
      client.once('connect_error', reject);
    });
  }

  function nextDrones(client: Socket, count: number): Promise<DroneDto[]> {
    return new Promise((resolve) => {
      const received: DroneDto[] = [];
      const onDrone = (drone: DroneDto) => {
        received.push(drone);
        if (received.length === count) {
          client.off(DRONE_CREATED_EVENT, onDrone);
          resolve(received);
        }
      };
      client.on(DRONE_CREATED_EVENT, onDrone);
    });
  }

  async function storedDrone(id: string): Promise<unknown> {
    const rows: unknown[] = await dataSource.query(
      'SELECT id FROM drones WHERE id = $1',
      [id],
    );
    return rows[0];
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.listen(0);

    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://localhost:${port}`;
    dataSource = app.get(DataSource);
    simulation = app.get(DroneSimulationService);
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE "drones"');
  });

  afterEach(() => {
    simulation.stop();
    clients.splice(0).forEach((client) => client.disconnect());
  });

  afterAll(async () => {
    await app.close();
  });

  it('broadcasts every new drone to all connected clients, after it is saved', async () => {
    const [first, second] = await Promise.all([
      connectClient(),
      connectClient(),
    ]);
    const firstReceives = nextDrones(first, 2);
    const secondReceives = nextDrones(second, 2);
    const savedWhenReceived = firstReceives.then((drones) =>
      Promise.all(drones.map((drone) => storedDrone(drone.id))),
    );

    simulation.start();
    const [firstDrones, secondDrones] = await Promise.all([
      firstReceives,
      secondReceives,
    ]);

    expect(firstDrones).toEqual(secondDrones);
    expect(new Set(firstDrones.map((drone) => drone.id)).size).toBe(2);
    expect(await savedWhenReceived).toEqual(
      firstDrones.map((drone) => ({ id: drone.id })),
    );

    const { body } = await request(app.getHttpServer()).get('/api/drones');
    expect(body).toEqual(expect.arrayContaining(firstDrones));
  });

  it('keeps broadcasting to remaining clients after one disconnects', async () => {
    const [leaving, staying] = await Promise.all([
      connectClient(),
      connectClient(),
    ]);
    leaving.disconnect();

    simulation.start();
    const [drone] = await nextDrones(staying, 1);

    expect(drone).toMatchObject({
      id: expect.any(String),
      latitude: expect.any(Number),
      longitude: expect.any(Number),
      createdAt: expect.any(String),
    });
  });

  it('allows REST calls from the configured frontend origin only', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/api/drones')
      .set('Origin', 'http://localhost:5173');
    const other = await request(app.getHttpServer())
      .get('/api/drones')
      .set('Origin', 'https://evil.example.com');

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:5173',
    );
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});
