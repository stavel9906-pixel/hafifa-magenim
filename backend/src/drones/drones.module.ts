import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone } from './types/drone.entity.js';
import { DronesController } from './drones.controller.js';
import { DronesService } from './drones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Drone])],
  controllers: [DronesController],
  providers: [DronesService],
  exports: [DronesService],
})
export class DronesModule {}
