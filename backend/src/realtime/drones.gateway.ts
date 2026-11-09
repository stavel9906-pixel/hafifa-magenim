import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { DroneDto } from '../drones/dto/drone.dto.js';
import { DRONE_CREATED_EVENT } from './drone-events.js';

@WebSocketGateway()
export class DronesGateway
  implements
    OnGatewayInit<Server>,
    OnGatewayConnection<Socket>,
    OnGatewayDisconnect<Socket>
{
  private readonly logger = new Logger(DronesGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  afterInit(server: Server): void {
    server.engine.on('connection_error', (error: Error & { code?: number }) => {
      this.logger.warn(
        `WebSocket connection error (code ${error.code}): ${error.message}`,
      );
    });
  }

  handleConnection(client: Socket): void {
    this.logger.log(
      `Client ${client.id} connected (${this.connectedClients()} connected)`,
    );
  }

  handleDisconnect(client: Socket, reason?: string): void {
    this.logger.log(
      `Client ${client.id} disconnected: ${reason ?? 'unknown reason'} (${this.connectedClients()} connected)`,
    );
  }

  broadcastDroneCreated(drone: DroneDto): void {
    this.server.emit(DRONE_CREATED_EVENT, drone);
  }

  private connectedClients(): number {
    return this.server.sockets.sockets.size;
  }
}
