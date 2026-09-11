import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/lp1/',
  build: {
    outDir: 'dist-lp1',
    emptyOutDir: true,
    rollupOptions: {
      input: 'lp1.html',
    },
  },
});
