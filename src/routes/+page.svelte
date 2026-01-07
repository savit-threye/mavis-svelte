<script lang="ts">
	import {
		CesiumViewer,
		SimConfigModal,
		PlaybackModal,
		ConnectingOverlay,
		ErrorOverlay,
		ModeSelector
	} from '$lib/components';
	import { connectToSocketServer } from '$lib/services/socket';
	import type { ViewMode, SimConfig } from '$lib/interfaces';
	import { onMount, onDestroy } from 'svelte';

	// State
	let mode = $state<ViewMode>(null);
	let showSimConfig = $state(false);
	let showPlaybackModal = $state(false);
	let simDetails = $state<SimConfig>({ simIp: '127.0.0.1', simPort: 15000 });
	let connectionError = $state('');
	let isConnecting = $state(false);
	let isLoading = $state(true);

	let socketConnection: ReturnType<typeof connectToSocketServer> | null = null;

	// Handlers
	function handleLiveStreamClick() {
		connectionError = '';
		showSimConfig = true;
	}

	function handlePlaybackClick() {
		connectionError = '';
		showPlaybackModal = true;
	}

	function handleSimConnect(details: SimConfig) {
		connectionError = '';
		simDetails = details;
		mode = 'stream';
	}

	function handlePlaybackSelect() {
		connectionError = '';
		mode = 'playback';
	}

	function handleConnectionError(error: string) {
		console.error('[Home] Connection error:', error);
		connectionError = error;
		isConnecting = false;
	}

	function handleConnectionSuccess() {
		console.log('[Home] Connection successful');
		connectionError = '';
		isConnecting = false;
	}

	function handleRetry() {
		connectionError = '';
		mode = null;
		socketConnection?.disconnect();
		socketConnection = null;
	}

	onMount(() => {
		isLoading = false;
	});

	// Reactive effect for mode changes
	$effect(() => {
		if (!mode) return;

		console.log('[Home] Initializing connection...', mode);
		isConnecting = true;
		connectionError = '';

		// Build WebSocket URL based on mode
		const wsUrl =
			mode === 'stream'
				? `http://${simDetails.simIp}:${simDetails.simPort}`
				: 'http://localhost:3000';

		socketConnection = connectToSocketServer({
			url: wsUrl,
			streamType: mode,
			simDetails: mode === 'stream' ? simDetails : undefined,
			onConnectionError: handleConnectionError,
			onConnectionSuccess: handleConnectionSuccess,
			onHeader: (header) => {
				console.log('[Home] Received header:', header);
			},
			onData: (data) => {
				console.log('[Home] Received data chunk');
				// Process data here
			}
		});

		console.log('[Home] Socket connection initialized');
	});

	onDestroy(() => {
		socketConnection?.disconnect();
	});
</script>

<div class="app-container">
	<!-- Mode selector overlay -->
	{#if !mode && !isLoading}
		<ModeSelector
			onLiveStream={handleLiveStreamClick}
			onPlayback={handlePlaybackClick}
			{connectionError}
		/>
	{/if}

	<!-- Connecting overlay -->
	{#if isConnecting && mode}
		<ConnectingOverlay {mode} simIp={simDetails.simIp} simPort={simDetails.simPort} />
	{/if}

	<!-- Error overlay with retry option -->
	{#if connectionError && mode}
		<ErrorOverlay error={connectionError} onRetry={handleRetry} />
	{/if}

	<!-- Simulator Configuration Modal -->
	<SimConfigModal
		isOpen={showSimConfig}
		onClose={() => {
			showSimConfig = false;
			connectionError = '';
		}}
		onConnect={handleSimConnect}
	/>

	<!-- Playback Modal -->
	<PlaybackModal
		isOpen={showPlaybackModal}
		onClose={() => {
			showPlaybackModal = false;
			connectionError = '';
		}}
		onSelect={handlePlaybackSelect}
	/>

	<!-- Cesium Viewer -->
	<CesiumViewer />
</div>

<style>
	.app-container {
		flex: 1;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		position: relative;
		background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(::selection) {
		background: rgba(34, 197, 94, 0.3);
		color: white;
	}
</style>
