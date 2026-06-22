import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: process.cwd(),
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: path.resolve(__dirname, './src') + '/' },
      { find: /^@\/api\/tauri$/, replacement: path.resolve(__dirname, './mock/api.ts') },
    ],
  },
  server: {
    port: 1421,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, '../demo-dist'),
    emptyOutDir: true,
  },
});
