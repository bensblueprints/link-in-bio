import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const basePath = (process.env.BASE_PATH || '').replace(/\/$/, '');
const adminPath = process.env.ADMIN_PATH || 'admin';

export default defineConfig({
  root: 'client',
  base: `${basePath}/${adminPath}/`,
  plugins: [react(), tailwindcss()],
  define: {
    __BASE_PATH__: JSON.stringify(basePath)
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 5308,
    proxy: {
      '/api': 'http://localhost:5307',
      '/uploads': 'http://localhost:5307'
    }
  }
});
