import type { Coordinates } from '../../drones/types/coordinates.js';

/** A `[longitude, latitude]` pair — GeoJSON axis order. */
export type Position = readonly [longitude: number, latitude: number];

/** A closed ring: the first and last positions are equal. */
export type LinearRing = readonly Position[];

/**
 * A polygon with optional holes, following GeoJSON `Polygon` semantics:
 * a point is inside when it is inside the outer ring and in none of the holes.
 */
export interface Polygon {
  readonly outer: LinearRing;
  readonly holes: readonly LinearRing[];
}

export interface BoundingBox {
  readonly minLongitude: number;
  readonly maxLongitude: number;
  readonly minLatitude: number;
  readonly maxLatitude: number;
}

/**
 * Ray-casting test: casts a ray east from the point and counts how many ring
 * edges it crosses. An odd count means the point is inside.
 */
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
