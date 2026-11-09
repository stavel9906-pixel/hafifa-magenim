import { spawn } from 'node:child_process';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { CameraController } from './camera.controller.js';
import { CAMERA_CONFIG, MEDIAMTX_SPAWN } from './constants/camera.constants.js';
import { MediaMtxService } from './mediamtx.service.js';
import type { CameraConfig } from './types/camera-config.js';
import type { MediaMtxSpawn } from './types/mediamtx-spawn.js';
import { PtzController } from './ptz.controller.js';
import { PtzService } from './ptz.service.js';
import { WhepService } from './whep.service.js';

const spawnMediaMtx: MediaMtxSpawn = (command, args, env) =>
  spawn(command, args, {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

@Module({
  controllers: [CameraController, PtzController],
  providers: [
    {
      provide: CAMERA_CONFIG,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): CameraConfig => ({
        host: config.get('CAMERA_HOST', { infer: true }),
        rtspPort: config.get('CAMERA_RTSP_PORT', { infer: true }),
        streamPath: config.get('CAMERA_STREAM_PATH', { infer: true }),
        username: config.get('CAMERA_USERNAME', { infer: true }),
        password: config.get('CAMERA_PASSWORD', { infer: true }),
        mediamtxPath: config.get('MEDIAMTX_PATH', { infer: true }),
        webrtcPort: config.get('MEDIAMTX_WEBRTC_PORT', { infer: true }),
      }),
    },
    { provide: MEDIAMTX_SPAWN, useValue: spawnMediaMtx },
    MediaMtxService,
    WhepService,
    PtzService,
  ],
})
export class CameraModule {}
