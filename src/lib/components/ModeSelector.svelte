<script lang="ts">
	interface Props {
		onLiveStream: () => void;
		onPlayback: () => void;
		connectionError?: string;
	}

	let { onLiveStream, onPlayback, connectionError = '' }: Props = $props();
</script>

<div class="overlay">
	<div class="container">
		<h1 class="title">MAVIS</h1>
		<p class="subtitle">Tactical Viewer</p>

		{#if connectionError}
			<div class="error">
				<span>⚠️ {connectionError}</span>
			</div>
		{/if}

		<div class="buttons">
			<button class="btn btn-primary" onclick={onLiveStream}> 🔴 Live Stream </button>
			<button class="btn btn-secondary" onclick={onPlayback}> 📼 DB Playback </button>
		</div>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #0f172a;
		z-index: 50;
	}

	.container {
		text-align: center;
		padding: 3rem;
	}

	.title {
		font-size: 3rem;
		font-weight: 700;
		color: #22c55e;
		margin: 0 0 0.5rem 0;
		letter-spacing: 0.1em;
	}

	.subtitle {
		font-size: 1rem;
		color: #64748b;
		margin: 0 0 2rem 0;
	}

	.error {
		background: #7f1d1d;
		color: #fca5a5;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	.buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.btn {
		padding: 0.875rem 2rem;
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
	}

	.btn:hover {
		transform: translateY(-2px);
	}

	.btn:active {
		transform: translateY(0);
	}

	.btn-primary {
		background: #22c55e;
		color: white;
	}

	.btn-primary:hover {
		box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
	}

	.btn-secondary {
		background: #3b82f6;
		color: white;
	}

	.btn-secondary:hover {
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}
</style>
