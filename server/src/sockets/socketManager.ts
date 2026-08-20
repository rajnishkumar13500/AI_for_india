import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class SocketManager {
  private static instance: SocketManager;
  private io: SocketIOServer | null = null;

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public init(httpServer: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      console.log(`[Socket.IO] Client connected: ${socket.id}`);

      socket.on('join:merchant', (merchantId: string) => {
        socket.join(`merchant:${merchantId}`);
        console.log(`[Socket.IO] Client ${socket.id} joined merchant:${merchantId}`);
      });

      socket.on('disconnect', () => {
        console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  public emitEvent(event: string, data: any, merchantId?: string): void {
    if (!this.io) return;

    if (merchantId) {
      this.io.to(`merchant:${merchantId}`).emit(event, data);
      this.io.emit(event, data); // also broadcast globally for simple localhost testing
    } else {
      this.io.emit(event, data);
    }
  }
}

export const socketManager = SocketManager.getInstance();
