import {
  BadGatewayException,
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
} from '@nestjs/common';
import {
  CAMERA_CONFIG,
  ONVIF_PTZ_PATH,
  ONVIF_TIMEOUT_MS,
  PTZ_AUTO_STOP_MS,
  PTZ_SPEED,
} from './constants/camera.constants.js';
import type { CameraConfig } from './types/camera-config.js';
import type { PtzDirection } from './types/ptz-direction.js';
import {
  buildSoapEnvelope,
  continuousMoveBody,
  stopBody,
} from './utils/onvif.utils.js';

@Injectable()
export class PtzService implements OnModuleDestroy {
  private readonly logger = new Logger(PtzService.name);
  private autoStopTimer: NodeJS.Timeout | undefined;

  constructor(@Inject(CAMERA_CONFIG) private readonly config: CameraConfig) {}

  async move(direction: PtzDirection): Promise<void> {
    const speed = direction === 'left' ? -PTZ_SPEED : PTZ_SPEED;
    await this.send(continuousMoveBody(speed));
    this.armAutoStop();
  }

  async stop(): Promise<void> {
    clearTimeout(this.autoStopTimer);
    this.autoStopTimer = undefined;
    await this.send(stopBody());
  }

  onModuleDestroy(): void {
    clearTimeout(this.autoStopTimer);
  }

  private armAutoStop(): void {
    clearTimeout(this.autoStopTimer);
    this.autoStopTimer = setTimeout(() => {
      this.autoStopTimer = undefined;
      this.logger.warn('No PTZ command received in time; stopping the camera');
      this.send(stopBody()).catch(() => {});
    }, PTZ_AUTO_STOP_MS);
  }

  private async send(body: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`http://${this.config.host}${ONVIF_PTZ_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
        body: buildSoapEnvelope(body, this.config),
        signal: AbortSignal.timeout(ONVIF_TIMEOUT_MS),
      });
    } catch {
      this.logger.warn('Camera did not answer the PTZ command');
      throw new BadGatewayException('Camera is not reachable');
    }
    if (!response.ok) {
      this.logger.warn(`Camera rejected the PTZ command: ${response.status}`);
      throw new BadGatewayException('Camera rejected the PTZ command');
    }
  }
}
