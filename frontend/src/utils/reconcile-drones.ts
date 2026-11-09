import type { Drone, DronesById } from '../types/drone';

export function reconcileDrones(
  current: DronesById,
  fetched: readonly Drone[],
): DronesById {
  const fetchedIds = new Set(fetched.map((drone) => drone.id));
  const newestFetched = fetched.reduce(
    (newest, drone) => (drone.createdAt > newest ? drone.createdAt : newest),
    '',
  );
  const result = new Map<string, Drone>();
  for (const drone of current.values()) {
    if (
      fetchedIds.has(drone.id) ||
      (fetched.length > 0 && drone.createdAt > newestFetched)
    ) {
      result.set(drone.id, drone);
    }
  }
  for (const drone of fetched) {
    if (!result.has(drone.id)) result.set(drone.id, drone);
  }
  return result;
}
