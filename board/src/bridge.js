// The board never touches scout-* localStorage directly. Everything routes
// through window.Scout, which scout.js exposes. scout-pipe stays the single
// source of truth; the board stores only node positions (scout-board).
//
// Every accessor degrades safely so the board can render even if scout.js
// hasn't finished wiring the bridge (e.g. in the standalone Vite preview).

const S = () => (typeof window !== 'undefined' && window.Scout) || {};

export const Scout = {
  // ── pipeline (the canonical dataset) ──
  getPipe: () => { try { return S().getPipe?.() || {}; } catch { return {}; } },
  resolveOpp: (id) => { try { return S().resolveOpp?.(id) || null; } catch { return null; } },
  pipeSet: (id, patch) => S().pipeSet?.(id, patch),
  pipeDays: (p) => { try { const d = S().pipeDays?.(p); return d == null ? null : d; } catch { return null; } },
  deadlineHeat: (d) => S().deadlineHeat?.(d) || { cls: 'none', t: 'no date' },
  matchScore: (id) => { try { return S().matchScore?.(id) ?? null; } catch { return null; } },
  riskReason: (id) => { try { return S().riskReason?.(id) || null; } catch { return null; } },

  // ── actions ──
  applyWithScout: (id) => S().applyWithScout?.(id),
  exportEventICS: (id) => S().exportEventICS?.(id),
  openDetail: (id) => S().openDetail?.(id),
  startApply: (id) => S().startApply?.(id),
  toast: (msg) => S().toast?.(msg),

  // ── board persistence (positions only) ──
  getBoard: () => { try { return S().getBoard?.() || { nodes: {} }; } catch { return { nodes: {} }; } },
  saveBoard: (state) => S().saveBoard?.(state),

  // ── context ──
  getDashSec: () => { try { return S().getDashSec?.(); } catch { return null; } },
  ready: () => !!(typeof window !== 'undefined' && window.Scout),
};

// scout.js dispatches window 'scout:pipe' after any pipeSet, and 'scout:drop-opp'
// carrying an opp id when a feed card is dropped on the board.
export function onPipeChange(cb) {
  const h = () => cb();
  window.addEventListener('scout:pipe', h);
  return () => window.removeEventListener('scout:pipe', h);
}

export const STAGE_LANE = { saved: 0, draft: 1, applied: 2, result: 3 };
export const STAGE_LABEL = { saved: 'Saved', draft: 'Drafting', applied: 'Sent', result: 'Heard back' };
