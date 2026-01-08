import type { IHeaderOption, SOAHistoryDataRecord, StaticViewerEntityModel } from '$lib/interfaces';
import { parseHeader } from '$lib/utils';
import { cachedMeshFinder } from '$lib/utils/cachedMeshFinder';
import { convertToEntity } from '$lib/utils/merger';
import { io, Socket } from 'socket.io-client';
import { entitiesStore, type EntityModel } from '$lib/stores';

export interface SocketOptions {
    url: string;
    streamType: 'stream' | 'playback';
    simDetails?: {
        simIp: string;
        simPort: number;
    };
    onConnectionError?: (error: string) => void;
    onConnectionSuccess?: () => void;
    onHeader?: (header: any) => void;
    onData?: (data: string) => void;
}

let socket: Socket | null = null;

// Initialize Web Worker for ACMI parsing
let acmiWorker: Worker | null = null;
let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
let dataTimeout: ReturnType<typeof setTimeout> | null = null;
let isConnected = false;
let hasReceivedData = false;
let currentHeader: any = null;
let startTimeSet: boolean = false;

export function connectToSocketServer(options: SocketOptions) {
    const {
        url,
        streamType,
        simDetails,
        onConnectionError,
        onConnectionSuccess,
        onHeader,
        onData
    } = options;

    try {

        acmiWorker = new Worker(new URL('../workers/acmi.worker.ts', import.meta.url), {
            type: 'module'
        });

        // Handle worker messages
        acmiWorker.onmessage = (event) => {
            const { type, frames, timestamp, error } = event.data;

            if (type === 'parsed' && frames) {
                if (error) {
                    console.error('[Socket] ACMI parsing error:', error);
                    onConnectionError?.(`Data parsing error: ${error}`);
                    return;
                }



                // Update viewer entities with new entities found in this batch
                updateViewerEntitiesFromFrames(frames);
            }
        };

        acmiWorker.onerror = (error) => {
            console.error('[Socket] Worker error:', error);
            onConnectionError?.('Data processing error. Please check console for details.');
        };

    } catch (error) {
        console.error('[Socket] Failed to create worker:', error);
        onConnectionError?.('Failed to initialize data processor. Browser may not support Web Workers.');
    }

    const onConnect = () => {
        isConnected = true;
        console.log('[Socket] Connected to server');

        // Clear connection timeout
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
        }

        try {
            socket?.emit('stream_type', streamType);

            if (streamType === 'playback') {
                socket?.emit('file', 'ebit.txt');
            } else {
                socket?.emit('start_simulation', simDetails);

                // Set timeout for receiving data from simulator
                dataTimeout = setTimeout(() => {
                    if (!hasReceivedData) {
                        console.error('[Socket] Data timeout - no data received from simulator');
                        onConnectionError?.(
                            `Failed to receive data from simulator at ${simDetails?.simIp}:${simDetails?.simPort}. Please verify simulator is running.`
                        );
                        socket?.disconnect();
                    }
                }, 20000);
            }
        } catch (error) {
            console.error('[Socket] Error during connection setup:', error);
            onConnectionError?.('Failed to initialize connection. Please try again.');
        }
    };

    const onDisconnect = (reason: string) => {
        isConnected = false;
        console.log('[Socket] Disconnected:', reason);

        if (reason === 'io server disconnect') {
            onConnectionError?.('Server disconnected. Please try reconnecting.');
        } else if (reason === 'transport close') {
            onConnectionError?.('Connection lost. Please check your network.');
        }
    };

    const handleHeader = (headerData: any) => {
        try {

            const parsedHeader = typeof headerData === 'string' ? parseHeader(headerData) : headerData;

            if (!parsedHeader) {
                console.error('[Socket] Failed to parse header');
                onConnectionError?.('Invalid data format received from server.');
                return;
            }

            currentHeader = parsedHeader;

            // Extract scenario ID from header title
            if (parsedHeader.Title) {
                const parts = parsedHeader.Title.split(':');
                if (parts.length >= 2) {
                    const scenarioName = parts[0].trim();

                    // set scenarioname to project title
                    document.title = scenarioName;

                }
            }

            hasReceivedData = true;

            // Clear data timeout
            if (dataTimeout) {
                clearTimeout(dataTimeout);
                dataTimeout = null;
            }

            onHeader?.(headerData);
            onConnectionSuccess?.();

            // Request data after header
            setTimeout(() => socket?.emit('data'), 3000);
        } catch (error) {
            console.error('[Socket] Error processing header:', error);
            onConnectionError?.('Error processing scenario data.');
        }
    };

    // Set of properties to skip when creating static entity data
    const SKIP_DYNAMIC_PROPS = new Set(['id', 'Latitude', 'Longitude', 'Altitude', 'Roll', 'Pitch', 'Yaw', 'Visible', 'time', 'Debug']);

    function updateViewerEntitiesFromFrames(frames: any[]) {
        const viewerEntities = entitiesStore.getMap();
        let hasNewEntities = false;

        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const cleanEntityId = frame.id;

            // Skip if entity already exists
            if (viewerEntities.has(cleanEntityId)) continue;

            // Build static entity data directly
            const viewerEntityData: any = { id: cleanEntityId };

            for (const key in frame) {
                if (!SKIP_DYNAMIC_PROPS.has(key) && frame[key] !== undefined) {
                    viewerEntityData[key] = frame[key];
                }
            }

            // Get mesh and model path
            const mesh: any = cachedMeshFinder(viewerEntityData.Type ?? '', viewerEntityData.Name ?? '');
            if (mesh?.Shape?.[0]) {
                const rawPath = mesh.Shape[0].replace(".obj", ".glb");
                viewerEntityData.model = rawPath.charCodeAt(0) === 47 ? rawPath : `/${rawPath}`;
            } else {
                viewerEntityData.model = "";
            }

            // Add directly to the store's map (silent update)
            entitiesStore.setEntitySilent(cleanEntityId, viewerEntityData as EntityModel);
            hasNewEntities = true;
        }

        // Single notification after all entities are added
        if (hasNewEntities) {
            entitiesStore.notify();
        }
    }

    const handleData = (dataString: string) => {
        try {
            let batchTimestampSeconds: number = 0;
            let batchTimestampMs: number | null = null;


            const lines = dataString.split('\n');

            if (lines[0].charCodeAt(0) === 35) {
                const timeParsed = parseTimeTrunc(lines[0]);
                batchTimestampSeconds = timeParsed.seconds;
                batchTimestampMs = timeParsed.ms;
            }

            if (batchTimestampMs == null) return;

            // Calculate full timestamp in milliseconds
            const offsetTimestamp = (batchTimestampSeconds * 1000) + (batchTimestampMs * 10);
            const referenceTime = new Date(currentHeader.ReferenceTime).getTime();
            const fullTimestamp = referenceTime + offsetTimestamp;

            if (!startTimeSet) {

                startTimeSet = true;
                hasReceivedData = true;

                // Clear data timeout
                if (dataTimeout) {
                    clearTimeout(dataTimeout);
                    dataTimeout = null;
                }

                // Call success callback on first data
                onConnectionSuccess?.();
            }

            if (acmiWorker) {
                // Use Web Worker for parsing
                acmiWorker.postMessage({
                    type: 'parse',
                    data: dataString,
                    header: currentHeader,
                    batchTimestamp: fullTimestamp
                });
            } else {
                // Fallback to main thread parsing
                console.warn('[Socket] Using main thread parsing - performance may be impacted');

                const frames: SOAHistoryDataRecord[] = [];

                for (const trimmedLine of lines) {
                    if (trimmedLine.charCodeAt(0) === 35) continue;

                    const properties = convertToEntity(trimmedLine, currentHeader);
                    const cleanEntityId = getCleanEntityId(properties.id!);

                    if (!cleanEntityId || !properties) continue;

                    frames.push({
                        id: cleanEntityId,
                        ...properties
                    });
                }

                updateViewerEntitiesFromFrames(frames);
            }
        } catch (error) {
            console.error('[Socket] Error processing data:', error);
            onConnectionError?.('Error processing incoming data. Stream may be unstable.');
        }
    };

    function getCleanEntityId(id: string) {
        let result = '';
        for (let i = 0; i < id.length; i++) {
            const c = id.charCodeAt(i);
            if (c !== 45 && c !== 13) { // '-' and '\r'
                result += id[i];
            }
        }
        return result;
    }



    function parseTimeTrunc(line: string) {
        let i = 1, num = 0, frac = 0, fracDigits = 0, dot = false;
        while (i < line.length) {
            const ch = line.charCodeAt(i);
            if (ch === 46) { // '.'
                dot = true;
            } else if (ch >= 48 && ch <= 57) {
                const digit = ch - 48;
                if (!dot) {
                    num = num * 10 + digit;
                } else if (fracDigits < 2) {
                    frac = frac * 10 + digit;
                    fracDigits++;
                } else {
                    break;
                }
            } else {
                break;
            }
            i++;
        }
        if (fracDigits === 1) frac *= 10;
        return { seconds: num, ms: frac };
    }

    const onError = (error: any) => {
        console.error('[Socket] Socket error:', error);
        const errorMessage = error?.message || 'Unknown connection error';
        onConnectionError?.(`Connection error: ${errorMessage}`);
    };

    const onConnectError = (error: any) => {
        console.error('[Socket] Connection error:', error);

        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
        }

        if (dataTimeout) {
            clearTimeout(dataTimeout);
            dataTimeout = null;
        }

        let errorMessage = 'Failed to connect to server. ';

        if (error.message?.includes('timeout')) {
            errorMessage += 'Connection timed out.';
        } else if (error.message?.includes('ECONNREFUSED')) {
            errorMessage += 'Server refused connection.';
        } else {
            errorMessage += 'Please check your connection settings.';
        }

        onConnectionError?.(errorMessage);
    };

    // Create socket connection
    if (!socket) {
        try {
            socket = io(url, {
                reconnection: true,
                reconnectionAttempts: 3,
                reconnectionDelay: 2000,
                timeout: 10000
            });

            // Set connection timeout
            connectionTimeout = setTimeout(() => {
                if (!isConnected) {
                    console.error('[Socket] Connection timeout');
                    onConnectionError?.(`Connection timeout. Could not reach server at ${url}`);
                    socket?.disconnect();
                }
            }, 10000);

            socket.on('connect', onConnect);
            socket.on('disconnect', onDisconnect);
            socket.on('connect_error', onConnectError);
            socket.on('file_ready', () => socket?.emit('header'));
            socket.on('header', handleHeader);
            socket.on('data', handleData);
            socket.on('error', onError);
        } catch (error) {
            console.error('[Socket] Failed to create socket:', error);
            onConnectionError?.('Failed to initialize socket connection.');
        }
    }

    return {
        disconnect: () => {
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }
            if (dataTimeout) {
                clearTimeout(dataTimeout);
                dataTimeout = null;
            }
            socket?.disconnect();
            socket = null;
            isConnected = false;
            hasReceivedData = false;
        },
        isConnected: () => socket?.connected ?? false,
        emit: (event: string, payload?: any) => {
            if (!socket?.connected) {
                console.warn('[Socket] Cannot emit - not connected');
                return false;
            }
            socket.emit(event, payload);
            return true;
        },
        on: (event: string, callback: (data: any) => void) => {
            socket?.on(event, callback);
            return () => socket?.off(event, callback);
        }
    };
}
