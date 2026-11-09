import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { MediaMtxService } from '../../../src/camera/mediamtx.service.js';
import { PtzController } from '../../../src/camera/ptz.controller.js';
import type { PtzService } from '../../../src/camera/ptz.service.js';

describe('PtzController', () => {
  const mediaMtx = { isConfigured: true };
  const ptz = { move: vi.fn(), stop: vi.fn() };
  const controller = new PtzController(
    mediaMtx as unknown as MediaMtxService,
    ptz as unknown as PtzService,
  );

  beforeEach(() => {
    mediaMtx.isConfigured = true;
    ptz.move.mockReset();
    ptz.stop.mockReset();
  });

  it.each(['left', 'right'])('moves %s', async (direction) => {
    await controller.move(direction);

    expect(ptz.move).toHaveBeenCalledWith(direction);
  });

  it('rejects an unknown direction', async () => {
    await expect(controller.move('up')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(ptz.move).not.toHaveBeenCalled();
  });

  it('stops', async () => {
    await controller.stop();

    expect(ptz.stop).toHaveBeenCalled();
  });

  it('returns 503 when the camera is not configured', async () => {
    mediaMtx.isConfigured = false;

    await expect(controller.move('left')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(controller.stop()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
