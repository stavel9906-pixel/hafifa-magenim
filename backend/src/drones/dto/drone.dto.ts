import type { Drone } from '../types/drone.entity.js';

export class DroneDto {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly createdAt: string;

  private constructor(drone: Drone) {
    this.id = drone.id;
    this.latitude = drone.latitude;
    this.longitude = drone.longitude;
    this.createdAt = drone.createdAt.toISOString();
  }

  static fromEntity(drone: Drone): DroneDto {
    return new DroneDto(drone);
  }
}
