import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { lossless: true },
      avif: { lossless: true },
      svg: {
        multipass: true,
      }
    })
  ],
  base: './', // Add this to ensure assets are linked with relative paths
})
