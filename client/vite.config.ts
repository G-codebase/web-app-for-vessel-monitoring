import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'lucide-react': path.resolve(import.meta.dirname, 'src/components/icons/index.tsx'),
    },
  },

  server: {
    host: '0.0.0.0', // Expose to all network interfaces (LAN / Wi-Fi)
    port: 5173,
    cors: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, res) => {
            const serverRes = res as any;
            if (serverRes && typeof serverRes.writeHead === 'function' && !serverRes.headersSent) {
              serverRes.writeHead(503, { 'Content-Type': 'application/json' });
              serverRes.end(
                JSON.stringify({
                  status: 'ERROR',
                  message: 'SCADA Telemetry backend server (port 3001) is offline. Please start it using npm run dev or npm run dev:server.',
                })
              );
            }
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    cssMinify: false,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
});

