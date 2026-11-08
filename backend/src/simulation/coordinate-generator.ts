import type { Coordinates } from '../drones/types/coordinates.js';
import {
  boundingBoxOf,
  isInsidePolygon,
  type BoundingBox,
  type Polygon,
} from './geo/polygon.js';

/** Returns a number in [0, 1), like `Math.random`. */
export type RandomSource = () => number;

/**
 * Generates uniformly random coordinates inside a polygon using rejection
 * sampling: pick a random point in the polygon's bounding box and keep it
 * only if it falls inside the polygon.
 */
export class CoordinateGenerator {
  /**
   * Israel fills roughly a third of its bounding box, so a valid point is
   * found within a few attempts. The cap only guards against a broken polygon.
   */
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
