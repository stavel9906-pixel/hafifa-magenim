import { Controller, Get } from '@nestjs/common';
import { DronesService } from './drones.service.js';
import { DroneDto } from './dto/drone.dto.js';

@Controller('drones')
export class DronesController {
  constructor(private readonly dronesService: DronesService) {}

  /** GET /api/drones — every persisted drone, oldest first. */
  @Get()
  async findAll(): Promise<DroneDto[]> {
    const drones = await this.dronesService.findAll();
    return drones.map((drone) => DroneDto.fromEntity(drone));
  }
}
