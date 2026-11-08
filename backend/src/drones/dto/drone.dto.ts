import type { Drone } from '../drone.entity.js';

/**
 * Public shape of a drone, used by both the REST API and the WebSocket
 * broadcast so clients see one consistent format.
 */
export class DroneDto {
  readonly id: string;
  readonly latitude: number;
  readonly longitude: number;
  /** ISO 8601 timestamp. */
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
