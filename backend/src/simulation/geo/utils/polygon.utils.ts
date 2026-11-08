import type { Coordinates } from '../../../drones/types/coordinates.js';
import type { BoundingBox, LinearRing, Polygon } from '../types/polygon.js';

export function isInsideRing(
  { latitude, longitude }: Coordinates,
  ring: LinearRing,
): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [lngI, latI] = ring[i];
    const [lngJ, latJ] = ring[j];
    const edgeSpansLatitude = latI > latitude !== latJ > latitude;
    if (
      edgeSpansLatitude &&
      longitude < ((lngJ - lngI) * (latitude - latI)) / (latJ - latI) + lngI
    ) {
      inside = !inside;
    }
  }
  return inside;
}

export function isInsidePolygon(point: Coordinates, polygon: Polygon): boolean {
  return (
    isInsideRing(point, polygon.outer) &&
    !polygon.holes.some((hole) => isInsideRing(point, hole))
  );
}

export function boundingBoxOf(ring: LinearRing): BoundingBox {
  const longitudes = ring.map(([lng]) => lng);
  const latitudes = ring.map(([, lat]) => lat);
  return {
    minLongitude: Math.min(...longitudes),
    maxLongitude: Math.max(...longitudes),
    minLatitude: Math.min(...latitudes),
    maxLatitude: Math.max(...latitudes),
  };
}
