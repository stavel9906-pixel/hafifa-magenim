import type { Drone } from '../types/drone';
import { getJson } from './http-client';
import { parseDrones } from './validators/drone.validator';

export function fetchDrones(signal?: AbortSignal): Promise<Drone[]> {
  return getJson('/drones', parseDrones, signal);
}
