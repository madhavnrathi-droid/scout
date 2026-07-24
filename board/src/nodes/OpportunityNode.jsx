import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { STAGE_LABEL } from '../bridge.js';

// A node is a thin reference to a pipeline item by id. All live state (title,
// stage, deadline heat, match) is read from window.Scout at render time, so the
// node never holds stale copies of the truth.
export default function OpportunityNode({ data, selected }) {
  const { title, org, stage, heat, days, match, kept } = data;
  const heatCls = heat?.cls || 'none';
  const stageLabel = STAGE_LABEL[stage] || 'Saved';

  return (
    <div className={`opp-node stage-${stage} ${selected ? 'sel' : ''}`} tabIndex={0} aria-label={`${title}, ${stageLabel}, ${heat?.t || 'no deadline'}`}>
      {/* edges attach here; unobtrusive until hovered */}
      <Handle type="target" position={Position.Left} className="opp-h" />
      <Handle type="source" position={Position.Right} className="opp-h" />

      <div className="opp-top">
        <span className={`opp-stage s-${stage}`}>{stageLabel}</span>
        {typeof match === 'number' && <span className="opp-match">{match}%</span>}
      </div>

      <div className="opp-title" title={title}>{title}</div>
      {org && <div className="opp-org">{org}</div>}

      <div className="opp-foot">
        <span className={`opp-heat h-${heatCls}`}>
          {heatCls === 'now' || heatCls === 'soon' ? <i className="dot" /> : null}
          {heat?.t || 'no date'}
        </span>
        {kept && <span className="opp-kept" title="No longer in the live feed — Scout kept your copy">kept</span>}
      </div>

      {/* draft progress: a thin fill along the bottom edge, only while drafting */}
      {stage === 'draft' && typeof data.pct === 'number' && (
        <div className="opp-prog" aria-hidden="true"><i style={{ width: `${Math.max(4, data.pct)}%` }} /></div>
      )}
    </div>
  );
}
