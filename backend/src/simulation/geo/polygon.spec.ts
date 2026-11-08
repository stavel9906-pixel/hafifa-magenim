import {
  boundingBoxOf,
  isInsidePolygon,
  isInsideRing,
  type LinearRing,
  type Polygon,
} from './polygon.js';

// 10×10 square with a 2×2 hole in the middle.
const square: LinearRing = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
];
const hole: LinearRing = [
  [4, 4],
  [6, 4],
  [6, 6],
  [4, 6],
  [4, 4],
];
const squareWithHole: Polygon = { outer: square, holes: [hole] };

const at = (longitude: number, latitude: number) => ({ longitude, latitude });

describe('isInsideRing', () => {
  it.each([
    [at(5, 5), true],
    [at(0.1, 9.9), true],
    [at(-1, 5), false],
    [at(11, 5), false],
    [at(5, -1), false],
    [at(5, 11), false],
  ])('%o → %s', (point, expected) => {
    expect(isInsideRing(point, square)).toBe(expected);
  });

  it('handles concave rings', () => {
    // "C" shape opening to the east: the notch is outside.
    const cShape: LinearRing = [
      [0, 0],
      [10, 0],
      [10, 3],
      [3, 3],
      [3, 7],
      [10, 7],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    expect(isInsideRing(at(1, 5), cShape)).toBe(true);
    expect(isInsideRing(at(6, 5), cShape)).toBe(false);
  });
});

describe('isInsidePolygon', () => {
  it('is true inside the outer ring and outside every hole', () => {
    expect(isInsidePolygon(at(2, 2), squareWithHole)).toBe(true);
  });

  it('is false inside a hole', () => {
    expect(isInsidePolygon(at(5, 5), squareWithHole)).toBe(false);
  });

  it('is false outside the outer ring, even inside a hole that sticks out of it', () => {
    const holeCrossingEdge: LinearRing = [
      [8, 4],
      [12, 4],
      [12, 6],
      [8, 6],
      [8, 4],
    ];
    const polygon: Polygon = { outer: square, holes: [holeCrossingEdge] };

    expect(isInsidePolygon(at(11, 5), polygon)).toBe(false);
    expect(isInsidePolygon(at(9, 5), polygon)).toBe(false);
    expect(isInsidePolygon(at(9, 2), polygon)).toBe(true);
  });
});

describe('boundingBoxOf', () => {
  it('returns the min/max longitude and latitude of the ring', () => {
    expect(boundingBoxOf(square)).toEqual({
      minLongitude: 0,
      maxLongitude: 10,
      minLatitude: 0,
      maxLatitude: 10,
    });
  });
});
