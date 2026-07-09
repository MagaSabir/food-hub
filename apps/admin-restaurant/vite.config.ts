import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }, // админка платформы
  resolve: {
    // Алиас @/ → src/ (для FSD-импортов: @/shared, @/pages ...).
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
