import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider, addEdge, MarkerType, useViewport,
} from '@xyflow/react';
import OpportunityNode from './nodes/OpportunityNode.jsx';
import NoteNode from './nodes/NoteNode.jsx';
import MilestoneNode from './nodes/MilestoneNode.jsx';
import Inspector from './Inspector.jsx';
import { Scout, onPipeChange, STAGE_LANE } from './bridge.js';

const nodeTypes = { opp: OpportunityNode, note: NoteNode, milestone: MilestoneNode };
const uid = (p) => p + Math.random().toString(36).slice(2, 9);

// Layout: x from deadline (sooner = left), y by stage lane. The board is
// TIME-ANCHORED — this is the "order from chaos" moment the design centres on.
// NODE_H tracks the real card height (4:3 cover art + body). Lanes must clear it
// or stage rows collide — keep LANE_H > NODE_H whenever the card grows.
const NODE_W = 206, NODE_H = 247, LANE_H = 290, GAP = 26, X0 = 120, Y0 = 60, DAY_PX = 15;
function dayX(days) {
  const d = days == null ? 220 : Math.max(-10, Math.min(days, 220));
  return X0 + Math.max(0, d) * DAY_PX;
}
function layoutAll(entries) {
  const byLane = { 0: [], 1: [], 2: [], 3: [] };
  entries.forEach(([id, p]) => byLane[STAGE_LANE[p.stage] ?? 0].push([id, p]));
  const pos = {};
  for (const laneStr of Object.keys(byLane)) {
    const lane = Number(laneStr);
    const items = byLane[lane].sort((a, b) => (a[1].__days ?? 9e9) - (b[1].__days ?? 9e9));
    let cursor = -Infinity;
    for (const [id, p] of items) {
      let x = dayX(p.__days);
      if (x < cursor + NODE_W + GAP) x = cursor + NODE_W + GAP;
      cursor = x;
      pos[id] = { x, y: Y0 + lane * LANE_H };
    }
  }
  return pos;
}

function dataFor(id, p) {
  const opp = Scout.resolveOpp(id) || p.snap || {};
  const snap = p.snap || {};
  const days = Scout.pipeDays(p);
  // Prefer the live listing, fall back to the saved snapshot — snapOf() carries
  // img/imgThumb/realImg/type/prize/location, so a node still looks like its
  // Discover card even after the listing rotates out of the live feed.
  const pick = (k) => opp[k] ?? snap[k];
  return {
    oppId: id, title: pick('title') || 'Untitled', org: pick('org') || '',
    stage: p.stage, heat: Scout.deadlineHeat(days), days, match: Scout.matchScore(id),
    pct: p.pct, source: pick('display_url'),
    kept: !!(p.snap && !opp.days_left && opp.title == null), snap: p.snap,
    // ── Discover-card visuals ──
    img: pick('img'), imgThumb: pick('imgThumb'), realImg: !!pick('realImg'),
    type: pick('type') || null,
    prizeCash: Number(pick('prize_cash')) || 0, applied: Number(pick('applied')) || 0,
    // dom[0] only, as a string: a fresh array identity each rebuild would defeat
    // any future memoisation on the node for no benefit.
    dom0: (pick('dom') || [])[0] || null,
  };
}

// Build the opportunity nodes (thin references to the pipeline).
function buildOppNodes(saved) {
  const pipe = Scout.getPipe();
  const entries = Object.entries(pipe).filter(([, p]) => p && p.snap);
  entries.forEach(([, p]) => { p.__days = Scout.pipeDays(p); });
  const auto = layoutAll(entries);
  return entries.map(([id, p]) => ({
    id, type: 'opp', position: saved?.nodes?.[id] || auto[id], data: dataFor(id, p),
  }));
}
// Canvas-native nodes (notes, milestones) stored fully in scout-board.
function buildCanvasNodes(saved, onChange) {
  const notes = (saved?.notes || []).map((n) => ({
    id: n.id, type: 'note', position: { x: n.x, y: n.y },
    style: n.w ? { width: n.w, height: n.h } : undefined,
    data: { text: n.text, color: n.color, onChange },
  }));
  const ms = (saved?.milestones || []).map((m) => ({
    id: m.id, type: 'milestone', position: { x: m.x, y: m.y },
    data: { label: m.label, deadline_ts: m.deadline_ts, onChange },
  }));
  return [...notes, ...ms];
}

function Canvas() {
  const rf = useReactFlow();
  const wrapRef = useRef(null);
  const [selId, setSelId] = useState(null);

  // React Flow must not mount into a hidden / zero-size pane. The board lives in
  // a persistent dashboard pane that is display:none until its section opens; if
  // React Flow mounts while hidden, its per-node ResizeObserver never fires, the
  // nodes stay unmeasured (no handleBounds), and persisted edges can't route.
  // Gate the whole flow on the pane being genuinely visible + laid out so React
  // Flow's own measurement works from the very first frame.
  const [paneReady, setPaneReady] = useState(false);
  useEffect(() => {
    if (paneReady) return undefined;
    let raf = 0;
    // A laid-out, visible element has a non-zero box; display:none collapses it
    // to 0×0. (offsetParent is unreliable here — the dashboard is a fixed
    // overlay, so every descendant reports offsetParent === null even visible.)
    const visible = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const check = () => {
      if (visible(wrapRef.current)) { setPaneReady(true); return; }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    const onShown = () => { if (visible(wrapRef.current)) setPaneReady(true); };
    window.addEventListener('scout:board-shown', onShown);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scout:board-shown', onShown); };
  }, [paneReady]);

  // a stable ref to setNodes breaks the chicken-and-egg (the node initializer
  // needs onNodeContent; onNodeContent needs setNodes) and kills any staleness.
  const setNodesRef = useRef(null);
  const onNodeContent = useCallback((id, patch) => {
    setNodesRef.current?.((cur) => cur.map((n) => n.id === id ? { ...n, data: { ...n.data, ...patch, fresh: false } } : n));
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(() => {
    const saved = Scout.getBoard();
    return [...buildOppNodes(saved), ...buildCanvasNodes(saved, onNodeContent)];
  });
  setNodesRef.current = setNodes;
  // Edges co-mount with nodes (initial nodes+edges resolve together in React
  // Flow; only edges ADDED after mount hit the unmeasured-node drop).
  const [edges, setEdges, onEdgesChange] = useEdgesState(() => (Scout.getBoard().edges || []).map((e) => ({
    ...e, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed },
  })));

  // rebuild opportunity nodes when the pipeline changes elsewhere; keep canvas nodes intact
  useEffect(() => onPipeChange(() => {
    setNodes((cur) => {
      const savedPos = Object.fromEntries(cur.map((n) => [n.id, n.position]));
      const saved = Scout.getBoard();
      const opps = buildOppNodes(saved).map((n) => savedPos[n.id] ? { ...n, position: savedPos[n.id] } : n);
      const canvas = cur.filter((n) => n.type !== 'opp');   // preserve live note/ms edits
      return [...opps, ...canvas];
    });
  }), [setNodes]);

  // ── persist the FULL graph (positions + notes + milestones + edges) ──
  const saveTimer = useRef(0);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const posMap = {}, notes = [], milestones = [];
      for (const n of nodes) {
        if (n.type === 'opp') posMap[n.id] = n.position;
        else if (n.type === 'note') notes.push({ id: n.id, x: n.position.x, y: n.position.y, text: n.data.text || '', color: n.data.color, w: n.width || n.style?.width, h: n.height || n.style?.height });
        else if (n.type === 'milestone') milestones.push({ id: n.id, x: n.position.x, y: n.position.y, label: n.data.label || '', deadline_ts: n.data.deadline_ts || null });
      }
      const cleanEdges = edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label }));
      Scout.saveBoard({ nodes: posMap, notes, milestones, edges: cleanEdges });
    }, 500);
  }, [nodes, edges]);

  const onSelectionChange = useCallback(({ nodes: sel }) => setSelId(sel?.[0]?.id ?? null), []);

  // Zoom tier drives what a card shows. Far out, a node is a coloured tile with
  // a title; close in, it is the full Discover card. Written straight to the DOM
  // (not state) so panning never re-renders the graph.
  const onMove = useCallback((_, vp) => {
    const el = wrapRef.current; if (!el) return;
    const tier = vp.zoom < 0.45 ? 'far' : vp.zoom < 0.75 ? 'mid' : 'near';
    if (el.dataset.zoom !== tier) el.dataset.zoom = tier;
  }, []);

  // ── typed dependency edges: drag port→port creates a "needs" link ──
  const onConnect = useCallback((c) => {
    setEdges((eds) => addEdge({ ...c, id: uid('e_'), type: 'smoothstep', label: 'needs', markerEnd: { type: MarkerType.ArrowClosed } }, eds));
    Scout.toast?.('Linked');
  }, [setEdges]);

  // ── create: notes & milestones ──
  // Never drop a new object on top of an existing one — step it down-right until
  // the slot is clear, so repeated ＋Note clicks cascade instead of stacking.
  const freeSpot = useCallback((want, existing) => {
    const p = { ...want };
    const clash = () => existing.some((n) => Math.abs(n.position.x - p.x) < NODE_W && Math.abs(n.position.y - p.y) < 150);
    for (let i = 0; i < 40 && clash(); i++) { p.x += 30; p.y += 34; }
    return p;
  }, []);
  const addNote = useCallback((pos) => {
    const want = pos || rf.screenToFlowPosition({ x: (wrapRef.current?.clientWidth || 800) / 2, y: 200 });
    const id = uid('note_');
    setNodes((cur) => [...cur, { id, type: 'note', position: freeSpot(want, cur), data: { text: '', color: '#FDF3C9', fresh: true, onChange: onNodeContent } }]);
  }, [rf, setNodes, onNodeContent, freeSpot]);
  const addMilestone = useCallback(() => {
    const want = rf.screenToFlowPosition({ x: (wrapRef.current?.clientWidth || 800) / 2, y: 320 });
    const id = uid('ms_');
    setNodes((cur) => [...cur, { id, type: 'milestone', position: freeSpot(want, cur), data: { label: '', deadline_ts: null, onChange: onNodeContent } }]);
  }, [rf, setNodes, onNodeContent, freeSpot]);

  // Double-click empty canvas → drop a note there. Only the pane counts: a
  // double-click on a node (or on a node's textarea, where it selects a word)
  // must never spawn a note behind it.
  const onPaneDoubleClick = useCallback((e) => {
    if (!e.target?.classList?.contains('react-flow__pane')) return;
    addNote(rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
  }, [addNote, rf]);

  const tidy = useCallback(() => {
    const pipe = Scout.getPipe();
    const entries = Object.entries(pipe).filter(([, p]) => p && p.snap);
    entries.forEach(([, p]) => { p.__days = Scout.pipeDays(p); });
    const pos = layoutAll(entries);
    setNodes((cur) => cur.map((n) => pos[n.id] ? { ...n, position: pos[n.id] } : n));
    setTimeout(() => rf.fitView({ duration: 400, padding: 0.15 }), 30);
    Scout.toast?.('Tidied by deadline');
  }, [setNodes, rf]);

  // drag a feed card onto the canvas → place an opportunity node at the drop point
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('application/scout-opp');
    if (!id) return;
    if (!Scout.getPipe()[id]) Scout.pipeSet(id, { stage: 'saved' });
    const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setTimeout(() => {
      setNodes((cur) => {
        if (cur.some((n) => n.id === id)) return cur.map((n) => n.id === id ? { ...n, position: pos } : n);
        const p = Scout.getPipe()[id]; if (!p) return cur;
        return [...cur, { id, type: 'opp', position: pos, data: dataFor(id, p) }];
      });
      Scout.toast?.('Added to your board');
    }, 20);
  }, [rf, setNodes]);
  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);

  const selNode = useMemo(() => nodes.find((n) => n.id === selId) || null, [nodes, selId]);
  const setStage = useCallback((s) => { if (selId) Scout.pipeSet(selId, { stage: s }); }, [selId]);

  const oppCount = nodes.filter((n) => n.type === 'opp').length;
  const isEmpty = nodes.length === 0;

  return (
    <div className="board-wrap" ref={wrapRef} onDrop={onDrop} onDragOver={onDragOver}>
      {paneReady && (
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onSelectionChange={onSelectionChange} onDoubleClick={onPaneDoubleClick}
        nodeTypes={nodeTypes}
        fitView minZoom={0.2} maxZoom={2} deleteKeyCode={['Backspace', 'Delete']}
        zoomOnDoubleClick={false}
        onMove={onMove}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }}
      >
        <Background gap={28} size={1} color="var(--bg-dot)" />
        <StageLanes />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap pannable zoomable position="bottom-right" nodeColor={miniColor} maskColor="rgba(16,16,16,.06)" />
      </ReactFlow>
      )}

      {/* create palette — the closed, opinionated object set */}
      <div className="board-tools">
        <button className="bt" onClick={() => addNote()} title="Add a note (or double-click the canvas)">＋ Note</button>
        <button className="bt" onClick={addMilestone} title="Add a milestone date">＋ Milestone</button>
      </div>

      <div className="board-bar">
        <button className="bb" onClick={tidy} title="Arrange opportunities by deadline">Tidy by deadline</button>
        <button className="bb" onClick={() => rf.fitView({ duration: 400, padding: 0.15 })} title="Fit all">Fit</button>
        <span className="bb-count">{oppCount} tracked · {nodes.length - oppCount} added</span>
      </div>

      {isEmpty && (
        <div className="board-empty">
          <b>Your board is empty</b>
          <p>Drag an opportunity here from the feed, or double-click to drop a note. It becomes a plan you can arrange, link, and apply from.</p>
        </div>
      )}

      {selNode?.type === 'opp' && <Inspector node={selNode} onClose={() => setSelId(null)} onStage={setStage} />}
    </div>
  );
}

// Lane labels name the row a card sits in, so they must track that row as the
// canvas pans and zooms. They follow the viewport vertically but keep a constant
// type size and stay pinned to the left edge — a legible ruler, not a sticker
// floating at a fixed pixel offset over unrelated cards.
function StageLanes() {
  const labels = ['Saved', 'Drafting', 'Sent', 'Heard back'];
  const { y, zoom } = useViewport();
  return (
    <div className="lanes" aria-hidden="true">
      {labels.map((l, i) => (
        <div className="lane" key={l} style={{ top: (Y0 + i * LANE_H - 34) * zoom + y }}><span>{l}</span></div>
      ))}
    </div>
  );
}

function miniColor(n) {
  if (n.type === 'note') return '#EAD9A0';
  if (n.type === 'milestone') return '#101010';
  const c = { saved: '#ABA9A1', draft: '#E8A13A', applied: '#5B7FE8', result: '#1F7A47' };
  return c[n.data?.stage] || '#ABA9A1';
}

export default function Board() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  );
}
