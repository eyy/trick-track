import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      // Generates icons + apple-touch-icon from public/logo.svg and injects the links.
      pwaAssets: {
        image: 'public/logo.svg',
        preset: 'minimal-2023',
      },
      manifest: {
        name: 'trick-track',
        short_name: 'trick-track',
        description: 'Track events: timestamp, category, and a note.',
        theme_color: '#7c3aed',
        background_color: '#16171d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
      },
    }),
  ],
})
