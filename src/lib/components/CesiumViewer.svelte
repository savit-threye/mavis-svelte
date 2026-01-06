<script lang="ts">
	import { CesiumService } from '$lib/services';
	import { onMount, onDestroy } from 'svelte';

	let containerElement: HTMLDivElement;

	onMount(() => {
		CesiumService.initialize(containerElement);
	});

	onDestroy(() => {
		CesiumService.destroy();
	});
</script>

<div bind:this={containerElement} class="cesium-container"></div>

<style>
	.cesium-container {
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
