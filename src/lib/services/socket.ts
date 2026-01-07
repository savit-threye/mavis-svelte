import { parseHeader } from '$lib/utils';
import { io, Socket } from 'socket.io-client';

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
let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
let dataTimeout: ReturnType<typeof setTimeout> | null = null;
let isConnected = false;
let hasReceivedData = false;
let currentHeader: any = null;

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

    const handleData = (dataString: string) => {
        try {
            if (!hasReceivedData) {
                hasReceivedData = true;

                // Clear data timeout
                if (dataTimeout) {
                    clearTimeout(dataTimeout);
                    dataTimeout = null;
                }

                onConnectionSuccess?.();
            }

            onData?.(dataString);
        } catch (error) {
            console.error('[Socket] Error processing data:', error);
        }
    };

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
