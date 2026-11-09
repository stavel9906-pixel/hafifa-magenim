import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { DronesService } from '../drones/drones.service.js';
import { DroneDto } from '../drones/dto/drone.dto.js';
import type { Drone } from '../drones/types/drone.entity.js';
import { DronesGateway } from '../realtime/drones.gateway.js';
import { CoordinateGenerator } from './coordinate-generator.js';

@Injectable()
export class DroneSimulationService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(DroneSimulationService.name);
  private readonly intervalMs: number;
  private readonly enabled: boolean;
  private readonly maxDrones: number;

  private running = false;
  private timer: NodeJS.Timeout | undefined;
  private currentTick: Promise<void> | undefined;

  constructor(
    private readonly coordinateGenerator: CoordinateGenerator,
    private readonly dronesService: DronesService,
    private readonly dronesGateway: DronesGateway,
    config: ConfigService<Env, true>,
  ) {
    this.intervalMs = config.get('SIMULATION_INTERVAL_MS', { infer: true });
    this.enabled = config.get('SIMULATION_ENABLED', { infer: true });
    this.maxDrones = config.get('DRONES_MAX_COUNT', { infer: true });
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.enabled) {
      await this.removeOldDrones();
      this.start();
    } else {
      this.logger.log(
        'Drone simulation is disabled (SIMULATION_ENABLED=false)',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.stop();
    await this.currentTick;
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) {
      this.logger.warn('Drone simulation is already running; ignoring start()');
      return;
    }
    this.running = true;
    this.logger.log(
      `Drone simulation started: one drone every ${this.intervalMs} ms`,
    );
    this.scheduleNextTick(this.intervalMs);
  }

  stop(): void {
    if (!this.running) {
      return;
    }
    this.running = false;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.logger.log('Drone simulation stopped');
  }

  private scheduleNextTick(delayMs: number): void {
    this.timer = setTimeout(() => {
      this.currentTick = this.tick();
    }, delayMs);
  }

  private async tick(): Promise<void> {
    const startedAt = Date.now();
    try {
      const drone = await this.createDrone();
      this.logger.debug(
        `Drone ${drone.id} created at (${drone.latitude}, ${drone.longitude})`,
      );
      this.broadcast(drone);
      await this.removeOldDrones();
    } catch (error) {
      this.logger.error(
        'Failed to create drone',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      if (this.running) {
        const elapsedMs = Date.now() - startedAt;
        this.scheduleNextTick(Math.max(0, this.intervalMs - elapsedMs));
      }
    }
  }

  private createDrone(): Promise<Drone> {
    const coordinates = this.coordinateGenerator.generate();
    return this.dronesService.create(coordinates);
  }

  private async removeOldDrones(): Promise<void> {
    let ids: string[];
    try {
      ids = await this.dronesService.deleteAllButNewest(this.maxDrones);
    } catch (error) {
      this.logger.error(
        'Failed to remove old drones',
        error instanceof Error ? error.stack : String(error),
      );
      return;
    }
    if (ids.length === 0) return;
    this.logger.debug(`Removed ${ids.length} old drone(s)`);
    try {
      this.dronesGateway.broadcastDronesRemoved(ids);
    } catch (error) {
      this.logger.error(
        'Old drones were removed but could not be broadcast',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private broadcast(drone: Drone): void {
    try {
      this.dronesGateway.broadcastDroneCreated(DroneDto.fromEntity(drone));
    } catch (error) {
      this.logger.error(
        `Drone ${drone.id} was saved but could not be broadcast`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
