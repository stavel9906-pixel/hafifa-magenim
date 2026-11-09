import { describe, expect, it } from 'vitest';
import type { Drone, DronesById } from '../../src/types/drone';
import { mergeDrones } from '../../src/utils/merge-drones';

const drone = (id: string): Drone => ({
  id,
  latitude: 31.5,
  longitude: 34.9,
  createdAt: '2026-11-08T12:00:00.000Z',
});

const byId = (...drones: Drone[]): DronesById =>
  new Map(drones.map((d) => [d.id, d]));

describe('mergeDrones', () => {
  it('adds drones it has not seen', () => {
    const merged = mergeDrones(byId(drone('a')), [drone('b'), drone('c')]);

    expect([...merged.keys()]).toEqual(['a', 'b', 'c']);
  });

  it('never duplicates a drone it already has', () => {
    const merged = mergeDrones(byId(drone('a'), drone('b')), [
      drone('b'),
      drone('c'),
      drone('a'),
    ]);

    expect([...merged.keys()]).toEqual(['a', 'b', 'c']);
  });

  it('returns the same map when nothing is new, so React can skip a render', () => {
    const current = byId(drone('a'));

    expect(mergeDrones(current, [drone('a')])).toBe(current);
    expect(mergeDrones(current, [])).toBe(current);
  });

  it('does not mutate the current map', () => {
    const current = byId(drone('a'));

    mergeDrones(current, [drone('b')]);

    expect(current.size).toBe(1);
  });

  it('gives the same result regardless of arrival order', () => {
    const viaRestFirst = mergeDrones(
      mergeDrones(new Map(), [drone('a'), drone('b')]),
      [drone('b')],
    );
    const viaSocketFirst = mergeDrones(
      mergeDrones(new Map(), [drone('b')]),
      [drone('a'), drone('b')],
    );

    expect(new Set(viaRestFirst.keys())).toEqual(new Set(viaSocketFirst.keys()));
  });
});
