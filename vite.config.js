import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'landing/index.html'),
        landingEn: resolve(__dirname, 'landing/index-en.html'),
        analysis: resolve(__dirname, 'analysis/index.html'),
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})

