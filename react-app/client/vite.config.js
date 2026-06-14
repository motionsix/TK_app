import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy API and uploaded images to the Express server during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
