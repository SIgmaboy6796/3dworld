import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'ES2020',
    sourcemap: true
  }
})
