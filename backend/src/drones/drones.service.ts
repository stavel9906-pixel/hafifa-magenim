import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Coordinates } from './coordinates.js';
import { Drone } from './drone.entity.js';

/** Persistence of drones. Database errors propagate to the caller. */
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
