import type { ChildProcessByStdio } from 'node:child_process';
import type { Readable } from 'node:stream';

export type MediaMtxProcess = ChildProcessByStdio<null, Readable, Readable>;

export type MediaMtxSpawn = (
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
) => MediaMtxProcess;
