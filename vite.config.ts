import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      // Force all @shelby-protocol/sdk imports to use the browser build
      '@shelby-protocol/sdk': require.resolve('@shelby-protocol/sdk/browser'),
      '@shelby-protocol/sdk/browser': require.resolve('@shelby-protocol/sdk/browser'),
      // Ensure any clay-codes wasm imports resolve correctly
      '@shelby-protocol/clay-codes': require.resolve('@shelby-protocol/clay-codes'),
      // Common alias for src
      '~': path.resolve(__dirname, 'src'),
    }
  },
  optimizeDeps: {
    exclude: ['@shelby-protocol/sdk'],
    include: ['poseidon-lite', '@aptos-labs/ts-sdk', '@shelby-protocol/clay-codes'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      // ensure the browser build is used when bundling
      external: [],
      output: {}
    }
  }
});
