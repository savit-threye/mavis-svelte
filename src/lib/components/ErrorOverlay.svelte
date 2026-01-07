<script lang="ts">
	interface Props {
		error: string;
		onRetry: () => void;
	}

	let { error, onRetry }: Props = $props();
</script>

<div class="overlay">
	<div class="box">
		<div class="icon">✕</div>
		<h3 class="title">Connection Failed</h3>
		<p class="message">{error}</p>
		<button class="btn" onclick={onRetry}>Try Again</button>
	</div>
</div>

<style>
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 23, 42, 0.95);
		z-index: 45;
	}

	.box {
		text-align: center;
		padding: 2rem;
	}

	.icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 1rem;
		background: #7f1d1d;
		color: #f87171;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
	}

	.title {
		margin: 0 0 0.5rem 0;
		color: #f87171;
		font-size: 1.25rem;
	}

	.message {
		margin: 0 0 1.5rem 0;
		color: #94a3b8;
		font-size: 0.875rem;
		max-width: 280px;
	}

	.btn {
		padding: 0.625rem 1.5rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.btn:hover {
		background: #dc2626;
	}
</style>
