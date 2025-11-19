import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: './',
  base: process.env.BASE_URL || '/',
  build: {
    outDir: 'demo-dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000
  }
})
