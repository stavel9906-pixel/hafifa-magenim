import {
  BadGatewayException,
  HttpException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CAMERA_CONFIG } from './constants/camera.constants.js';
import type { CameraConfig } from './types/camera-config.js';
import type { WhepAnswer } from './types/whep-answer.js';
import { sessionIdFromLocation, whepUrl } from './utils/mediamtx.utils.js';

@Injectable()
export class WhepService {
  private readonly logger = new Logger(WhepService.name);

  constructor(@Inject(CAMERA_CONFIG) private readonly config: CameraConfig) {}

  async createSession(offerSdp: string): Promise<WhepAnswer> {
    const response = await this.send(whepUrl(this.config), {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: offerSdp,
    });
    if (response.status !== 201) {
      const text = await response.text();
      this.logger.warn(
        `MediaMTX refused the session: ${response.status} ${text}`,
      );
      throw new HttpException(
        'Camera stream unavailable',
        response.status === 404 ? 404 : 502,
      );
    }
    return {
      sdp: await response.text(),
      sessionId: sessionIdFromLocation(response.headers.get('location')),
    };
  }

  async closeSession(sessionId: string): Promise<void> {
    await this.send(whepUrl(this.config, sessionId), { method: 'DELETE' });
  }

  private async send(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch {
      throw new BadGatewayException('Camera media server is not reachable');
    }
  }
}
