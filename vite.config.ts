import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// The Django backend has no CORS configured, so in dev we proxy API calls to it.
// Override the target with VITE_BACKEND_URL if your backend runs elsewhere.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_BACKEND_URL || 'http://localhost:8000';

  const proxy = Object.fromEntries(
    ['/api', '/auth', '/availability', '/admin', '/static'].map((path) => [
      path,
      { target: backend, changeOrigin: true },
    ]),
  );

  return {
    // Emit relative asset paths so the production build works no matter where
    // it is served from — domain root, a sub-path, or opened directly as a
    // file:// URL. With the default '/' base the absolute /assets/* paths 404
    // off the domain root and React never mounts (blank page, title only).
    base: './',
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      proxy,
    },
  };
});
