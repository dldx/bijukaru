import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// Build to the FastAPI static directory
			pages: '../static/spa',
			assets: '../static/spa',
			fallback: 'index.html',
			precompress: false
		})
	}
};

export default config;
