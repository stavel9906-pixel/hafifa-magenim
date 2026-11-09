import type { Drone } from '../../types/drone';
import type { DroneFeatureCollection } from '../types/drone-feature';

export function toDroneFeatureCollection(
  drones: readonly Drone[],
): DroneFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: drones.map((drone) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [drone.longitude, drone.latitude],
      },
      properties: { id: drone.id, createdAt: drone.createdAt },
    })),
  };
}
