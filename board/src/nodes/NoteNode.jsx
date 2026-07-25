import React, { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

// A canvas-native sticky. Unlike opportunity nodes (thin references to the
// pipeline), a note OWNS its content — it lives fully in scout-board.
const COLORS = ['#FDF3C9', '#E7F2EA', '#EAF0FB', '#FBE9E6', '#FCFCFA'];

export default function NoteNode({ id, data, selected }) {
  const [text, setText] = useState(data.text || '');
  const ref = useRef(null);

  useEffect(() => { setText(data.text || ''); }, [data.text]);
  // a freshly-created note opens straight into editing (place-then-type)
  useEffect(() => { if (data.fresh && ref.current) { ref.current.focus(); } }, [data.fresh]);

  // commit from the DOM value at blur — never a stale closure of `text`
  const commit = (e) => data.onChange?.(id, { text: e.target.value });
  const cycleColor = (e) => {
    e.stopPropagation();
    const i = (COLORS.indexOf(data.color || COLORS[0]) + 1) % COLORS.length;
    data.onChange?.(id, { color: COLORS[i] });
  };

  return (
    <div className={`note-node ${selected ? 'sel' : ''}`} style={{ background: data.color || COLORS[0] }}>
      <NodeResizer minWidth={140} minHeight={90} isVisible={selected} lineClassName="nz-line" handleClassName="nz-h" />
      <Handle type="target" position={Position.Left} className="opp-h" />
      <Handle type="source" position={Position.Right} className="opp-h" />
      <button className="note-swatch nodrag" onClick={cycleColor} title="Change colour" aria-label="Change note colour" />
      <textarea
        ref={ref} className="note-text nodrag nowheel" value={text}
        placeholder="Write a note…"
        onChange={(e) => setText(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur(); }}
      />
    </div>
  );
}
