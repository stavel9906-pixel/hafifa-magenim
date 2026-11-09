import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { fetchDrones } from '../api/drones.api';
import { initialDronesState } from '../state/constants/initial-drones-state';
import { dronesReducer } from '../state/drones.reducer';
import type { DronesState } from './types/drones-state';
import type { UseDronesResult } from './types/use-drones-result';
import { useDroneSocket } from './useDroneSocket';

export function useDrones(): UseDronesResult {
  const [store, dispatch] = useReducer(dronesReducer, initialDronesState);
  const loadControllerRef = useRef<AbortController | null>(null);
  const hasLoadedRef = useRef(false);
  const isLoadingRef = useRef(false);

  const load = useCallback(() => {
    loadControllerRef.current?.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;
    isLoadingRef.current = true;
    dispatch({ type: 'loadStarted' });

    fetchDrones(controller.signal)
      .then((drones) => {
        hasLoadedRef.current = true;
        dispatch({ type: 'loadSucceeded', drones });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        dispatch({
          type: 'loadFailed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      })
      .finally(() => {
        if (loadControllerRef.current === controller) {
          isLoadingRef.current = false;
        }
      });
  }, []);

  useEffect(() => () => loadControllerRef.current?.abort(), []);

  const connection = useDroneSocket({
    onConnect: load,
    onConnectError: () => {
      if (!hasLoadedRef.current && !isLoadingRef.current) {
        load();
      }
    },
    onDrone: (drone) => dispatch({ type: 'droneReceived', drone }),
    onDronesRemoved: (ids) => dispatch({ type: 'dronesRemoved', ids }),
  });

  const drones = useMemo(
    () => [...store.dronesById.values()],
    [store.dronesById],
  );

  const state: DronesState =
    store.status === 'error'
      ? { status: 'error', drones, error: store.error ?? 'Unknown error' }
      : { status: store.status, drones };

  return { state, connection, reload: load };
}
