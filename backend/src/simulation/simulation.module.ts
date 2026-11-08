import { Module } from '@nestjs/common';
import { DronesModule } from '../drones/drones.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { CoordinateGenerator } from './coordinate-generator.js';
import { DroneSimulationService } from './drone-simulation.service.js';
import { ISRAEL_LAND_AREA } from './geo/israel-land-area.js';

@Module({
  imports: [DronesModule, RealtimeModule],
  providers: [
    {
      provide: CoordinateGenerator,
      useFactory: () => new CoordinateGenerator(ISRAEL_LAND_AREA, Math.random),
    },
    DroneSimulationService,
  ],
})
export class SimulationModule {}
