<script lang="ts">
	import type { ViewMode } from '$lib/interfaces';

	interface Props {
		mode: ViewMode;
		simIp?: string;
		simPort?: number;
	}

	let { mode, simIp = '', simPort = 0 }: Props = $props();
</script>

<div class="overlay">
	<div class="spinner"></div>
	<p class="text">
		{mode === 'stream' ? 'Connecting to simulator...' : 'Loading playback...'}
	</p>
	{#if mode === 'stream' && simIp}
		<p class="subtext">{simIp}:{simPort}</p>
	{/if}
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(15, 23, 42, 0.95);
		z-index: 40;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #334155;
		border-top-color: #22c55e;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.text {
		margin: 1rem 0 0.25rem 0;
		color: white;
		font-size: 1rem;
	}

	.subtext {
		margin: 0;
		color: #64748b;
		font-size: 0.875rem;
		font-family: monospace;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
