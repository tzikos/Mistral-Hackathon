import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// SPA fallback for `vite preview` (production).
// vite dev already handles this; preview does not by default.
const spaFallback = {
  name: 'spa-fallback',
  configurePreviewServer(server: any) {
    server.middlewares.use((req: any, _res: any, next: any) => {
      const url: string = req.url ?? '/';
      const pathname = url.split('?')[0];
      const hasExtension = /\.[a-z0-9]+$/i.test(pathname);
      if (!hasExtension && !url.startsWith('/api')) {
        req.url = '/index.html';
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [react(), spaFallback],
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true,
    allowedHosts: ['tzikos-website.onrender.com'],
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})
