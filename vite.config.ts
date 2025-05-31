import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // GitHub Pages deploys to /<repository-name>/
  // If your repository is named 'math', the base should be '/math/'
  // Change this to match your repository name
  base: process.env.NODE_ENV === 'production' ? '/math-game/' : '/',
  
  plugins: [
    tailwindcss(),
  ],
  
  build: {
    // Output directory for build files
    outDir: 'dist',
    
    // Generate source maps for easier debugging
    sourcemap: true,
    
    // Optimize for modern browsers
    target: 'es2015',
    
    // Clean the output directory before building
    emptyOutDir: true,
  },
  
  server: {
    // Development server configuration
    port: 3000,
    open: true, // Automatically open browser
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['ecspresso']
  }
}) 