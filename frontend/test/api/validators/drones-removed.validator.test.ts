import { describe, expect, it } from 'vitest';
import { parseRemovedDroneIds } from '../../../src/api/validators/drones-removed.validator';

describe('parseRemovedDroneIds', () => {
  it('returns the ids', () => {
    expect(parseRemovedDroneIds({ ids: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  it.each([null, 'x', {}, { ids: 'a' }, { ids: [1] }])(
    'rejects %j',
    (payload) => {
      expect(parseRemovedDroneIds(payload)).toBeNull();
    },
  );
});
