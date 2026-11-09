import type { FeatureCollection, Point } from 'geojson';

export interface DroneFeatureProperties {
  id: string;
  createdAt: string;
}

export type DroneFeatureCollection = FeatureCollection<
  Point,
  DroneFeatureProperties
>;
