<script lang="ts">
	import { CesiumService } from '$lib/services';
	import { entityCount } from '$lib/stores';
	import { onMount, onDestroy } from 'svelte';

	let containerElement: HTMLDivElement;

	onMount(() => {
		CesiumService.initialize(containerElement);
		console.log('Cesium Viewer initialized');
	});

	onDestroy(() => {
		CesiumService.destroy();
	});
</script>

<div bind:this={containerElement} class="cesium-container">
	<div class="entity-count">Entities: {$entityCount}</div>
</div>

<style>
	.cesium-container {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
		position: relative;
	}

	.entity-count {
		position: absolute;
		top: 10px;
		left: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 8px 12px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 14px;
		z-index: 1000;
	}
</style>
