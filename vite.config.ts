```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg}'
        ],

        maximumFileSizeToCacheInBytes:
          15 * 1024 * 1024
      }
    })
  ],

  server: {
    port: 3000,
    host: '0.0.0.0'
  },

  resolve: {
    extensions: [
      '.mjs',
      '.js',
      '.mts',
      '.ts',
      '.jsx',
      '.tsx',
      '.json'
    ]
  },

  build: {
    outDir: 'dist'
  }
});
```
