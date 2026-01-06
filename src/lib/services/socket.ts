import type {
    SocketStatus,
    SocketConfig,
    SocketMessage,
    MessageHandler,
    StatusHandler
} from '$lib/interfaces';

export type { SocketStatus, SocketConfig, SocketMessage };

class SocketService {
    private socket: WebSocket | null = null;
    private config: SocketConfig | null = null;
    private reconnectAttempts = 0;
    private messageHandlers: Set<MessageHandler> = new Set();
    private statusHandlers: Set<StatusHandler> = new Set();
    private status: SocketStatus = 'disconnected';

    connect(config: SocketConfig): void {
        this.config = {
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            ...config
        };

        this.establishConnection();
    }

    private establishConnection(): void {
        if (!this.config) return;

        this.updateStatus('connecting');

        try {
            this.socket = new WebSocket(this.config.url);

            this.socket.onopen = () => {
                this.reconnectAttempts = 0;
                this.updateStatus('connected');
                console.log('[Socket] Connected to', this.config?.url);
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as SocketMessage;
                    this.messageHandlers.forEach((handler) => handler(data));
                } catch (error) {
                    console.error('[Socket] Failed to parse message:', error);
                }
            };

            this.socket.onclose = () => {
                this.updateStatus('disconnected');
                console.log('[Socket] Connection closed');
                this.attemptReconnect();
            };

            this.socket.onerror = (error) => {
                this.updateStatus('error');
                console.error('[Socket] Error:', error);
            };
        } catch (error) {
            this.updateStatus('error');
            console.error('[Socket] Failed to connect:', error);
            this.attemptReconnect();
        }
    }

    private attemptReconnect(): void {
        if (!this.config) return;

        const { reconnectInterval, maxReconnectAttempts } = this.config;

        if (this.reconnectAttempts < (maxReconnectAttempts ?? 5)) {
            this.reconnectAttempts++;
            console.log(`[Socket] Reconnecting... Attempt ${this.reconnectAttempts}/${maxReconnectAttempts}`);
            setTimeout(() => this.establishConnection(), reconnectInterval);
        } else {
            console.log('[Socket] Max reconnection attempts reached');
        }
    }

    private updateStatus(status: SocketStatus): void {
        this.status = status;
        this.statusHandlers.forEach((handler) => handler(status));
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.config = null;
        this.reconnectAttempts = 0;
        this.updateStatus('disconnected');
    }

    send(message: SocketMessage): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('[Socket] Cannot send message - not connected');
        }
    }

    onMessage(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onStatusChange(handler: StatusHandler): () => void {
        this.statusHandlers.add(handler);
        return () => this.statusHandlers.delete(handler);
    }

    getStatus(): SocketStatus {
        return this.status;
    }

    isConnected(): boolean {
        return this.status === 'connected';
    }
}

// Singleton instance
export const socketService = new SocketService();
