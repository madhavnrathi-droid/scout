import React, { useEffect, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { STAGE_LABEL } from '../bridge.js';

// A node is a thin reference to a pipeline item by id. All live state (title,
// stage, deadline heat, match) is read from window.Scout at render time, so the
// node never holds stale copies of the truth.
//
// The art follows a three-tier rule rather than the feed's "always show img".
// On the feed you see 2–3 cards; on the board you see 20+. `img` is a stock
// photo for ~2/3 of listings drawn from a pool of only ~50 URLs, so full-bleed
// stock would repeat across the canvas and make distinct opportunities read as
// the same object. So:
//   banner — a genuine org banner (realImg): letterboxed over a blurred copy,
//            exactly as the feed's .im.contain + .blurfill.
//   crest  — stock photo demoted to a blurred wash; the org's own creative
//            (imgThumb) promoted to a centred crest. Per-org identity.
//   plate  — no art: a domain-tinted plate + monogram. Deliberate, not broken.
function shortMoney(n) {
  if (!n || n < 1000) return null;
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n % 1e7 ? 1 : 0)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n % 1e5 ? 1 : 0)}L`;
  return `₹${Math.round(n / 1000)}k`;
}

export default function OpportunityNode({ data, selected }) {
  const { title, org, stage, heat, match, kept, img, realImg, imgThumb, type, prizeCash, applied, dom0 } = data;
  const heatCls = heat?.cls || 'none';
  const stageLabel = STAGE_LABEL[stage] || 'Saved';

  const [artErr, setArtErr] = useState(false);
  const [logoErr, setLogoErr] = useState(false);
  // node data is rebuilt on every scout:pipe event; a node that swaps from
  // snapshot to live listing deserves a fresh attempt at its URLs.
  useEffect(() => { setArtErr(false); setLogoErr(false); }, [img, imgThumb]);

  const hasBanner = !!img && realImg && !artErr;
  const hasCrest = !!imgThumb && !logoErr;
  const tier = hasBanner ? 'banner' : hasCrest ? 'crest' : 'plate';

  const money = shortMoney(prizeCash);
  const crowd = applied > 500 ? `${(applied / 1000).toFixed(1)}k in` : null;
  const monogram = (org || title || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={`opp-node stage-${stage} ${selected ? 'sel' : ''}`} tabIndex={0} aria-label={`${title}, ${stageLabel}, ${heat?.t || 'no deadline'}`}>
      {/* edges attach here; unobtrusive until hovered */}
      <Handle type="target" position={Position.Left} className="opp-h" />
      <Handle type="source" position={Position.Right} className="opp-h" />

      <div className={`opp-im tier-${tier}`} data-dom={dom0 || undefined}>
        {tier === 'banner' && (
          <>
            <img className="opp-blurfill" src={img} alt="" aria-hidden="true" loading="lazy" decoding="async" />
            <img className="opp-mainimg" src={img} alt="" loading="lazy" decoding="async" onError={() => setArtErr(true)} />
          </>
        )}
        {tier === 'crest' && (
          <>
            {!!img && !artErr && (
              <img className="opp-wash" src={img} alt="" aria-hidden="true" loading="lazy" decoding="async" onError={() => setArtErr(true)} />
            )}
            <span className="opp-crest">
              <img src={imgThumb} alt="" loading="lazy" decoding="async" onError={() => setLogoErr(true)} />
            </span>
          </>
        )}
        {tier === 'plate' && <span className="opp-mono" aria-hidden="true">{monogram}</span>}

        <span className="opp-scrim" aria-hidden="true" />
        {type && <span className="opp-type">{type}</span>}
        <span className={`opp-stage s-${stage}`}>{stageLabel}</span>
      </div>

      <div className="opp-bd">
        <div className="opp-title" title={title}>{title}</div>
        {org && <div className="opp-org">{org}</div>}

        {(money || crowd) && (
          <div className="opp-chips">
            {money && <span className="opp-chip money">{money}</span>}
            {crowd && <span className="opp-chip">{crowd}</span>}
          </div>
        )}

        <div className="opp-foot">
          <span className={`opp-heat h-${heatCls}`}>
            {heatCls === 'now' || heatCls === 'soon' ? <i className="dot" /> : null}
            {heat?.t || 'no date'}
          </span>
          <span className="opp-right">
            {kept && <span className="opp-kept" title="No longer in the live feed — Scout kept your copy">kept</span>}
            {typeof match === 'number' && <span className="opp-match">{match}%</span>}
          </span>
        </div>
      </div>

      {/* draft progress: a thin fill along the bottom edge, only while drafting */}
      {stage === 'draft' && typeof data.pct === 'number' && (
        <div className="opp-prog" aria-hidden="true"><i style={{ width: `${Math.max(4, data.pct)}%` }} /></div>
      )}
    </div>
  );
}
