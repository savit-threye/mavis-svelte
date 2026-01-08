export interface SOAHistoryDataRecord {
    id: string;
    // Static properties
    Name?: string;
    Type?: string;
    Color?: string;
    Shape?: string;
    Coalition?: string;
    CallSign?: string;
    isCgf?: boolean;
    engagementRange?: number;
    verticalEngagementRange?: number;
    // Dynamic properties
    Longitude?: number;
    Latitude?: number;
    Altitude?: number;
    Roll?: number;
    Pitch?: number;
    Yaw?: number;
    Visible?: boolean;
    Debug?: string;
    time?: number;
}