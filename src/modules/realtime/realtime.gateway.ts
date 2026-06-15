import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger, UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client connection rejected: Token missing`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      // Store user info in client socket
      client.data.userId = payload.userId;
      client.data.email = payload.email;

      // Automatically join personal room
      await client.join(`user_${payload.userId}`);
      this.logger.log(
        `Client connected: ${payload.userId} (socket ID: ${client.id})`,
      );
    } catch (error) {
      this.logger.warn(`Client connection rejected: Invalid token`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  private extractToken(client: Socket): string | undefined {
    // Check handshakes auth or query parameters
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return (client.handshake.query?.token as string) || undefined;
  }

  @SubscribeMessage('join-workspace')
  async handleJoinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    if (!data?.workspaceId) return { error: 'workspaceId required' };

    // Check if client is authenticated
    if (!client.data.userId) {
      client.disconnect();
      return;
    }

    await client.join(`workspace_${data.workspaceId}`);
    this.logger.log(
      `User ${client.data.userId} joined room workspace_${data.workspaceId}`,
    );
    return { status: 'joined', room: `workspace_${data.workspaceId}` };
  }

  @SubscribeMessage('leave-workspace')
  async handleLeaveWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string },
  ) {
    if (!data?.workspaceId) return { error: 'workspaceId required' };
    await client.leave(`workspace_${data.workspaceId}`);
    this.logger.log(
      `User ${client.data.userId} left room workspace_${data.workspaceId}`,
    );
    return { status: 'left', room: `workspace_${data.workspaceId}` };
  }

  // Helper methods to broadcast events programmatically from other services
  sendTaskCreated(workspaceId: string, task: any) {
    this.server.to(`workspace_${workspaceId}`).emit('task.created', task);
  }

  sendTaskUpdated(workspaceId: string, task: any) {
    this.server.to(`workspace_${workspaceId}`).emit('task.updated', task);
  }

  sendTaskAssigned(workspaceId: string, task: any) {
    this.server.to(`workspace_${workspaceId}`).emit('task.assigned', task);
  }

  sendNotificationCreated(userId: string, notification: any) {
    this.server.to(`user_${userId}`).emit('notification.created', notification);
  }

  sendCommentCreated(workspaceId: string, comment: any) {
    this.server.to(`workspace_${workspaceId}`).emit('comment.created', comment);
  }

  sendMemberJoined(workspaceId: string, member: any) {
    this.server
      .to(`workspace_${workspaceId}`)
      .emit('workspace.member.joined', member);
  }
}
