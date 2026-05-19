import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

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
  define: {
    'process.env.NEXT_PUBLIC_SHELBY_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SHELBY_API_KEY || ''),
  },
  optimizeDeps: {
    exclude: ['@shelby-protocol/sdk'],
    include: ['poseidon-lite', '@aptos-labs/ts-sdk', '@shelby-protocol/clay-codes'],
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
