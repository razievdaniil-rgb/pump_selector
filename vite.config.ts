import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'apgs-pump-selector.[hash].js',
        assetFileNames: 'apgs-pump-selector.[hash].[ext]',
      },
    },
  },
});
