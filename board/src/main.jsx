import React from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './board.css';
import Board from './Board.jsx';

// Vite builds this as an IIFE whose EXPORTS are assigned to window.ScoutBoard.
// So mount/unmount must be real exports (not a manual window assignment, which
// the export-assignment would clobber). scout.js calls window.ScoutBoard.mount(el).
// The root persists across dashboard section switches — scout.js hides/shows the
// container, never regenerates it, so camera/selection/undo survive.
let root = null;

export function mount(el) {
  if (!el) return;
  if (!root) root = createRoot(el);
  root.render(<Board />);   // no StrictMode: React Flow double-mount churns the store
}

export function unmount() {
  if (root) { root.unmount(); root = null; }
}

// standalone preview (running the Vite dev server directly)
if (import.meta.env?.DEV) {
  const el = document.getElementById('root');
  if (el) mount(el);
}
