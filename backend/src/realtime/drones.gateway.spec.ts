import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import type { DroneDto } from '../drones/dto/drone.dto.js';
import { DRONE_CREATED_EVENT } from './drone-events.js';
import { DronesGateway } from './drones.gateway.js';

describe('DronesGateway', () => {
  const emit = vi.fn();
  const engineOn = vi.fn();
  const server = {
    emit,
    engine: { on: engineOn, clientsCount: 2 },
  } as unknown as Server;
  const client = { id: 'client-1' } as Socket;
  let gateway: DronesGateway;
  let log: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetAllMocks();
    log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warn = vi
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    gateway = new DronesGateway();
    Object.assign(gateway, { server });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('broadcasts a created drone to every client', () => {
    const drone: DroneDto = {
      id: 'd1',
      latitude: 31.5,
      longitude: 34.9,
      createdAt: '2026-11-08T12:00:00.000Z',
    };

    gateway.broadcastDroneCreated(drone);

    expect(emit).toHaveBeenCalledWith(DRONE_CREATED_EVENT, drone);
  });

  it('logs connections and disconnections with the client count', () => {
    gateway.handleConnection(client);
    gateway.handleDisconnect(client, 'transport close');

    expect(log).toHaveBeenCalledWith('Client client-1 connected (2 connected)');
    expect(log).toHaveBeenCalledWith(
      'Client client-1 disconnected: transport close (2 connected)',
    );
  });

  it('logs low-level connection errors', () => {
    gateway.afterInit(server);
    const [event, listener] = engineOn.mock.calls[0] as [
      string,
      (error: Error & { code?: number }) => void,
    ];

    listener(Object.assign(new Error('Bad request'), { code: 3 }));

    expect(event).toBe('connection_error');
    expect(warn).toHaveBeenCalledWith(
      'WebSocket connection error (code 3): Bad request',
    );
  });
});
