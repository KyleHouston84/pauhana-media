import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.BACKEND_URL ?? 'http://localhost:9001'

  return {
    plugins: [react()],
    server: {
      proxy: {
        // Proxy all API routes to the backend (set BACKEND_URL in .env.development.local)
        '^/(health|storm|erupt|logs|audio|video|wled|events|effects|settings)': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: '../web-dist',
      emptyOutDir: true,
    },
  }
})
