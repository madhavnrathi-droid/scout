import React from 'react';
import { Scout, STAGE_LABEL } from './bridge.js';

// The right-panel StateCard (Project Vanilla model): on select, show the node's
// state as AGREED / OPEN / OWED / DELTAS, with actions and provenance. This is
// the tier-2 detail surface — the floating toolbar handles cheap edits.
export default function Inspector({ node, onClose, onStage }) {
  if (!node) return null;
  const d = node.data || {};
  const id = d.oppId;
  const opp = Scout.resolveOpp(id) || d.snap || {};
  const stage = d.stage || 'saved';

  const filled = agreed(opp, d);
  const open = openItems(opp, d);
  const owed = d.heat?.t ? [{ text: `Deadline — ${d.heat.t}`, cls: d.heat.cls }] : [];

  return (
    <aside className="insp" role="complementary" aria-label="Details">
      <header className="insp-head">
        <div className="insp-eyebrow">{opp.type || 'Opportunity'}</div>
        <button className="insp-x" onClick={onClose} aria-label="Close details">✕</button>
      </header>

      <h2 className="insp-title">{opp.title || d.title || 'Untitled'}</h2>
      {opp.org && <div className="insp-org">{opp.org}{d.source ? <> · <span className="cite" title={`from ${d.source}`}>from {d.source}</span></> : null}</div>}

      {/* stage control — round-trips through pipeSet to Tracking */}
      <div className="insp-stages" role="tablist" aria-label="Stage">
        {['saved', 'draft', 'applied', 'result'].map((s) => (
          <button key={s} role="tab" aria-selected={stage === s}
            className={`insp-stage ${stage === s ? 'on' : ''}`}
            onClick={() => onStage(s)}>{STAGE_LABEL[s]}</button>
        ))}
      </div>

      <Section title="Ready" empty="Nothing filled in yet">
        {filled.map((f, i) => <Row key={i} mark="✓" text={f} tone="ok" />)}
      </Section>

      <Section title="Still open" empty="Nothing outstanding">
        {open.map((f, i) => <Row key={i} mark="•" text={f} tone="warn" />)}
      </Section>

      {owed.length ? (
        <Section title="On the clock">
          {owed.map((o, i) => <Row key={i} mark="◷" text={o.text} tone={o.cls === 'now' || o.cls === 'soon' ? 'hot' : 'muted'} />)}
        </Section>
      ) : null}

      <div className="insp-actions">
        <button className="insp-btn primary" onClick={() => Scout.applyWithScout(id)}>Let Scout fill it</button>
        <div className="insp-btn-row">
          <button className="insp-btn" onClick={() => Scout.exportEventICS(id)}>Add deadline</button>
          <button className="insp-btn" onClick={() => Scout.openDetail(id)}>Open listing</button>
        </div>
      </div>
    </aside>
  );
}

function Section({ title, empty, children }) {
  const has = React.Children.count(children) > 0 && React.Children.toArray(children).some(Boolean);
  return (
    <section className="insp-sec">
      <div className="insp-sec-h">{title}</div>
      {has ? <div className="insp-rows">{children}</div> : <div className="insp-empty">{empty}</div>}
    </section>
  );
}
function Row({ mark, text, tone }) {
  return <div className={`insp-row t-${tone}`}><span className="rm">{mark}</span><span>{text}</span></div>;
}

// derive AGREED/OPEN from the dossier vs what this opportunity needs
function agreed(opp, d) {
  const out = [];
  if (d.stage === 'applied' || d.stage === 'result') out.push('Application sent');
  if (d.stage === 'draft') out.push(`Draft started${typeof d.pct === 'number' ? ` · ${d.pct}%` : ''}`);
  if (typeof d.match === 'number' && d.match >= 60) out.push(`Strong match for you (${d.match}%)`);
  return out;
}
function openItems(opp, d) {
  const out = [];
  if (d.stage === 'saved') out.push('Not started yet — draft it');
  if (d.stage === 'draft' && (d.pct || 0) < 100) out.push('Draft unfinished');
  if (opp.eligibility) out.push(`Check: ${String(opp.eligibility).slice(0, 80)}`);
  return out;
}
