import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Set to 'prompt' so the user is asked before reload (not updated silently)
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AttendWise',
        short_name: 'AttendWise',
        description: 'Track attendance. Stay above 75%.',
        theme_color: '#7c3aed',
        background_color: '#15121b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
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
