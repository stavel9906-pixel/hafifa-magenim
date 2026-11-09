import { ISRAEL_LAND_AREA } from '../../../../src/simulation/geo/israel-land-area.js';
import type { LinearRing } from '../../../../src/simulation/geo/types/polygon.js';
import { isInsidePolygon } from '../../../../src/simulation/geo/utils/polygon.utils.js';

const at = (latitude: number, longitude: number) => ({ latitude, longitude });

describe('ISRAEL_LAND_AREA', () => {
  it.each([
    ['Tel Aviv (inland)', at(32.08, 34.8)],
    ['Haifa', at(32.79, 35.0)],
    ['Western Jerusalem', at(31.78, 35.2)],
    ["Be'er Sheva", at(31.25, 34.79)],
    ['Ramon Crater', at(30.6, 34.8)],
    ['Eilat', at(29.56, 34.95)],
    ['Nazareth', at(32.7, 35.3)],
    ['Kiryat Shmona', at(33.21, 35.57)],
    ['Tiberias (inland)', at(32.79, 35.52)],
    ['Ashkelon (inland)', at(31.67, 34.6)],
  ])('includes %s', (_name, point) => {
    expect(isInsidePolygon(point, ISRAEL_LAND_AREA)).toBe(true);
  });

  it.each([
    ['Mediterranean off Tel Aviv', at(32.08, 34.7)],
    ['Mediterranean off Haifa', at(32.85, 34.95)],
    ['Gulf of Eilat', at(29.45, 34.93)],
    ['Gaza City', at(31.5, 34.45)],
    ['Ramallah', at(31.9, 35.2)],
    ['Nablus', at(32.22, 35.26)],
    ['Hebron', at(31.53, 35.1)],
    ['Sea of Galilee', at(32.82, 35.58)],
    ['Dead Sea', at(31.5, 35.48)],
    ['Golan Heights', at(33.0, 35.75)],
    ['Lebanon', at(33.3, 35.4)],
    ['Jordan', at(32.0, 35.8)],
    ['Sinai', at(30.5, 34.3)],
  ])('excludes %s', (_name, point) => {
    expect(isInsidePolygon(point, ISRAEL_LAND_AREA)).toBe(false);
  });

  it.each([
    ['outer', ISRAEL_LAND_AREA.outer],
    ...ISRAEL_LAND_AREA.holes.map((ring, i) => [`hole ${i}`, ring] as const),
  ] as [string, LinearRing][])('%s ring is closed', (_name, ring) => {
    expect(ring[0]).toEqual(ring[ring.length - 1]);
  });
});
