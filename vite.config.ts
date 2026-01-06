import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

export default defineConfig({ plugins: [tailwindcss(), sveltekit(), devtoolsJson(), cesium()] });