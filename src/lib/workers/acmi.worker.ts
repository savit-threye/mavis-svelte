/**
 * ACMI Parser Web Worker
 * Handles ACMI data parsing off the main thread for better performance
 */

import type { SOAHistoryDataRecord } from "../interfaces/media-player";
import { CoordProperties } from "../utils/coordParser";



// Types for worker communication
interface ParseRequest {
    type: 'parse';
    data: string;
    header: any;
    batchTimestamp: number;
}

interface ParseResponse {
    type: 'parsed';
    frames: SOAHistoryDataRecord[];
    timestamp: number;
    error?: string;
}

// Worker message handler
self.onmessage = function (event: MessageEvent<ParseRequest>) {
    const { type, data, header, batchTimestamp } = event.data;

    if (type === 'parse') {
        try {
            const frames = parseACMIChunk(data, header);

            const response: ParseResponse = {
                type: 'parsed',
                frames,
                timestamp: batchTimestamp
            };

            self.postMessage(response);
        } catch (error) {
            const errorResponse: ParseResponse = {
                type: 'parsed',
                frames: [],
                timestamp: batchTimestamp,
                error: error instanceof Error ? error.message : 'Unknown parsing error'
            };

            self.postMessage(errorResponse);
        }
    }
};

/**
 * Parse ACMI chunk into structured frame data
 */
function parseACMIChunk(dataString: string, header: any): SOAHistoryDataRecord[] {
    const frames: SOAHistoryDataRecord[] = [];
    const lines = dataString.split('\n');

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines and timestamp lines (handled in main thread)
        if (!trimmedLine || trimmedLine.charCodeAt(0) === 35) {
            continue;
        }

        try {
            const frameData = convertToEntity(trimmedLine, header);
            const cleanEntityId = getCleanEntityId(frameData.id!);
            if (frameData.id.charCodeAt(0) === 45) frameData.visible = false; // Mark entities starting with '-' as invisible

            if (cleanEntityId && frameData) {
                frames.push({
                    id: cleanEntityId,
                    ...frameData
                });
            }
        } catch (error) {
            console.warn('[ACMI Worker] Failed to parse line:', trimmedLine, error);
        }
    }

    return frames;
}

/**
 * Convert ACMI line to entity data (moved from main thread)
 */
function convertToEntity(line: string, header: any): any {
    // This is a simplified version - you should move your existing
    // convertToEntity logic from utils/merger.ts here
    const parts = line.split(',');
    if (parts.length < 2) return null;
    const entityId = parts.shift() as string;
    const properties: any = { id: entityId };
    let TParesent = false

    // Parse key=value pairs
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const equalIndex = part.indexOf('=');
        if (equalIndex === -1) continue;

        const key = part.substring(0, equalIndex).trim();
        const value = part.substring(equalIndex + 1).trim();

        // Handle coordinate conversion
        if (key === 'T') {
            TParesent = true;

            const coords = CoordProperties.getInstance().setProperties(
                entityId,
                value.split("|"),
                header
            );
            if (coords) {
                properties.Longitude = coords.Longitude;
                properties.Latitude = coords.Latitude;
                properties.Altitude = coords.Altitude;
                properties.Roll = coords.Roll;
                properties.Pitch = coords.Pitch;
                properties.Yaw = coords.Yaw;
            }
        } else if (key === 'Yaw') {
            properties.Yaw = parseFloat(value);
        } else if (key === 'Pitch') {
            properties.Pitch = parseFloat(value);
        } else if (key === 'Roll') {
            properties.Roll = parseFloat(value);
        } else if (key === 'Visible') {
            properties.Visible = value === '1' || value.toLowerCase() === 'true';
        } else {
            properties[key] = value;
        }
    }
    if (!TParesent) {
        const coords = CoordProperties.getInstance().setProperties(
            entityId,
            ["", "", "", "", "", ""],
            header
        );
        properties.Altitude = coords.Altitude;
        properties.Longitude = coords.Longitude;
        properties.Latitude = coords.Latitude;
        properties.Roll = coords.Roll;
        properties.Pitch = coords.Pitch;
        properties.Yaw = coords.Yaw;
    }
    return properties;
}

/**
 * Parse coordinates from ACMI format
 */
function parseCoordinates(coordString: string, header: any): { longitude: number; latitude: number; altitude: number } | null {
    const parts = coordString.split('|');
    if (parts.length < 3) return null;

    const longitude = parseFloat(parts[0]) + (header?.ReferenceLongitude || 0);
    const latitude = parseFloat(parts[1]) + (header?.ReferenceLatitude || 0);
    const altitude = parseFloat(parts[2]);

    return { longitude, latitude, altitude };
}

/**
 * Clean entity ID (remove unwanted characters)
 */
function getCleanEntityId(id: string): string {
    let result = '';
    for (let i = 0; i < id.length; i++) {
        const c = id.charCodeAt(i);
        if (c !== 45 && c !== 13) { // '-' and '\r'
            result += id[i];
        }
    }
    return result;
}

// Export types for TypeScript
export type { ParseRequest, ParseResponse };
