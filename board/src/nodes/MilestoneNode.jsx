import React, { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

// A date marker on the timeline — "Board opens", "Results out", a self-set
// "draft by" gate. Owns its label + date (canvas-native, in scout-board).
function daysTo(ts) {
  if (!ts) return null;
  return Math.ceil((ts * 1000 - Date.now()) / 864e5);
}
function fmt(ts) {
  if (!ts) return 'no date';
  const d = daysTo(ts);
  if (d < 0) return `${Math.abs(d)}d ago`;
  if (d === 0) return 'today';
  return `in ${d}d`;
}

export default function MilestoneNode({ id, data, selected }) {
  const [label, setLabel] = useState(data.label || '');
  useEffect(() => { setLabel(data.label || ''); }, [data.label]);
  const d = daysTo(data.deadline_ts);
  const heat = d == null ? '' : d < 0 ? 'gone' : d <= 3 ? 'now' : d <= 14 ? 'soon' : '';

  return (
    <div className={`ms-node ${selected ? 'sel' : ''}`}>
      <Handle type="target" position={Position.Left} className="opp-h" />
      <Handle type="source" position={Position.Right} className="opp-h" />
      <span className={`ms-flag h-${heat}`} aria-hidden="true" />
      <div className="ms-body">
        <input className="ms-label nodrag" value={label} placeholder="Milestone…"
          onChange={(e) => setLabel(e.target.value)} onBlur={() => data.onChange?.(id, { label })} />
        <label className="ms-date nodrag">
          <span className={`ms-when h-${heat}`}>{fmt(data.deadline_ts)}</span>
          <input type="date" className="ms-dateinput nodrag"
            value={data.deadline_ts ? new Date(data.deadline_ts * 1000).toISOString().slice(0, 10) : ''}
            onChange={(e) => data.onChange?.(id, { deadline_ts: e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : null })} />
        </label>
      </div>
    </div>
  );
}
