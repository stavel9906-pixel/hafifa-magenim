import { describe, expect, it } from 'vitest';
import type { Drone } from '../../types/drone';
import { toDroneFeatureCollection } from './drone-feature.mapper';

const telAviv: Drone = {
  id: 'tlv',
  latitude: 32.08,
  longitude: 34.78,
  createdAt: '2026-11-08T12:00:00.000Z',
};

describe('toDroneFeatureCollection', () => {
  it('puts longitude first and latitude second, as GeoJSON requires', () => {
    const [feature] = toDroneFeatureCollection([telAviv]).features;

    expect(feature.geometry).toEqual({
      type: 'Point',
      coordinates: [34.78, 32.08],
    });
  });

  it('creates one feature per drone with its id and creation time', () => {
    const eilat: Drone = { ...telAviv, id: 'eilat', latitude: 29.56, longitude: 34.95 };

    const collection = toDroneFeatureCollection([telAviv, eilat]);

    expect(collection.type).toBe('FeatureCollection');
    expect(collection.features.map((f) => f.properties)).toEqual([
      { id: 'tlv', createdAt: telAviv.createdAt },
      { id: 'eilat', createdAt: eilat.createdAt },
    ]);
  });

  it('returns an empty collection for no drones', () => {
    expect(toDroneFeatureCollection([]).features).toEqual([]);
  });
});
