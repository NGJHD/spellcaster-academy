/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Engine libraries change rarely: keep them in their own long-cached chunk.
        manualChunks(id: string) {
          if (/node_modules[\/](three|three-stdlib)[\/]/.test(id)) return 'three';
          if (/node_modules[\/](@react-three|react|react-dom|scheduler|zustand|howler)[\/]/.test(id)) return 'vendor';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
  },
});
