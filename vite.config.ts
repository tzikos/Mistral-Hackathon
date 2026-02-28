import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true, // This is important for Render deployment
    allowedHosts: ['tzikos-website.onrender.com'],
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: true, // This is important for Render deployment
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})