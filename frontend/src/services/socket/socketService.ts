import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(token: string, workspaceId?: string | null) {
    if (this.socket?.connected) {
      // If workspace changed, reconnect with updated handshake options
      if (this.socket.io.opts.query && (this.socket.io.opts.query as any).workspaceId !== workspaceId) {
        this.disconnect();
      } else {
        return;
      }
    }

    const baseUrl = (import.meta.env.VITE_WS_URL as string) || 'http://localhost:3000';
    
    this.socket = io(baseUrl, {
      auth: { token },
      query: workspaceId ? { workspaceId } : {},
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to WS gateway');
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`[SocketService] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketService] Connection Error:', error);
    });

    // Re-bind all active listeners on reconnect
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[SocketService] Socket disconnected manually');
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[SocketService] Cannot emit event "${event}", socket not connected`);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
