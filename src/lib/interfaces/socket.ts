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

export interface IHeaderOption {
    FileType: string;
    FileVersion: string;
    ReferenceTime: string;
    ReferenceLongitude: number;
    ReferenceLatitude: number;
    Title?: string;
}

export interface ICoordOption {
    Latitude: number;
    Longitude: number;
    Altitude: number;
    Roll: number;
    Pitch: number;
    Yaw: number;
}


export interface StaticViewerEntityModel {
    // id?: string;
    Name?: string;
    Type?: string;
    Color?: string;
    Shape?: string;
    Coalition?: string;
    CallSign?: string;
    isCgf?: boolean;
    verticalEngagementRange?: number;
    engagementRange?: number;
    model?: string;
}
export interface DynamicEntityModel {
    id?: string;
    Longitude?: number;
    Latitude?: number;
    Altitude?: number;
    Roll?: number;
    Pitch?: number;
    Yaw?: number;
    Debug?: string;
    Visible?: boolean;
    time?: number;
}

export interface IPropertiesOption {
    class: any;
    attribute: any;
    basic: any;
    specific: any;
}