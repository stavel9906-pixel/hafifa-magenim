import type { Drone } from '../../types/drone';

export type DronesState =
  | { status: 'loading'; drones: Drone[] }
  | { status: 'success'; drones: Drone[] }
  | { status: 'error'; drones: Drone[]; error: string };
