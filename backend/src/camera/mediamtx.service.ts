import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import {
  CAMERA_CONFIG,
  MEDIAMTX_CONFIG_FILE,
  MEDIAMTX_RESTART_DELAY_MS,
  MEDIAMTX_SPAWN,
} from './constants/camera.constants.js';
import type { CameraConfig } from './types/camera-config.js';
import type { MediaMtxProcess, MediaMtxSpawn } from './types/mediamtx-spawn.js';
import { buildMediaMtxEnv } from './utils/mediamtx.utils.js';
import { redactSecrets } from './utils/rtsp.utils.js';

@Injectable()
export class MediaMtxService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(MediaMtxService.name);

  private process: MediaMtxProcess | undefined;
  private restartTimer: NodeJS.Timeout | undefined;
  private stopped = false;

  constructor(
    @Inject(CAMERA_CONFIG) private readonly config: CameraConfig,
    @Inject(MEDIAMTX_SPAWN) private readonly spawn: MediaMtxSpawn,
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.config.host);
  }

  get isRunning(): boolean {
    return this.process !== undefined;
  }

  onApplicationBootstrap(): void {
    if (this.isConfigured) {
      this.start();
    } else {
      this.logger.log('Camera is disabled (CAMERA_HOST is empty)');
    }
  }

  onModuleDestroy(): void {
    this.stopped = true;
    clearTimeout(this.restartTimer);
    const child = this.process;
    this.process = undefined;
    child?.kill();
  }

  private start(): void {
    const child = this.spawn(this.config.mediamtxPath, [MEDIAMTX_CONFIG_FILE], {
      ...process.env,
      ...buildMediaMtxEnv(this.config),
    });
    this.process = child;
    this.logger.log(
      `MediaMTX started for camera ${this.config.host}/${this.config.streamPath}`,
    );

    const log = (chunk: Buffer) => {
      for (const line of chunk.toString().split(/\r?\n/).filter(Boolean)) {
        const message = redactSecrets(line, this.config);
        if (/ (ERR|WAR) /.test(line)) {
          this.logger.warn(message);
        } else {
          this.logger.debug(message);
        }
      }
    };
    child.stdout.on('data', log);
    child.stderr.on('data', log);

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        this.logger.error(
          `MediaMTX not found at "${this.config.mediamtxPath}". Install it (winget install bluenviron.mediamtx) or set MEDIAMTX_PATH to the full path of mediamtx.exe`,
        );
        this.process = undefined;
        return;
      }
      this.logger.error(`Could not run MediaMTX: ${error.message}`);
      this.handleExit(child);
    });
    child.on('close', (code) => {
      if (this.process === child) {
        this.logger.warn(`MediaMTX exited with code ${code}`);
      }
      this.handleExit(child);
    });
  }

  private handleExit(child: MediaMtxProcess): void {
    if (this.process !== child) return;
    this.process = undefined;
    if (this.stopped) return;
    this.restartTimer = setTimeout(
      () => this.start(),
      MEDIAMTX_RESTART_DELAY_MS,
    );
  }
}
