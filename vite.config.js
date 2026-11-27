import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Raise warning threshold to suppress the large main-chunk warning
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Split each lazy-loaded route into its own predictable named chunk so
        // dynamic imports always resolve to the correct file in production.
        // All node_modules stay in a single 'vendor' chunk to avoid Rollup
        // circular-dependency warnings that arise from splitting vendor sub-chunks.
        manualChunks: (id) => {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/pages/playhub/games/SentenceBuilder')) return 'SentenceBuilder';
          if (id.includes('/pages/playhub/PlayHub'))               return 'PlayHub';
          if (id.includes('/pages/SentenceList'))                   return 'SentenceList';
          if (id.includes('/home/HomePage'))                        return 'HomePage';
          if (id.includes('/components/ProtectedRoute'))            return 'ProtectedRoute';
        },
      }
    }
  }
})