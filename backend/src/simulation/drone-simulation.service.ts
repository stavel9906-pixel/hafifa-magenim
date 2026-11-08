import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { DronesService } from '../drones/drones.service.js';
import type { Drone } from '../drones/types/drone.entity.js';
import { CoordinateGenerator } from './coordinate-generator.js';


@Injectable()
export class DroneSimulationService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(DroneSimulationService.name);
  private readonly intervalMs: number;
  private readonly enabled: boolean;

  private running = false;
  private timer: NodeJS.Timeout | undefined;
  private currentTick: Promise<void> | undefined;

  constructor(
    private readonly coordinateGenerator: CoordinateGenerator,
    private readonly dronesService: DronesService,
    config: ConfigService<Env, true>,
  ) {
    this.intervalMs = config.get('SIMULATION_INTERVAL_MS', { infer: true });
    this.enabled = config.get('SIMULATION_ENABLED', { infer: true });
  }

  onApplicationBootstrap(): void {
    if (this.enabled) {
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
}
