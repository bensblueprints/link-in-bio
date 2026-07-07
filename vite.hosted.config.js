import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Hosted (multi-tenant) client — marketing site, login/signup, onboarding
// wizard, and dashboard. Root-mounted (linkleaf.im), separate from the
// self-host admin bundle (vite.config.js -> dist/) so the two products never
// share a build output.
export default defineConfig({
  root: 'client-hosted',
  base: '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../dist-hosted',
    emptyOutDir: true
  },
  server: {
    port: 5309,
    proxy: {
      '/api': 'http://localhost:5307',
      '/uploads': 'http://localhost:5307',
      '/r': 'http://localhost:5307'
    }
  }
});
