import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // Puerto configurable (p. ej. VITE_PORT=3100) si el 3000 está ocupado.
    // strictPort evita que Vite cambie de puerto en silencio y rompa CORS.
    port: Number(process.env.VITE_PORT) || 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
