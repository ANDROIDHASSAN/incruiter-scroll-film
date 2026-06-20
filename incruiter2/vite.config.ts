import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ['gsap'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  server: { host: true },
});
