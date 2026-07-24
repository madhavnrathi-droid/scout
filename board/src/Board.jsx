import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider,
} from '@xyflow/react';
import OpportunityNode from './nodes/OpportunityNode.jsx';
import Inspector from './Inspector.jsx';
import { Scout, onPipeChange, STAGE_LANE } from './bridge.js';

const nodeTypes = { opp: OpportunityNode };

// Layout: x from deadline (sooner = left), y by stage lane. The board is
// TIME-ANCHORED — this is the "order from chaos" moment the design centres on.
const LANE_H = 172, NODE_W = 206, GAP = 26, X0 = 120, Y0 = 60, DAY_PX = 15;
function dayX(days) {
  const d = days == null ? 220 : Math.max(-10, Math.min(days, 220));
  return X0 + Math.max(0, d) * DAY_PX;
}
// Lay ALL nodes at once so same-lane cards never overlap: order each lane by
// deadline, anchor x to the deadline, but push right past the previous card.
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
  const days = Scout.pipeDays(p);
  return {
    oppId: id, title: opp.title || p.snap?.title || 'Untitled', org: opp.org || p.snap?.org || '',
    stage: p.stage, heat: Scout.deadlineHeat(days), days, match: Scout.matchScore(id),
    pct: p.pct, source: opp.display_url || p.snap?.display_url,
    kept: !!(p.snap && !opp.days_left && opp.title == null), snap: p.snap,
  };
}
function nodeFromPipe(id, p, pos) {
  return { id, type: 'opp', position: pos || dayXPos(p), data: dataFor(id, p) };
}
function dayXPos(p) { return { x: dayX(Scout.pipeDays(p)), y: Y0 + (STAGE_LANE[p.stage] ?? 0) * LANE_H }; }

function buildNodes() {
  const pipe = Scout.getPipe();
  const saved = Scout.getBoard();
  const entries = Object.entries(pipe).filter(([, p]) => p && p.snap);
  entries.forEach(([, p]) => { p.__days = Scout.pipeDays(p); });
  const auto = layoutAll(entries);   // collision-free default; saved positions win
  return entries.map(([id, p]) => nodeFromPipe(id, p, saved?.nodes?.[id] || auto[id]));
}

function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, , onEdgesChange] = useEdgesState([]);
  const [selId, setSelId] = useState(null);
  const rf = useReactFlow();
  const wrapRef = useRef(null);

  // rebuild when the pipeline changes elsewhere (Tracking, feed save, apply)
  useEffect(() => onPipeChange(() => {
    setNodes((cur) => {
      const savedPos = Object.fromEntries(cur.map((n) => [n.id, n.position]));
      return buildNodes().map((n) => savedPos[n.id] ? { ...n, position: savedPos[n.id] } : n);
    });
  }), [setNodes]);

  // persist positions (debounced) whenever nodes settle
  const saveTimer = useRef(0);
  const persist = useCallback((ns) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      Scout.saveBoard({ nodes: Object.fromEntries(ns.map((n) => [n.id, n.position])) });
    }, 500);
  }, []);
  useEffect(() => { persist(nodes); }, [nodes, persist]);

  const onSelectionChange = useCallback(({ nodes: sel }) => setSelId(sel?.[0]?.id ?? null), []);

  // tidy: re-lay every node by deadline + stage, animate camera to fit
  const tidy = useCallback(() => {
    const pipe = Scout.getPipe();
    const entries = Object.entries(pipe).filter(([, p]) => p && p.snap);
    entries.forEach(([, p]) => { p.__days = Scout.pipeDays(p); });
    const pos = layoutAll(entries);
    setNodes((cur) => cur.map((n) => pos[n.id] ? { ...n, position: pos[n.id] } : n));
    setTimeout(() => rf.fitView({ duration: 400, padding: 0.15 }), 30);
    Scout.toast?.('Tidied by deadline');
  }, [setNodes, rf]);

  // drag a feed card onto the canvas → place a node at the drop point
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('application/scout-opp');
    if (!id) return;
    Scout.startApply ? null : null;
    // ensure it's in the pipeline as 'saved', then place at drop point
    const pipe = Scout.getPipe();
    if (!pipe[id]) { Scout.pipeSet(id, { stage: 'saved' }); }
    const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setTimeout(() => {
      setNodes((cur) => {
        if (cur.some((n) => n.id === id)) return cur.map((n) => n.id === id ? { ...n, position: pos } : n);
        const p = Scout.getPipe()[id]; if (!p) return cur;
        return [...cur, { ...nodeFromPipe(id, p, null), position: pos }];
      });
      Scout.toast?.('Added to your board');
    }, 20);
  }, [rf, setNodes]);
  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);

  const selNode = useMemo(() => nodes.find((n) => n.id === selId) || null, [nodes, selId]);

  const setStage = useCallback((s) => {
    if (!selId) return;
    Scout.pipeSet(selId, { stage: s });   // dispatches scout:pipe → rebuild
  }, [selId]);

  const isEmpty = nodes.length === 0;

  return (
    <div className="board-wrap" ref={wrapRef} onDrop={onDrop} onDragOver={onDragOver}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView minZoom={0.2} maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background gap={28} size={1} color="var(--bg-dot)" />
        <StageLanes />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap pannable zoomable position="bottom-right" nodeColor={miniColor} maskColor="rgba(16,16,16,.06)" />
      </ReactFlow>

      <div className="board-bar">
        <button className="bb" onClick={tidy} title="Arrange by deadline">Tidy by deadline</button>
        <button className="bb" onClick={() => rf.fitView({ duration: 400, padding: 0.15 })} title="Fit all">Fit</button>
        <span className="bb-count">{nodes.length} on your board</span>
      </div>

      {isEmpty && (
        <div className="board-empty">
          <b>Your board is empty</b>
          <p>Save an opportunity, or drag one here from the feed, and it lands on a deadline timeline you can plan on.</p>
        </div>
      )}

      {selNode && <Inspector node={selNode} onClose={() => setSelId(null)} onStage={setStage} />}
    </div>
  );
}

// faint stage-lane guides behind the canvas (Saved / Drafting / Sent / Heard back)
function StageLanes() {
  const labels = ['Saved', 'Drafting', 'Sent', 'Heard back'];
  return (
    <div className="lanes" aria-hidden="true">
      {labels.map((l, i) => (
        <div className="lane" key={l} style={{ top: Y0 + i * LANE_H - 34 }}><span>{l}</span></div>
      ))}
    </div>
  );
}

function miniColor(n) {
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
