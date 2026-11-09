import { describe, expect, it } from 'vitest';
import type { Drone } from '../../types/drone';
import { ApiError } from '../api-error';
import { isDrone, parseDrones } from './drone.validator';

const drone: Drone = {
  id: 'd1',
  latitude: 31.5,
  longitude: 34.9,
  createdAt: '2026-11-08T12:00:00.000Z',
};

describe('isDrone', () => {
  it.each([
    ['a valid drone', drone, true],
    ['null', null, false],
    ['a string latitude', { ...drone, latitude: '31.5' }, false],
    ['a NaN longitude', { ...drone, longitude: Number.NaN }, false],
    ['a missing id', { ...drone, id: undefined }, false],
  ])('%s → %s', (_name, value, expected) => {
    expect(isDrone(value)).toBe(expected);
  });
});

describe('parseDrones', () => {
  it('returns a valid list of drones unchanged', () => {
    expect(parseDrones([drone])).toEqual([drone]);
  });

  it.each([
    ['an object instead of a list', { drones: [] }],
    ['a list with an invalid drone', [drone, { id: 1 }]],
  ])('throws an ApiError for %s', (_name, body) => {
    expect(() => parseDrones(body)).toThrow(ApiError);
  });
});
