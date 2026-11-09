export function parseRemovedDroneIds(payload: unknown): string[] | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const { ids } = payload as Record<string, unknown>;
  return Array.isArray(ids) && ids.every((id) => typeof id === 'string')
    ? ids
    : null;
}
