import type { DronesById } from '../types/drone';

export function removeDrones(
  current: DronesById,
  ids: readonly string[],
): DronesById {
  if (!ids.some((id) => current.has(id))) {
    return current;
  }
  const result = new Map(current);
  for (const id of ids) result.delete(id);
  return result;
}
