import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: {
    // Forward API calls to the Express server during development.
    proxy: { '/api': 'http://localhost:3001' },
  },
});
