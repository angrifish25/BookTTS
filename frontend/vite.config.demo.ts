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
      { find: /^@tauri-apps\/api\/core$/, replacement: path.resolve(__dirname, './mock/@tauri-apps/api/core.ts') },
      { find: /^@tauri-apps\/plugin-dialog$/, replacement: path.resolve(__dirname, './mock/@tauri-apps/plugin-dialog.ts') },
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
