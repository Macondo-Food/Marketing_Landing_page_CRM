import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/vsl/',
  build: {
    outDir: 'dist-vsl',
    rollupOptions: {
      input: resolve(__dirname, 'vsl.html'),
    },
  },
});
