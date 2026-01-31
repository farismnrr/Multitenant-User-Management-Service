import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      // Proxy API requests to the Rust backend
      "/api": {
        target: "http://localhost:5500",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://localhost:5500",
        changeOrigin: true,
      },
      "/runtime-env.js": {
        target: "http://localhost:5500",
        changeOrigin: true,
      },
    },
  },
})
