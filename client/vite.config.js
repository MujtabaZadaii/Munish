import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function copyToPublicPlugin() {
  return {
    name: 'copy-to-public-plugin',
    closeBundle() {
      try {
        const srcDir = path.resolve(__dirname, 'dist');
        const destDir = path.resolve(__dirname, '..', 'public');
        if (fs.existsSync(srcDir)) {
          fs.cpSync(srcDir, destDir, { recursive: true });
          console.log('[Vite Plugin] Successfully mirrored build to ../public');
        }
      } catch (err) {
        console.warn('[Vite Plugin] Mirror notice:', err.message);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), copyToPublicPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
