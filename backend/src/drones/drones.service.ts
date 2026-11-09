import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { Coordinates } from './types/coordinates.js';
import { Drone } from './types/drone.entity.js';

@Injectable()
export class DronesService {
  constructor(
    @InjectRepository(Drone)
    private readonly droneRepository: Repository<Drone>,
  ) {}

  /** All drones, oldest first. `id` breaks ties for a stable order. */
  findAll(): Promise<Drone[]> {
    return this.droneRepository.find({
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async deleteAllButNewest(keep: number): Promise<string[]> {
    const stale = await this.droneRepository.find({
      select: { id: true },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: keep,
    });
    const ids = stale.map((drone) => drone.id);
    if (ids.length > 0) {
      await this.droneRepository.delete({ id: In(ids) });
    }
    return ids;
  }

  /** Inserts a new drone; the database assigns its id and creation time. */
  create(coordinates: Coordinates): Promise<Drone> {
    return this.droneRepository.save(
      this.droneRepository.create({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      }),
    );
  }
}
