import type { DronesStoreState } from '../types/drones-store-state';

export const initialDronesState: DronesStoreState = {
  status: 'loading',
  dronesById: new Map(),
};
