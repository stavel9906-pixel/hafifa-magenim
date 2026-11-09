import type { AddLayerObject, LngLatBoundsLike } from 'maplibre-gl';

export const ISRAEL_BOUNDS: LngLatBoundsLike = [
  [34.2, 29.45],
  [35.95, 33.35],
];

export const DRONE_SOURCE_ID = 'drones';
export const DRONE_ICON_ID = 'drone-icon';
export const DRONE_ICON_SIZE_PX = 64;

export const DRONE_LAYER: AddLayerObject = {
  id: 'drones',
  type: 'symbol',
  source: DRONE_SOURCE_ID,
  layout: {
    'icon-image': DRONE_ICON_ID,
    'icon-size': ['interpolate', ['linear'], ['zoom'], 6, 0.35, 12, 0.6],
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
  },
};
