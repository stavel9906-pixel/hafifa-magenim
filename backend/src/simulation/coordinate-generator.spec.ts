import { CoordinateGenerator } from './coordinate-generator.js';
import { ISRAEL_LAND_AREA } from './geo/israel-land-area.js';
import { isInsidePolygon, type Polygon } from './geo/polygon.js';

// Unit square with the whole left half removed by a hole.
const rightHalfOnly: Polygon = {
  outer: [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ],
  holes: [
    [
      [-1, -1],
      [0.5, -1],
      [0.5, 2],
      [-1, 2],
      [-1, -1],
    ],
  ],
};

/** A random source that returns the given values in order, then repeats the last. */
function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('CoordinateGenerator', () => {
  it('maps random values onto the bounding box (latitude first, then longitude)', () => {
    const generator = new CoordinateGenerator(
      rightHalfOnly,
      sequence(0.25, 0.75),
    );

    expect(generator.generate()).toEqual({ latitude: 0.25, longitude: 0.75 });
  });

  it('rejects candidates outside the area and retries', () => {
    // First candidate (lng 0.2) is in the hole; second (lng 0.9) is valid.
    const random = vi.fn(sequence(0.5, 0.2, 0.5, 0.9));
    const generator = new CoordinateGenerator(rightHalfOnly, random);

    expect(generator.generate()).toEqual({ latitude: 0.5, longitude: 0.9 });
    expect(random).toHaveBeenCalledTimes(4);
  });

  it('throws after MAX_ATTEMPTS instead of looping forever', () => {
    const alwaysInHole = sequence(0.1);
    const generator = new CoordinateGenerator(rightHalfOnly, alwaysInHole);

    expect(() => generator.generate()).toThrow(
      `No point inside the area after ${CoordinateGenerator.MAX_ATTEMPTS} attempts`,
    );
  });

  it('only produces points inside Israel with the real random source', () => {
    const generator = new CoordinateGenerator(ISRAEL_LAND_AREA, Math.random);

    for (let i = 0; i < 5000; i++) {
      const point = generator.generate();
      expect(isInsidePolygon(point, ISRAEL_LAND_AREA)).toBe(true);
    }
  });
});
