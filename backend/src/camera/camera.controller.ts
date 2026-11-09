import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MAX_SDP_BYTES } from './constants/camera.constants.js';
import { MediaMtxService } from './mediamtx.service.js';
import { readTextBody } from './utils/read-text-body.js';
import { WhepService } from './whep.service.js';

export interface CameraStatusResponse {
  enabled: boolean;
}

@Controller('camera')
export class CameraController {
  constructor(
    private readonly mediaMtx: MediaMtxService,
    private readonly whep: WhepService,
  ) {}

  @Get()
  status(): CameraStatusResponse {
    return { enabled: this.mediaMtx.isConfigured };
  }

  @Post('whep')
  async createSession(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.assertEnabled();
    if (!req.is('application/sdp')) {
      throw new UnsupportedMediaTypeException('Expected application/sdp');
    }

    let offer: string;
    try {
      offer = await readTextBody(req, MAX_SDP_BYTES);
    } catch {
      throw new BadRequestException('SDP offer is too large');
    }
    if (!offer.trim()) {
      throw new BadRequestException('SDP offer is empty');
    }

    const answer = await this.whep.createSession(offer);
    if (answer.sessionId) {
      res.setHeader('Location', `whep/${encodeURIComponent(answer.sessionId)}`);
      res.setHeader('Access-Control-Expose-Headers', 'Location');
    }
    res.status(201).type('application/sdp').send(answer.sdp);
  }

  @Delete('whep/:sessionId')
  @HttpCode(204)
  async closeSession(@Param('sessionId') sessionId: string): Promise<void> {
    this.assertEnabled();
    await this.whep.closeSession(sessionId);
  }

  private assertEnabled(): void {
    if (!this.mediaMtx.isConfigured) {
      throw new ServiceUnavailableException('Camera is not configured');
    }
  }
}
