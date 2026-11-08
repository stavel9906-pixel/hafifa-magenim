export type Position = readonly [longitude: number, latitude: number];

export type LinearRing = readonly Position[];

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
