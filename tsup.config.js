import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.js'],
    format: ['esm', 'cjs'],
    splitting: false,
    clean: true,
    dts: false,
    outDir: 'dist',
    target: 'node20',
    esbuildOptions(options) {
        if (options.format === 'cjs') {
            options.banner = {
                js: `'use strict';`
            };
            options.inject = [];
        }
    }
});
