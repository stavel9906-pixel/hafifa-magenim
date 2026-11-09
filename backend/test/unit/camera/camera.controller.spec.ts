import { Readable } from 'node:stream';
import {
  BadRequestException,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CameraController } from '../../../src/camera/camera.controller.js';
import type { MediaMtxService } from '../../../src/camera/mediamtx.service.js';
import type { WhepService } from '../../../src/camera/whep.service.js';

function fakeRequest(body: string, contentType = 'application/sdp') {
  return Object.assign(Readable.from([Buffer.from(body)]), {
    is: (type: string) => (type === contentType ? type : false),
  }) as unknown as Request;
}

function fakeResponse() {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn(() => res),
    type: vi.fn(() => res),
    send: vi.fn(() => res),
  };
  return res;
}

describe('CameraController', () => {
  const mediaMtx = { isConfigured: true };
  const whep = {
    createSession: vi.fn(),
    closeSession: vi.fn(),
  };
  const controller = new CameraController(
    mediaMtx as unknown as MediaMtxService,
    whep as unknown as WhepService,
  );

  beforeEach(() => {
    mediaMtx.isConfigured = true;
    whep.createSession.mockReset();
    whep.closeSession.mockReset();
  });

  it('reports whether the camera is enabled', () => {
    expect(controller.status()).toEqual({ enabled: true });
    mediaMtx.isConfigured = false;
    expect(controller.status()).toEqual({ enabled: false });
  });

  it('returns the SDP answer with a relative session Location', async () => {
    whep.createSession.mockResolvedValue({
      sdp: 'answer',
      sessionId: 'abc',
    });
    const res = fakeResponse();

    await controller.createSession(
      fakeRequest('offer'),
      res as unknown as Response,
    );

    expect(whep.createSession).toHaveBeenCalledWith('offer');
    expect(res.setHeader).toHaveBeenCalledWith('Location', 'whep/abc');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.type).toHaveBeenCalledWith('application/sdp');
    expect(res.send).toHaveBeenCalledWith('answer');
  });

  it('returns 503 when the camera is not configured', async () => {
    mediaMtx.isConfigured = false;

    await expect(
      controller.createSession(
        fakeRequest('offer'),
        fakeResponse() as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('rejects a body that is not SDP', async () => {
    await expect(
      controller.createSession(
        fakeRequest('{}', 'application/json'),
        fakeResponse() as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
  });

  it('rejects an empty offer', async () => {
    await expect(
      controller.createSession(
        fakeRequest('  '),
        fakeResponse() as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('closes a session', async () => {
    await controller.closeSession('abc');

    expect(whep.closeSession).toHaveBeenCalledWith('abc');
  });
});
