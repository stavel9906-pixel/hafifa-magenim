import type { Drone, DronesById } from '../types/drone';

export function mergeDrones(
  current: DronesById,
  incoming: readonly Drone[],
): DronesById {
  const newDrones = incoming.filter((drone) => !current.has(drone.id));
  if (newDrones.length === 0) {
    return current;
  }
  const merged = new Map(current);
  for (const drone of newDrones) {
    merged.set(drone.id, drone);
  }
  return merged;
}
