import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./test/setup.js'],
		exclude: [...configDefaults.exclude, 'test/browser/**'],
	},
});
