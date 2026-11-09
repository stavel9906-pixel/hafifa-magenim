import type { Drone } from '../../types/drone';

export interface DroneSocketHandlers {
  onConnect: () => void;
  onConnectError: () => void;
  onDrone: (drone: Drone) => void;
  onDronesRemoved: (ids: string[]) => void;
}
