import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Scout's board is a React island built to public/board/. scout.js injects
// board.js + board.css once and calls window.ScoutBoard.mount(el). React,
// ReactDOM and React Flow are bundled in (IIFE) so it's a single script tag.
export default defineConfig({
  plugins: [react()],
  // Vite's LIBRARY builds don't auto-replace process.env like app builds do.
  // React + React Flow read process.env.NODE_ENV; unreplaced, they throw
  // "process is not defined" at eval and the IIFE never assigns window.ScoutBoard.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': '{}',
  },
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'ScoutBoard',
      formats: ['iife'],
      fileName: () => 'board.js',
    },
    outDir: '../public/board',
    emptyOutDir: true,           // owns public/board/ only, never public/
    cssCodeSplit: false,
    rollupOptions: { output: { assetFileNames: 'board.[ext]' } },
    // students on patchy connections + PWA offline — keep it lean, no sourcemap in prod
    sourcemap: false,
  },
});
