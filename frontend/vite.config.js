import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    // The FastAPI backend; proxying keeps the browser on one origin, so no CORS setup is needed
    proxy: {
      '/api': { target: process.env.VITE_BACKEND_URL || 'http://localhost:8000', changeOrigin: true }
    }
  }
})
