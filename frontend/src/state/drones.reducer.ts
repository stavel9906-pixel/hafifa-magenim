import { mergeDrones } from '../utils/merge-drones';
import type { DronesAction } from './types/drones-action';
import type { DronesStoreState } from './types/drones-store-state';

export function dronesReducer(
  state: DronesStoreState,
  action: DronesAction,
): DronesStoreState {
  switch (action.type) {
    case 'loadStarted':
      return state.status === 'success' && state.dronesById.size > 0
        ? state
        : { ...state, status: 'loading', error: undefined };
    case 'loadSucceeded':
      return {
        status: 'success',
        dronesById: mergeDrones(state.dronesById, action.drones),
      };
    case 'loadFailed':
      return { ...state, status: 'error', error: action.error };
    case 'droneReceived': {
      const dronesById = mergeDrones(state.dronesById, [action.drone]);
      return dronesById === state.dronesById ? state : { ...state, dronesById };
    }
  }
}
