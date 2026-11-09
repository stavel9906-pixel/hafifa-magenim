import type { Drone } from '../../types/drone';

export type DronesAction =
  | { type: 'loadStarted' }
  | { type: 'loadSucceeded'; drones: readonly Drone[] }
  | { type: 'loadFailed'; error: string }
  | { type: 'droneReceived'; drone: Drone };
