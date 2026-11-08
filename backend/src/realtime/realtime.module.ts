import { Module } from '@nestjs/common';
import { DronesGateway } from './drones.gateway.js';

@Module({
  providers: [DronesGateway],
  exports: [DronesGateway],
})
export class RealtimeModule {}
