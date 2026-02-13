import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to backend during development
      '/health': 'http://localhost:9001',
      '/storm': 'http://localhost:9001',
      '/erupt': 'http://localhost:9001',
      '/logs': 'http://localhost:9001',
    },
  },
  build: {
    outDir: '../web-dist',
    emptyOutDir: true,
  },
})
