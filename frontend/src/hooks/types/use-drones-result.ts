import type { ConnectionStatus } from '../../realtime/types/connection-status';
import type { DronesState } from './drones-state';

export interface UseDronesResult {
  state: DronesState;
  connection: ConnectionStatus;
  reload: () => void;
}
