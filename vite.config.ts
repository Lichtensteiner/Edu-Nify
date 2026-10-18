import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';

// Fix any extensionless VirtualClassroom file that might exist on disk in the build environment (e.g. Vercel)
try {
  const vcNoExt = path.resolve(process.cwd(), 'src/components/VirtualClassroom.tsx');
  const vcTsx = path.resolve(process.cwd(), 'src/components/VirtualClassroom.tsx');
  if (fs.existsSync(vcNoExt)) {
    const stat = fs.statSync(vcNoExt);
    if (!stat.isDirectory()) {
      if (!fs.existsSync(vcTsx)) {
        fs.renameSync(vcNoExt, vcTsx);
      } else {
        fs.unlinkSync(vcNoExt);
      }
    }
  }
} catch (e) {
  console.warn('[Vite Build] VirtualClassroom file normalization note:', e);
}

export default defineConfig({
  plugins: [
    {
      name: 'resolve-virtual-classroom-tsx',
      enforce: 'pre',
      resolveId(source, importer) {
        if (
          source === '../components/VirtualClassroom' ||
          source === './VirtualClassroom' ||
          source.endsWith('/components/VirtualClassroom')
        ) {
          const target = path.resolve(process.cwd(), 'src/components/VirtualClassroom.tsx');
          if (fs.existsSync(target)) {
            return target;
          }
        }
        return null;
      }
    },
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024 // 15MB
      }
    })
  ],
  esbuild: {
    loader: 'tsx',
    include: [/src\/.*\.[tj]sx?$/, /src\/components\/VirtualClassroom/],
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
  },
  build: {
    outDir: 'dist'
  }
});
