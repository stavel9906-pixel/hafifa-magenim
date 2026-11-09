export interface Drone {
  id: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export type DronesById = ReadonlyMap<string, Drone>;
