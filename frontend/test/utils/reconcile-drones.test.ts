import { describe, expect, it } from 'vitest';
import type { Drone } from '../../src/types/drone';
import { reconcileDrones } from '../../src/utils/reconcile-drones';

const drone = (id: string, createdAt: string): Drone => ({
  id,
  latitude: 31.5,
  longitude: 34.9,
  createdAt,
});

const byId = (...drones: Drone[]) => new Map(drones.map((d) => [d.id, d]));

describe('reconcileDrones', () => {
  it('uses the fetched list as the source of truth', () => {
    const result = reconcileDrones(
      byId(drone('deleted', '2026-11-09T10:00:00.000Z')),
      [drone('a', '2026-11-09T10:00:05.000Z')],
    );

    expect([...result.keys()]).toEqual(['a']);
  });

  it('keeps drones that arrived by socket after the fetched snapshot', () => {
    const result = reconcileDrones(
      byId(drone('live', '2026-11-09T10:00:10.000Z')),
      [drone('a', '2026-11-09T10:00:05.000Z')],
    );

    expect([...result.keys()].sort()).toEqual(['a', 'live']);
  });

  it('keeps the existing order for drones it already has', () => {
    const live = drone('live', '2026-11-09T10:00:05.000Z');

    const result = reconcileDrones(byId(live), [
      drone('old', '2026-11-09T10:00:00.000Z'),
      live,
    ]);

    expect([...result.keys()]).toEqual(['live', 'old']);
  });

  it('clears everything when the server returns no drones', () => {
    const result = reconcileDrones(
      byId(drone('a', '2026-11-09T10:00:00.000Z')),
      [],
    );

    expect(result.size).toBe(0);
  });
});
