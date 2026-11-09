export const PTZ_DIRECTIONS = ['left', 'right'] as const;

export type PtzDirection = (typeof PTZ_DIRECTIONS)[number];
