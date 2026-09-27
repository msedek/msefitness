import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: 'web',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'msefitness',
        short_name: 'msefitness',
        description: 'Registro y control de entrenamiento en bicicleta estacionaria',
        lang: 'es-CL',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111214',
        theme_color: '#111214',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/cdn-cgi/],
      },
    }),
  ],
  server: { port: Number(process.env.VITE_PORT ?? 5190), proxy: { '/api': `http://localhost:${process.env.API_PORT ?? 3991}` } },
  build: { outDir: 'dist', emptyOutDir: true },
});
