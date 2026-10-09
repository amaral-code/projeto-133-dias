import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      devOptions: { enabled: false },
      workbox: {
        // 100% offline dentro da academia
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            // OCR do rótulo (tesseract core + traineddata) e Open Food Facts:
            // rede na 1ª vez, depois cache — academia sem sinal continua valendo.
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|tessdata\.projectnaptha\.com)\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'ocr-core', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 } }
          },
          {
            urlPattern: /^https:\/\/(world|br)\.openfoodfacts\.org\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'open-food-facts', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }, networkTimeoutSeconds: 8 }
          }
        ]
      },
      manifest: {
        name: 'Projeto 133 Dias — Fitness & Diet Tracker',
        short_name: 'Projeto133',
        description: 'Treino, dieta, XP e streaks. 133 dias offline-first.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111513',
        theme_color: '#111513',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: { port: 5173 }
})
