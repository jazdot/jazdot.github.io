import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { VitePWA } from 'vite-plugin-pwa'

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
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['jd.png', 'pp.jpeg', 'Muhammed_Riswan_Resume_2026.pdf'],
      manifest: {
        name: 'Muhammed Riswan | Network Engineer',
        short_name: 'JAZDOT',
        description: 'Portfolio of Muhammed Riswan M. P., Network & MLOps Engineer.',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        icons: [
          {
            src: 'jd.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'jd.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: './', // Add this to ensure assets are linked with relative paths
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        }
      }
    }
  }
})
