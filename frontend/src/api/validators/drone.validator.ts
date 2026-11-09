import type { Drone } from '../../types/drone';
import { ApiError } from '../api-error';

export function isDrone(value: unknown): value is Drone {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const drone = value as Record<string, unknown>;
  return (
    typeof drone.id === 'string' &&
    Number.isFinite(drone.latitude) &&
    Number.isFinite(drone.longitude) &&
    typeof drone.createdAt === 'string'
  );
}

export function parseDrones(body: unknown): Drone[] {
  if (!Array.isArray(body) || !body.every(isDrone)) {
    throw new ApiError('Server returned drones in an unexpected format');
  }
  return body;
}
