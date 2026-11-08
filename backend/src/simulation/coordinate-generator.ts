import type { Coordinates } from '../drones/types/coordinates.js';
import type { BoundingBox, Polygon } from './geo/types/polygon.js';
import { boundingBoxOf, isInsidePolygon } from './geo/utils/polygon.utils.js';

export type RandomSource = () => number;

export class CoordinateGenerator {
  static readonly MAX_ATTEMPTS = 1000;

  private readonly bounds: BoundingBox;

  constructor(
    private readonly area: Polygon,
    private readonly random: RandomSource,
  ) {
    this.bounds = boundingBoxOf(area.outer);
  }

  generate(): Coordinates {
    for (
      let attempt = 0;
      attempt < CoordinateGenerator.MAX_ATTEMPTS;
      attempt++
    ) {
      const candidate = this.randomPointInBounds();
      if (isInsidePolygon(candidate, this.area)) {
        return candidate;
      }
    }
    throw new Error(
      `No point inside the area after ${CoordinateGenerator.MAX_ATTEMPTS} attempts`,
    );
  }

  private randomPointInBounds(): Coordinates {
    const { minLatitude, maxLatitude, minLongitude, maxLongitude } =
      this.bounds;
    return {
      latitude: minLatitude + this.random() * (maxLatitude - minLatitude),
      longitude: minLongitude + this.random() * (maxLongitude - minLongitude),
    };
  }
}
