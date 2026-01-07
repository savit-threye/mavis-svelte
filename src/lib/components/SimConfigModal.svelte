<script lang="ts">
	import type { SimConfig } from '$lib/interfaces';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onConnect: (config: SimConfig) => void;
	}

	let { isOpen, onClose, onConnect }: Props = $props();

	let simIp = $state('127.0.0.1');
	let simPort = $state(15000);
	let error = $state('');

	function handleConnect() {
		const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
		if (!ipRegex.test(simIp)) {
			error = 'Invalid IP address';
			return;
		}
		if (simPort < 1 || simPort > 65535) {
			error = 'Port must be 1-65535';
			return;
		}
		error = '';
		onConnect({ simIp, simPort });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleConnect();
		if (e.key === 'Escape') onClose();
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-bg" onclick={onClose} role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="modal"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
			onkeydown={handleKeydown}
		>
			<h2 class="modal-title">Connect to Simulator</h2>

			<div class="field">
				<label for="ip">IP Address</label>
				<input id="ip" type="text" bind:value={simIp} onkeydown={handleKeydown} />
			</div>

			<div class="field">
				<label for="port">Port</label>
				<input
					id="port"
					type="number"
					bind:value={simPort}
					min="1"
					max="65535"
					onkeydown={handleKeydown}
				/>
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<div class="actions">
				<button class="btn btn-cancel" onclick={onClose}>Cancel</button>
				<button class="btn btn-connect" onclick={handleConnect}>Connect</button>
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
		margin: 0 0 1.25rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: white;
	}

	.field {
		margin-bottom: 1rem;
	}

	.field label {
		display: block;
		font-size: 0.875rem;
		color: #94a3b8;
		margin-bottom: 0.375rem;
	}

	.field input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: #0f172a;
		border: 1px solid #334155;
		border-radius: 0.375rem;
		color: white;
		font-size: 0.875rem;
	}

	.field input:focus {
		outline: none;
		border-color: #22c55e;
	}

	.error {
		color: #f87171;
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
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

	.btn-connect {
		background: #22c55e;
		color: white;
	}

	.btn-connect:hover {
		background: #16a34a;
	}
</style>
