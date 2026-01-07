<script lang="ts">
	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onSelect: () => void;
	}

	let { isOpen, onClose, onSelect }: Props = $props();

	function handleSelect() {
		onSelect();
		onClose();
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-bg" onclick={onClose} role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" tabindex="-1">
			<h2 class="modal-title">Database Playback</h2>
			<p class="modal-desc">Load recorded data for playback and analysis.</p>

			<div class="actions">
				<button class="btn btn-cancel" onclick={onClose}>Cancel</button>
				<button class="btn btn-load" onclick={handleSelect}>Load Playback</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-bg {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.modal {
		background: #1e293b;
		border-radius: 0.75rem;
		padding: 1.5rem;
		width: 20rem;
		border: 1px solid #334155;
	}

	.modal-title {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: white;
	}

	.modal-desc {
		margin: 0 0 1.5rem 0;
		font-size: 0.875rem;
		color: #94a3b8;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		font-weight: 500;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.btn-cancel {
		background: #334155;
		color: #e2e8f0;
	}

	.btn-cancel:hover {
		background: #475569;
	}

	.btn-load {
		background: #3b82f6;
		color: white;
	}

	.btn-load:hover {
		background: #2563eb;
	}
</style>
