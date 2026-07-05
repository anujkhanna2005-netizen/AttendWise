import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Set to 'prompt' so the user is asked before reload (not updated silently)
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-*.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'AttendWise',
        short_name: 'AttendWise',
        description: 'Track attendance. Stay above 75%.',
        theme_color: '#818cf8',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          // SVG first — browsers that support it will use this (best quality, original logo)
          { src: 'favicon.svg',           sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
          // PNG fallbacks for specific sizes (Android, older browsers)
          { src: 'icon-192.png',          sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png',          sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ]
      },
      workbox: {
        // Cache all static assets for robust offline support
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Single Page App offline fallback routing
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      }
    })
  ]
});
