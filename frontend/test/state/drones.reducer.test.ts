import { describe, expect, it } from 'vitest';
import type { Drone } from '../../src/types/drone';
import { initialDronesState } from '../../src/state/constants/initial-drones-state';
import { dronesReducer } from '../../src/state/drones.reducer';
import type { DronesStoreState } from '../../src/state/types/drones-store-state';

const drone = (id: string): Drone => ({
  id,
  latitude: 31.5,
  longitude: 34.9,
  createdAt: '2026-11-08T12:00:00.000Z',
});

const loaded = (...drones: Drone[]): DronesStoreState =>
  dronesReducer(initialDronesState, { type: 'loadSucceeded', drones });

describe('dronesReducer', () => {
  it('keeps drones that arrived by socket when the REST load completes', () => {
    const afterSocket = dronesReducer(initialDronesState, {
      type: 'droneReceived',
      drone: drone('live'),
    });

    const afterLoad = dronesReducer(afterSocket, {
      type: 'loadSucceeded',
      drones: [drone('old'), drone('live')],
    });

    expect(afterLoad.status).toBe('success');
    expect([...afterLoad.dronesById.keys()]).toEqual(['live', 'old']);
  });

  it('does not flash a loading state when refreshing data it already shows', () => {
    const state = loaded(drone('a'));

    expect(dronesReducer(state, { type: 'loadStarted' })).toBe(state);
  });

  it('shows loading when retrying after an error', () => {
    const failed = dronesReducer(initialDronesState, {
      type: 'loadFailed',
      error: 'down',
    });

    expect(dronesReducer(failed, { type: 'loadStarted' })).toMatchObject({
      status: 'loading',
      error: undefined,
    });
  });

  it('keeps the drones it has when a later load fails', () => {
    const failed = dronesReducer(loaded(drone('a')), {
      type: 'loadFailed',
      error: 'down',
    });

    expect(failed.status).toBe('error');
    expect(failed.error).toBe('down');
    expect(failed.dronesById.has('a')).toBe(true);
  });

  it('returns the same state for a duplicate drone event', () => {
    const state = loaded(drone('a'));

    expect(
      dronesReducer(state, { type: 'droneReceived', drone: drone('a') }),
    ).toBe(state);
  });

  it('removes drones the server deleted', () => {
    const state = loaded(drone('a'), drone('b'), drone('c'));

    const after = dronesReducer(state, { type: 'dronesRemoved', ids: ['a', 'c'] });

    expect([...after.dronesById.keys()]).toEqual(['b']);
  });

  it('returns the same state when removing unknown drones', () => {
    const state = loaded(drone('a'));

    expect(dronesReducer(state, { type: 'dronesRemoved', ids: ['x'] })).toBe(
      state,
    );
  });

  it('drops drones the server no longer returns on reload', () => {
    const state = loaded(drone('old'), drone('kept'));

    const after = dronesReducer(state, {
      type: 'loadSucceeded',
      drones: [drone('kept')],
    });

    expect([...after.dronesById.keys()]).toEqual(['kept']);
  });
});
