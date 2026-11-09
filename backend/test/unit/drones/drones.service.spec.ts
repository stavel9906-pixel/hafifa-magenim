import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Drone } from '../../../src/drones/types/drone.entity.js';
import { DronesService } from '../../../src/drones/drones.service.js';

describe('DronesService', () => {
  const repository = {
    find: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };
  let service: DronesService;

  beforeEach(async () => {
    vi.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        DronesService,
        { provide: getRepositoryToken(Drone), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(DronesService);
  });

  it('returns all drones ordered by creation time, then id', async () => {
    const drones = [{ id: 'a' }, { id: 'b' }];
    repository.find.mockResolvedValue(drones);

    await expect(service.findAll()).resolves.toBe(drones);
    expect(repository.find).toHaveBeenCalledWith({
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  });

  it('creates and saves a drone with only the given coordinates', async () => {
    const draft = { latitude: 32.08, longitude: 34.78 };
    const saved = { ...draft, id: 'generated-id', createdAt: new Date() };
    repository.create.mockReturnValue(draft);
    repository.save.mockResolvedValue(saved);

    await expect(
      service.create({ latitude: 32.08, longitude: 34.78 }),
    ).resolves.toBe(saved);
    expect(repository.create).toHaveBeenCalledWith(draft);
    expect(repository.save).toHaveBeenCalledWith(draft);
  });

  it('propagates database errors to the caller', async () => {
    repository.create.mockReturnValue({});
    repository.save.mockRejectedValue(new Error('connection lost'));

    await expect(
      service.create({ latitude: 31, longitude: 35 }),
    ).rejects.toThrow('connection lost');
  });

  it('deletes every drone except the newest N and returns their ids', async () => {
    repository.find.mockResolvedValue([{ id: 'old-1' }, { id: 'old-2' }]);

    await expect(service.deleteAllButNewest(20)).resolves.toEqual([
      'old-1',
      'old-2',
    ]);
    expect(repository.find).toHaveBeenCalledWith({
      select: { id: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: 20,
    });
    expect(repository.delete).toHaveBeenCalledWith({
      id: expect.objectContaining({ _value: ['old-1', 'old-2'] }),
    });
  });

  it('deletes nothing when there are N drones or fewer', async () => {
    repository.find.mockResolvedValue([]);

    await expect(service.deleteAllButNewest(20)).resolves.toEqual([]);
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
