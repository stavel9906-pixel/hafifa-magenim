import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MediaMtxService } from './mediamtx.service.js';
import { PtzService } from './ptz.service.js';
import { PTZ_DIRECTIONS, type PtzDirection } from './types/ptz-direction.js';

@Controller('camera/ptz')
export class PtzController {
  constructor(
    private readonly mediaMtx: MediaMtxService,
    private readonly ptz: PtzService,
  ) {}

  @Post('move/:direction')
  @HttpCode(204)
  async move(@Param('direction') direction: string): Promise<void> {
    this.assertEnabled();
    if (!PTZ_DIRECTIONS.includes(direction as PtzDirection)) {
      throw new BadRequestException(
        `direction must be one of: ${PTZ_DIRECTIONS.join(', ')}`,
      );
    }
    await this.ptz.move(direction as PtzDirection);
  }

  @Post('stop')
  @HttpCode(204)
  async stop(): Promise<void> {
    this.assertEnabled();
    await this.ptz.stop();
  }

  private assertEnabled(): void {
    if (!this.mediaMtx.isConfigured) {
      throw new ServiceUnavailableException('Camera is not configured');
    }
  }
}
