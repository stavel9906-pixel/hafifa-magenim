import { Test } from '@nestjs/testing';
import type { Drone } from './drone.entity.js';
import { DronesController } from './drones.controller.js';
import { DronesService } from './drones.service.js';

describe('DronesController', () => {
  const findAll = vi.fn<() => Promise<Drone[]>>();
  let controller: DronesController;

  beforeEach(async () => {
    findAll.mockReset();
    const moduleRef = await Test.createTestingModule({
      controllers: [DronesController],
      providers: [{ provide: DronesService, useValue: { findAll } }],
    }).compile();
    controller = moduleRef.get(DronesController);
  });

  it('maps entities to DTOs with an ISO creation timestamp', async () => {
    findAll.mockResolvedValue([
      {
        id: 'a1b2',
        latitude: 31.5,
        longitude: 34.9,
        createdAt: new Date('2026-11-08T12:00:00.000Z'),
      },
    ]);

    await expect(controller.findAll()).resolves.toEqual([
      {
        id: 'a1b2',
        latitude: 31.5,
        longitude: 34.9,
        createdAt: '2026-11-08T12:00:00.000Z',
      },
    ]);
  });

  it('returns an empty list when there are no drones', async () => {
    findAll.mockResolvedValue([]);

    await expect(controller.findAll()).resolves.toEqual([]);
  });
});
