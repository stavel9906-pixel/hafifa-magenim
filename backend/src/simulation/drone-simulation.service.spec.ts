import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DronesService } from '../drones/drones.service.js';
import type { DroneDto } from '../drones/dto/drone.dto.js';
import type { Coordinates } from '../drones/types/coordinates.js';
import type { Drone } from '../drones/types/drone.entity.js';
import { DronesGateway } from '../realtime/drones.gateway.js';
import { CoordinateGenerator } from './coordinate-generator.js';
import { DroneSimulationService } from './drone-simulation.service.js';

const INTERVAL_MS = 5000;
const COORDINATES: Coordinates = { latitude: 31.5, longitude: 34.9 };

function droneFrom(coordinates: Coordinates): Drone {
  return { id: 'id', createdAt: new Date(), ...coordinates };
}

describe('DroneSimulationService', () => {
  const generate = vi.fn<() => Coordinates>();
  const create = vi.fn<(c: Coordinates) => Promise<Drone>>();
  const broadcastDroneCreated = vi.fn<(drone: DroneDto) => void>();
  let service: DroneSimulationService;

  async function createService(
    enabled = true,
  ): Promise<DroneSimulationService> {
    const settings = {
      SIMULATION_INTERVAL_MS: INTERVAL_MS,
      SIMULATION_ENABLED: enabled,
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        DroneSimulationService,
        { provide: CoordinateGenerator, useValue: { generate } },
        { provide: DronesService, useValue: { create } },
        { provide: DronesGateway, useValue: { broadcastDroneCreated } },
        {
          provide: ConfigService,
          useValue: { get: (key: keyof typeof settings) => settings[key] },
        },
      ],
    }).compile();
    return moduleRef.get(DroneSimulationService);
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    generate.mockReturnValue(COORDINATES);
    create.mockImplementation((c) => Promise.resolve(droneFrom(c)));
    service = await createService();
  });

  afterEach(async () => {
    // Stop first, then let any fake-timer-based save in flight finish so
    // onModuleDestroy (which awaits it) can resolve.
    service.stop();
    await vi.runOnlyPendingTimersAsync();
    await service.onModuleDestroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('broadcasts each drone as a DTO only after it is saved', async () => {
    const order: string[] = [];
    create.mockImplementation(async (c) => {
      order.push('save');
      return {
        id: 'saved-id',
        createdAt: new Date('2026-11-08T12:00:00.000Z'),
        ...c,
      };
    });
    broadcastDroneCreated.mockImplementation(() => order.push('broadcast'));

    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(order).toEqual(['save', 'broadcast']);
    expect(broadcastDroneCreated).toHaveBeenCalledWith({
      id: 'saved-id',
      latitude: COORDINATES.latitude,
      longitude: COORDINATES.longitude,
      createdAt: '2026-11-08T12:00:00.000Z',
    });
  });

  it('does not broadcast when the save fails', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    create.mockRejectedValueOnce(new Error('database unavailable'));

    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);

    expect(broadcastDroneCreated).not.toHaveBeenCalled();
  });

  it('logs a failed broadcast separately and keeps generating', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    broadcastDroneCreated.mockImplementationOnce(() => {
      throw new Error('socket server down');
    });

    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(error).toHaveBeenCalledWith(
      'Drone id was saved but could not be broadcast',
      expect.stringContaining('socket server down'),
    );
    expect(error).not.toHaveBeenCalledWith(
      'Failed to create drone',
      expect.anything(),
    );
    expect(broadcastDroneCreated).toHaveBeenCalledTimes(2);
  });

  it('starts automatically on application bootstrap', () => {
    service.onApplicationBootstrap();

    expect(service.isRunning).toBe(true);
  });

  it('does not start when SIMULATION_ENABLED is false', async () => {
    service = await createService(false);
    service.onApplicationBootstrap();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(service.isRunning).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('creates one drone per interval with generated coordinates', async () => {
    service.start();

    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    expect(create).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(COORDINATES);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('ignores a second start() — only one loop ever runs', async () => {
    service.start();
    service.start();
    service.onApplicationBootstrap();

    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(create).toHaveBeenCalledTimes(3);
  });

  it('never overlaps ticks when a save is slower than the interval', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    create.mockImplementation(async (c) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS * 2));
      inFlight--;
      return droneFrom(c);
    });

    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 10);

    expect(maxInFlight).toBe(1);
    expect(create.mock.calls.length).toBeGreaterThan(1);
  });

  it('keeps a steady cadence by subtracting the save duration from the delay', async () => {
    create.mockImplementation(async (c) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return droneFrom(c);
    });

    service.start();
    // Ticks start at 5 s, 10 s, 15 s — not 5 s, 11 s, 17 s.
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(create).toHaveBeenCalledTimes(3);
  });

  it('logs a failed save and keeps generating', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    create.mockRejectedValueOnce(new Error('database unavailable'));

    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(error).toHaveBeenCalledWith(
      'Failed to create drone',
      expect.stringContaining('database unavailable'),
    );
    expect(create).toHaveBeenCalledTimes(2);
    expect(service.isRunning).toBe(true);
  });

  it('logs a coordinate generation failure and keeps generating', async () => {
    const error = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    generate.mockImplementationOnce(() => {
      throw new Error('no point found');
    });

    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(error).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('stops scheduling after stop()', async () => {
    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    service.stop();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 5);

    expect(service.isRunning).toBe(false);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('waits for an in-flight save on shutdown and schedules nothing after it', async () => {
    let finishSave: (drone: Drone) => void = () => undefined;
    create.mockImplementation(
      () => new Promise<Drone>((resolve) => (finishSave = resolve)),
    );

    service.start();
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    expect(create).toHaveBeenCalledTimes(1);

    let destroyed = false;
    const destroying = service.onModuleDestroy().then(() => (destroyed = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(destroyed).toBe(false);

    finishSave(droneFrom(COORDINATES));
    await destroying;
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 3);

    expect(destroyed).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
