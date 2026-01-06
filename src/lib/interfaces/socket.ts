export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface SocketConfig {
    url: string;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

export interface SocketMessage {
    type: string;
    payload: unknown;
}

export type MessageHandler = (data: SocketMessage) => void;
export type StatusHandler = (status: SocketStatus) => void;
