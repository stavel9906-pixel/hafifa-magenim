import type { DronesById } from '../../types/drone';

export interface DronesStoreState {
  status: 'loading' | 'success' | 'error';
  dronesById: DronesById;
  error?: string;
}
