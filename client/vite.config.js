import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/**
 * The proxy sends /api calls to the backend on port 3000,
 * so the frontend can call /api/... with no CORS setup.
 *
 * `test` configures Vitest: jsdom gives components a browser-like
 * DOM, and the setup file runs before every test file.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
});
