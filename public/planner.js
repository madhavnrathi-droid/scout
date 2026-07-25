/* ═══════════════════════════════════════════════════════════════════════════
   SCOUT PLANNER — the calendar, the planner, and the scheduling engine.

   Loaded as a plain script alongside scout.js and sharing its globals (S, ls,
   esc, ic, toast, resolveOpp, pipeDays, deadlineHeat, pipeSet, openDetail…).
   Vanilla on purpose: every other dashboard section is vanilla, and this needs
   to read and write scout state on every keystroke. The Board is React only
   because React Flow demanded it.

   THE ONE IDEA: a deadline is not a plan. Scout already knows what closes when;
   this turns that into hours you can actually spend, and tells you the truth
   when there aren't enough of them.

   Storage: scout-plan — ONLY what the user authored (events, prefs, stage
   overrides). Deadlines and milestones are never copied in; they are projected
   live from scout-pipe and scout-board every render, so nothing here can go
   stale or disagree with Tracking.
   ═══════════════════════════════════════════════════════════════════════════ */

const PLAN_KEY = 'scout-plan';
const DAY_MS = 864e5;

/* ————— the five kinds of thing that can sit on a day —————
   A closed set, deliberately. Every one has a colour, an icon, and a rule for
   whether the user may move it: derived things follow their source. */
const CALS = {
  deadline:  { label: 'Deadlines',  color: '#FF4B2E', icon: 'zap',      derived: true,  movable: false },
  block:     { label: 'Work',       color: '#5B7FE8', icon: 'pen',      derived: false, movable: true },
  milestone: { label: 'Milestones', color: '#8B5CF6', icon: 'pin',      derived: true,  movable: false },
  event:     { label: 'Events',     color: '#1F7A47', icon: 'users',    derived: false, movable: true },
  task:      { label: 'Tasks',      color: '#B8791F', icon: 'check',    derived: false, movable: true },
};
const PSTAGES = [
  ['todo',    'To-do'],
  ['doing',   'In progress'],
  ['blocked', 'Blocked'],
  ['done',    'Done'],
];
const STAGE_LABEL_P = Object.fromEntries(PSTAGES);

/* ————— storage ————— */
/* One-time sweep: blocks carrying no title, no linked opportunity and no note
   hold zero information — they are artefacts of the old click-creates-a-block
   bug. Anything the user actually authored (a title, a link, a note) is kept. */
function sweepEmpties() {
  const p = ls(PLAN_KEY); if (!p || !Array.isArray(p.events)) return 0;
  const before = p.events.length;
  p.events = p.events.filter((e) => (e.title || '').trim() || e.oppId || (e.note || '').trim());
  const gone = before - p.events.length;
  if (gone) ls(PLAN_KEY, p);
  return gone;
}

function getPlan() {
  const p = ls(PLAN_KEY) || {};
  return {
    events: Array.isArray(p.events) ? p.events : [],
    stages: p.stages || {},          // id → stage, for DERIVED items the user has moved
    prefs: Object.assign({
      workStart: 9, workEnd: 22, focusLen: 90, minBlock: 30,
      days: [1, 2, 3, 4, 5, 6, 0],   // which weekdays Scout may schedule into
      hidden: [],                    // hidden calendar keys
      view: 'week', firstDay: 1,
    }, p.prefs || {}),
  };
}
function savePlan(p) { if (!S.demo) ls(PLAN_KEY, p); }
function planPrefs() { return getPlan().prefs; }
function setPref(k, v) { const p = getPlan(); p.prefs[k] = v; savePlan(p); }

/* ————— date helpers (local time throughout; a deadline is local to the user) ————— */
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
function startOfWeek(d, firstDay) {
  const x = startOfDay(d); const fd = firstDay == null ? 1 : firstDay;
  const diff = (x.getDay() - fd + 7) % 7; x.setDate(x.getDate() - diff); return x;
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();
const isToday = (d) => sameDay(d, new Date());
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DOW_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function fmtTime(ms) {
  const d = new Date(ms); let h = d.getHours(); const m = d.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${ap}` : `${h}${ap}`;
}
/* "10:14 – 11:44am" rather than "10:14am — 11:44am": inside a ~145px column the
   long form wraps to two lines and shoves everything below it out of the block. */
function fmtRange(a, b) {
  const A = fmtTime(a), B = fmtTime(b);
  return (A.slice(-2) === B.slice(-2) ? A.slice(0, -2) : A) + '–' + B;
}
const plDur = (ms) => { const h = ms / 36e5; return h >= 1 ? `${Number(h.toFixed(1))}h` : `${Math.round(ms / 6e4)}m`; };
function fmtDayLabel(d) {
  if (isToday(d)) return 'Today';
  if (sameDay(d, addDays(new Date(), 1))) return 'Tomorrow';
  if (sameDay(d, addDays(new Date(), -1))) return 'Yesterday';
  return `${DOW_FULL[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

/* ═══════════ THE EVENT MODEL ═══════════
   collectEvents() is the single source of everything the calendar draws. It
   PROJECTS derived items rather than storing them, so a stage change in
   Tracking or a milestone edit on the Board shows up here on the next paint. */

function deadlineEvents() {
  const out = [];
  for (const [id, p] of Object.entries(S.pipe || {})) {
    if (!p || !p.snap || !p.snap.deadline_ts) continue;
    if (p.stage === 'result') continue;                     // already heard back
    const ts = p.snap.deadline_ts * 1000;
    out.push({
      id: 'dl_' + id, cal: 'deadline', oppId: id,
      title: shortTitle(p.snap) || p.snap.title || 'Deadline',
      org: p.snap.org || '', start: ts, end: ts, point: true,
      pct: p.pct || 0, pipeStage: p.stage,
      sub: p.stage === 'draft' ? `draft ${p.pct || 0}% done` : 'not started',
    });
  }
  return out;
}
function milestoneEvents() {
  const b = ls('scout-board') || {};
  return (b.milestones || []).filter((m) => m.deadline_ts).map((m) => ({
    id: 'ms_' + m.id, cal: 'milestone', title: m.label || 'Milestone',
    start: m.deadline_ts * 1000, end: m.deadline_ts * 1000, point: true,
    sub: 'from your board', boardId: m.id,
  }));
}
function reminderEvents() {
  return (typeof reminders === 'function' ? reminders() : []).filter((r) => !r.done && r.due).map((r) => ({
    id: 'rm_' + r.id, cal: 'deadline', title: r.title || 'Reminder', oppId: r.oppId,
    start: r.due, end: r.due, point: true, sub: 'reminder', reminder: true,
  }));
}
/* Everything, in one list, with stage + derived state resolved. */
function collectEvents() {
  const plan = getPlan();
  const all = [...plan.events, ...deadlineEvents(), ...milestoneEvents(), ...reminderEvents()];
  const hidden = new Set(plan.prefs.hidden || []);
  return all
    .filter((e) => !hidden.has(e.cal))
    .map((e) => {
      const stage = e.stage || plan.stages[e.id] || (e.pipeStage === 'applied' ? 'done' : 'todo');
      const blank = !(e.title || '').trim();
      return Object.assign({}, e, { stage, state: deriveState(e, stage), untitled: blank, title: blank ? 'Untitled' : e.title });
    })
    .sort((a, b) => a.start - b.start || (a.point ? -1 : 1));
}
function eventById(id) { return collectEvents().find((e) => e.id === id) || null; }

/* State is DERIVED, never stored — it is a fact about the clock, and storing it
   would let it drift the moment the user leaves the tab open overnight. */
function deriveState(e, stage) {
  const now = Date.now();
  if (stage === 'done') return 'done';
  if (stage === 'blocked') return 'blocked';
  const end = e.end || e.start;
  if (end < now) return 'overdue';
  if (e.start <= now && end >= now) return 'now';
  if (e.start - now < 36e5) return 'next';
  return 'upcoming';
}
const STATE_WORD = { done: 'Done', blocked: 'Blocked', overdue: 'Overdue', now: 'Happening now', next: 'Up next', upcoming: '' };

/* ═══════════ THE ENGINE ═══════════
   Everything below is deterministic and works offline. That matters: a plan you
   can't recompute on a train is not a plan. The LLM is used for language and
   for prep-chain wording, never for the arithmetic — so the numbers are always
   explainable, and every scheduled block can say WHY it is where it is. */

/* How long an application actually takes, by type and by how far along it is.
   Hours are deliberately conservative — a plan that lies about cost is worse
   than no plan. */
const EFFORT_BASE = {
  Scholarship: 5, Fellowship: 8, Grant: 9, Internship: 4, Competition: 4,
  Hackathon: 12, Conference: 3, Talk: 3, Workshop: 2, Quiz: 1, Meetup: 1,
  Volunteering: 2, Networking: 1, Exhibition: 1,
};
function effortFor(oppId) {
  const p = (S.pipe || {})[String(oppId)];
  const o = (typeof resolveOpp === 'function' ? resolveOpp(oppId) : null) || (p && p.snap) || {};
  const base = EFFORT_BASE[o.type] || 4;
  const pct = (p && p.pct) || 0;
  const remaining = base * (1 - pct / 100);
  const why = [`${o.type || 'Application'} ≈ ${base}h typical`];
  if (pct) why.push(`${pct}% already drafted`);
  return { hours: Math.max(0.5, Math.round(remaining * 2) / 2), base, pct, why };
}

/* Free time between now and a horizon, honouring work hours and existing
   commitments. Returns slots, largest-first inside each day, earliest day first. */
/* extraBusy lets a caller treat blocks it has just decided on — but not yet
   saved — as occupied. Without it, a planner that books several items in one
   pass hands them all the same gap. */
function freeSlots(fromMs, toMs, extraBusy) {
  const pr = planPrefs();
  const busy = collectEvents().filter((e) => !e.point && e.end > fromMs && e.start < toMs)
    .map((e) => [e.start, e.end])
    .concat((extraBusy || []).map((e) => [e.start, e.end]))
    .sort((a, b) => a[0] - b[0]);
  const slots = [];
  for (let d = startOfDay(fromMs); d.getTime() < toMs; d = addDays(d, 1)) {
    if (!(pr.days || []).includes(d.getDay())) continue;
    let s = new Date(d); s.setHours(pr.workStart, 0, 0, 0);
    let e = new Date(d); e.setHours(pr.workEnd, 0, 0, 0);
    let cur = Math.max(s.getTime(), fromMs);
    const dayEnd = Math.min(e.getTime(), toMs);
    for (const [bs, be] of busy) {
      if (be <= cur || bs >= dayEnd) continue;
      if (bs - cur >= pr.minBlock * 6e4) slots.push([cur, bs]);
      cur = Math.max(cur, be);
    }
    if (dayEnd - cur >= pr.minBlock * 6e4) slots.push([cur, dayEnd]);
  }
  return slots;
}
const slotHours = (slots) => slots.reduce((n, [a, b]) => n + (b - a) / 36e5, 0);

/* Demand vs supply — the number that makes the calendar honest.
   "You have 14h before Friday and need 23h" is the single most useful sentence
   this product can say, and nothing else in Scout was saying it. */
function capacityReport(horizonDays) {
  const days = horizonDays || 7;
  const from = Date.now(), to = from + days * DAY_MS;
  const supply = slotHours(freeSlots(from, to));
  const items = [];
  for (const [id, p] of Object.entries(S.pipe || {})) {
    if (!p || !p.snap || !p.snap.deadline_ts) continue;
    if (!['saved', 'draft'].includes(p.stage)) continue;
    const due = p.snap.deadline_ts * 1000;
    if (due < from || due > to) continue;
    const ef = effortFor(id);
    items.push({ id, title: shortTitle(p.snap) || p.snap.title, due, hours: ef.hours, pct: ef.pct, ef });
  }
  items.sort((a, b) => a.due - b.due);
  const demand = items.reduce((n, i) => n + i.hours, 0);
  // Greedy by deadline: what actually fits, and therefore what slips.
  let left = supply; const fits = [], slips = [];
  for (const it of items) { if (it.hours <= left) { fits.push(it); left -= it.hours; } else slips.push(it); }
  return { supply: Math.round(supply * 10) / 10, demand: Math.round(demand * 10) / 10, items, fits, slips, days };
}

/* Back-plan: lay real work blocks into real gaps, working from the nearest
   deadline outward, splitting into focus-length sessions and never scheduling
   the last session flush against the deadline (buffer is not optional). */
function planWeek(horizonDays) {
  const pr = planPrefs();
  const rep = capacityReport(horizonDays || 7);
  const plan = getPlan();
  // Replace only previously auto-planned blocks — never touch what the user placed.
  plan.events = plan.events.filter((e) => !(e.ai && e.cal === 'block' && e.start > Date.now() && e.stage !== 'done'));
  savePlan(plan);

  const made = [];
  for (const it of rep.items) {
    const buffer = Math.min(DAY_MS, Math.max(6 * 36e5, it.hours * 36e5 * 0.2));
    const deadlineCut = it.due - buffer;
    let need = it.hours * 36e5;
    const slots = freeSlots(Date.now(), deadlineCut, made);
    for (const [ss, se] of slots) {
      if (need <= 0) break;
      let cur = ss;
      while (need > 0 && se - cur >= pr.minBlock * 6e4) {
        const len = Math.min(need, pr.focusLen * 6e4, se - cur);
        if (len < pr.minBlock * 6e4) break;
        made.push({
          id: 'b' + Math.random().toString(36).slice(2, 9),
          cal: 'block', oppId: it.id, title: it.title, start: cur, end: cur + len,
          stage: 'todo', ai: true,
          why: `${Math.round(len / 36e5 * 10) / 10}h of the ${it.hours}h this needs · deadline ${fmtDayLabel(new Date(it.due))}`,
        });
        cur += len; need -= len;
      }
    }
    it.scheduled = it.hours - need / 36e5;
  }
  const p2 = getPlan(); p2.events = p2.events.concat(made); savePlan(p2);
  return { made: made.length, rep };
}

/* A prep chain: the steps before a deadline, dated backwards from it.
   Deterministic by type so it works offline; the copilot can rewrite the wording
   later, but the DATES are always ours. */
const CHAINS = {
  Scholarship: ['Confirm eligibility', 'Gather transcripts', 'Draft the essay', 'Get a recommender to commit', 'Final read + submit'],
  Fellowship: ['Confirm eligibility', 'Research the panel', 'Draft the statement', 'Two recommenders confirmed', 'Polish + submit'],
  Grant: ['Confirm scope fits', 'Budget sheet', 'Draft the proposal', 'Internal review', 'Submit'],
  Internship: ['Tailor the CV', 'Write the cover note', 'Referral ask', 'Apply'],
  Hackathon: ['Form the team', 'Pick the problem', 'Build the prototype', 'Record the demo', 'Submit'],
  Competition: ['Read the rules', 'Prepare the entry', 'Practice run', 'Submit'],
  _: ['Confirm eligibility', 'Prepare materials', 'Draft', 'Review', 'Submit'],
};
function prepChain(oppId) {
  const p = (S.pipe || {})[String(oppId)]; if (!p || !p.snap || !p.snap.deadline_ts) return [];
  const o = (typeof resolveOpp === 'function' ? resolveOpp(oppId) : null) || p.snap;
  const steps = CHAINS[o.type] || CHAINS._;
  const due = p.snap.deadline_ts * 1000;
  const span = Math.max(DAY_MS * 2, Math.min(due - Date.now(), 21 * DAY_MS));
  const gap = span / (steps.length + 1);
  return steps.map((s, i) => ({
    id: 'b' + Math.random().toString(36).slice(2, 9) + i,
    cal: 'task', oppId: String(oppId), title: s, point: true, stage: 'todo', ai: true,
    start: due - gap * (steps.length - i), end: due - gap * (steps.length - i),
    why: `step ${i + 1} of ${steps.length} for ${shortTitle(o) || o.title}`,
  }));
}

/* Natural-language quick add. Deterministic parser — "sop for reliance tue 4pm 2h"
   works with the network off, which is the point of a capture box. */
function parseQuickAdd(text) {
  const t = (text || '').trim(); if (!t) return null;
  let rest = t, start = null, mins = 60, cal = 'block', point = false;
  const low = t.toLowerCase();

  if (/\btask\b|^todo\b/.test(low)) { cal = 'task'; point = true; }
  if (/\bmeet|call|interview|exam|class\b/.test(low)) cal = 'event';

  // duration: 2h, 90m, 1.5h
  const dm = low.match(/\b(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/) || low.match(/\b(\d+)\s*(m|min|mins|minutes)\b/);
  if (dm) { mins = /h/.test(dm[2]) ? Math.round(parseFloat(dm[1]) * 60) : parseInt(dm[1], 10); rest = rest.replace(dm[0], ''); }

  // day: today / tomorrow / weekday / dd-mm
  const base = startOfDay(new Date());
  let day = null;
  if (/\btoday\b/.test(low)) day = base;
  else if (/\btomorrow\b|\btmrw\b/.test(low)) day = addDays(base, 1);
  else {
    const wd = low.match(/\b(sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*\b/);
    if (wd) {
      const idx = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].findIndex((d) => wd[1].startsWith(d));
      day = new Date(base); const delta = (idx - base.getDay() + 7) % 7 || 7; day.setDate(day.getDate() + delta);
    }
  }
  if (day) rest = rest.replace(/\b(today|tomorrow|tmrw|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)[a-z]*\b/i, '');

  // time: 4pm, 16:30, 9.30am
  const tm = low.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/) || low.match(/\b(\d{1,2}):(\d{2})\b/);
  if (tm) {
    let h = parseInt(tm[1], 10); const mn = parseInt(tm[2] || '0', 10);
    if (tm[3] === 'pm' && h < 12) h += 12; if (tm[3] === 'am' && h === 12) h = 0;
    start = new Date(day || base); start.setHours(h, mn, 0, 0);
    rest = rest.replace(tm[0], '');
  } else if (day) { start = new Date(day); start.setHours(planPrefs().workStart, 0, 0, 0); }

  if (!start) { start = new Date(Math.ceil(Date.now() / 18e5) * 18e5); }
  // link to a tracked opportunity by fuzzy title match
  let oppId = null;
  const words = rest.toLowerCase().replace(/\bfor\b|\bon\b|\bat\b/g, ' ').split(/\s+/).filter((w) => w.length > 3);
  for (const [id, p] of Object.entries(S.pipe || {})) {
    const title = ((p.snap && p.snap.title) || '').toLowerCase();
    const org = ((p.snap && p.snap.org) || '').toLowerCase();
    if (words.some((w) => title.includes(w) || org.includes(w))) { oppId = id; break; }
  }
  const title = rest.replace(/\s+/g, ' ').trim().replace(/^[-–—,]/, '').trim();
  return {
    id: 'b' + Math.random().toString(36).slice(2, 9), cal, oppId,
    title: title || 'Untitled', start: start.getTime(),
    end: point ? start.getTime() : start.getTime() + mins * 6e4, point, stage: 'todo',
  };
}

/* Conflicts + overload: two things at once, or a day asked to hold more than
   the user's own working hours allow. */
function conflictsFor(list) {
  const timed = list.filter((e) => !e.point).sort((a, b) => a.start - b.start);
  const bad = new Set();
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length; j++) {
      if (timed[j].start >= timed[i].end) break;
      bad.add(timed[i].id); bad.add(timed[j].id);
    }
  }
  return bad;
}
function dayLoad(d, list) {
  const s = startOfDay(d).getTime(), e = endOfDay(d).getTime();
  const h = list.filter((x) => !x.point && x.end > s && x.start < e)
    .reduce((n, x) => n + (Math.min(x.end, e) - Math.max(x.start, s)) / 36e5, 0);
  const pr = planPrefs();
  return { hours: Math.round(h * 10) / 10, cap: pr.workEnd - pr.workStart, over: h > (pr.workEnd - pr.workStart) };
}

/* ————— mutations ————— */
function planAdd(ev) { const p = getPlan(); p.events.push(ev); savePlan(p); }
function planAddMany(list) { const p = getPlan(); p.events = p.events.concat(list); savePlan(p); }
function planUpdate(id, patch) {
  const p = getPlan(); const i = p.events.findIndex((e) => e.id === id);
  if (i >= 0) { p.events[i] = Object.assign({}, p.events[i], patch); savePlan(p); return true; }
  // derived item: we can still remember a stage the user set
  if (patch.stage) { p.stages[id] = patch.stage; savePlan(p); return true; }
  return false;
}
function planRemove(id) { const p = getPlan(); p.events = p.events.filter((e) => e.id !== id); savePlan(p); }
function plSetStage(id, stage) {
  planUpdate(id, { stage });
  // a finished work block on a tracked opportunity nudges the pipeline forward
  const ev = eventById(id);
  if (ev && ev.oppId && stage === 'done' && (S.pipe || {})[ev.oppId]) {
    const p = S.pipe[ev.oppId];
    if (p.stage === 'saved') pipeSet(ev.oppId, { stage: 'draft', pct: Math.max(p.pct || 0, 15) });
  }
  renderPlanner();
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIEWS
   Shell → toolbar (title · view switch · calendar chips) → the grid → inspector.
   Structure follows the supplied references: the week grid is ref-5 (time
   gutter, day columns, pastel blocks, black now-pill, per-column quick-add),
   the agenda is ref-4 (time rail with connected checkboxes), the month is
   ref-2 (cells with category dots + a stat strip).
   ═══════════════════════════════════════════════════════════════════════════ */

/* Scout's icon map has no chevron, and a rotated compass reads as a compass.
   One inline glyph is cheaper than polluting the shared IC map. */
const chev = (dir) => `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${dir < 0 ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}"/></svg>`;

const VIEWS = [['month', 'Month'], ['week', 'Week'], ['day', 'Day'], ['agenda', 'Agenda'], ['planner', 'Planner']];
const PL = { anchor: Date.now(), view: null, sel: null, dragging: null };

function planView() { return PL.view || planPrefs().view || 'week'; }
function setView(v) { PL.view = v; setPref('view', v); renderPlanner(); }
function planGo(dir) {
  const v = planView(); const a = new Date(PL.anchor);
  if (v === 'month') a.setMonth(a.getMonth() + dir);
  else if (v === 'week' || v === 'planner') a.setDate(a.getDate() + 7 * dir);
  else if (v === 'day') a.setDate(a.getDate() + dir);
  else a.setDate(a.getDate() + 7 * dir);
  PL.anchor = a.getTime(); renderPlanner();
}
function planToday() { PL.anchor = Date.now(); renderPlanner(); }

function rangeTitle() {
  const v = planView(), a = new Date(PL.anchor);
  if (v === 'month') return `${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
  if (v === 'day') return `${DOW_FULL[a.getDay()]} ${a.getDate()} ${MONTHS[a.getMonth()]}`;
  const s = startOfWeek(a, planPrefs().firstDay), e = addDays(s, 6);
  const sm = MONTHS[s.getMonth()].slice(0, 3), em = MONTHS[e.getMonth()].slice(0, 3);
  return sm === em ? `${s.getDate()}–${e.getDate()} ${sm} ${e.getFullYear()}`
                   : `${s.getDate()} ${sm} – ${e.getDate()} ${em} ${e.getFullYear()}`;
}

/* ————— the section shell ————— */
function dashCalendar() {
  const rep = capacityReport(7);
  const pr = planPrefs();
  const hidden = new Set(pr.hidden || []);
  return `<section class="pl" id="pl-root">
    <header class="pl-top">
      <div class="pl-title-row">
        <h1 class="pl-title">${rangeTitle()}</h1>
        <div class="pl-nav">
          <button class="pl-ic" onclick="planGo(-1)" aria-label="Previous">${chev(-1)}</button>
          <button class="pl-today" onclick="planToday()">Today</button>
          <button class="pl-ic" onclick="planGo(1)" aria-label="Next">${chev(1)}</button>
        </div>
      </div>
      <div class="pl-bar">
        <div class="pl-views" role="tablist">
          ${VIEWS.map(([v, l]) => `<button role="tab" aria-selected="${planView() === v}" class="pl-v ${planView() === v ? 'on' : ''}" onclick="setView('${v}')">${l}</button>`).join('')}
        </div>
        <div class="pl-chips">
          ${Object.entries(CALS).map(([k, c]) => `<button class="pl-chip ${hidden.has(k) ? 'off' : 'on'}" style="--c:${c.color}" onclick="toggleCal('${k}')" aria-pressed="${!hidden.has(k)}"><i class="pl-dot"></i>${c.label}</button>`).join('')}
        </div>
      </div>
    </header>

    ${capacityStrip(rep)}

    <div class="pl-quick">
      <span class="pl-q-ic">${ic('plus', 16)}</span>
      <input id="pl-q" class="pl-q-in" placeholder="Add anything — “draft SoP for Reliance tue 4pm 2h”" autocomplete="off"
        onkeydown="if(event.key==='Enter'){quickAdd(this.value);this.value=''}" oninput="quickHint(this.value)">
      <span class="pl-q-hint" id="pl-q-hint"></span>
    </div>

    <div class="pl-split ${planView() === 'planner' ? 'solo' : ''} ${['week', 'month'].includes(planView()) ? 'grid7' : ''}">
      <div class="pl-stage" id="pl-stage">${renderStage()}</div>
      <aside class="pl-rail-col" id="pl-insp">${plRailHTML()}</aside>
    </div>
  </section>`;
}

/* ═══════════ THE RAIL ═══════════
   The right column is the most valuable space on the page, so it is never
   blank. Unselected it answers "what should I do next?"; selected it becomes
   the inspector for that one thing. Same column, two states.

   Ordering follows Project Vanilla's ranking rule: every ranked item carries
   the REASON it is ranked there, in words, next to it. A list that won't say
   why it chose its order is just a list. */

/* One 5-step severity ramp, ported from Vanilla's risk scale into light mode. */
function severity(e) {
  if (e.stage === 'done') return { k: 'clear', n: 0 };
  const days = (e.start - Date.now()) / DAY_MS;
  if (e.state === 'overdue') return { k: 'critical', n: 4 };
  if (days <= 1) return { k: 'high', n: 3 };
  if (days <= 3) return { k: 'medium', n: 2 };
  if (days <= 7) return { k: 'low', n: 1 };
  return { k: 'clear', n: 0 };
}

/* What actually needs the user, worst first, each with its reason. */
function needsYou() {
  const out = [];
  for (const e of collectEvents()) {
    if (e.stage === 'done') continue;
    if (e.untitled) continue;                  // an unnamed scrap is not a priority
    const sev = severity(e);
    let why = null;
    if (e.state === 'overdue') why = e.cal === 'deadline' ? 'closed — you never sent it' : 'this slot has passed';
    else if (e.cal === 'deadline') {
      const d = Math.ceil((e.start - Date.now()) / DAY_MS);
      const pct = (S.pipe[e.oppId] || {}).pct || 0;
      if (d <= 3) why = `${d <= 0 ? 'closes today' : d + 'd left'} · draft ${pct}% done`;
      else if (d <= 7 && pct < 60) why = `${d}d left · draft ${pct}% done`;
    } else if (e.state === 'blocked') why = 'you marked this blocked';
    if (why) out.push({ e, sev, why });
  }
  return out.sort((a, b) => b.sev.n - a.sev.n || a.e.start - b.e.start).slice(0, 5);
}

function plRailHTML() {
  const need = needsYou();
  const next = collectEvents().filter((e) => e.stage !== 'done' && !e.untitled && (e.end || e.start) >= Date.now()).slice(0, 4);
  return `<div class="plr">
    ${planView() === 'month' ? '' : miniMonth()}
    <section class="plr-sec">
      <h5>Needs you</h5>
      ${need.length ? `<ul class="plr-list">${need.map(({ e, sev, why }) => `
        <li class="plr-item r-${sev.k}" data-id="${e.id}">
          <i class="plr-pip"></i>
          <div><b>${esc(e.title)}</b><em>${esc(why)}</em></div>
          ${e.oppId ? `<button class="plr-go" onclick="event.stopPropagation();applyWithScout('${e.oppId}')" title="Let Scout draft it">${ic('spark', 13)}</button>` : ''}
        </li>`).join('')}</ul>`
        : `<p class="plr-none">${ic('check', 14)} Nothing is at risk. That is the whole point.</p>`}
    </section>
    <section class="plr-sec">
      <h5>Up next</h5>
      ${next.length ? `<ul class="plr-list tight">${next.map((e) => `
        <li class="plr-item" data-id="${e.id}">
          <i class="plr-pip" style="background:${CALS[e.cal].color}"></i>
          <div><b>${esc(e.title)}</b><em>${fmtDayLabel(new Date(e.start))}${e.point ? '' : ' · ' + fmtTime(e.start)}</em></div>
        </li>`).join('')}</ul>`
        : `<p class="plr-none">Nothing scheduled ahead.</p>`}
    </section>
  </div>`;
}

/* A month at a glance — jump anywhere without leaving the week. */
function miniMonth() {
  const a = new Date(PL.anchor), pr = planPrefs();
  const first = new Date(a.getFullYear(), a.getMonth(), 1);
  const gs = startOfWeek(first, pr.firstDay);
  const all = collectEvents();
  const busy = new Set(all.map((e) => startOfDay(e.start).getTime()));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = addDays(gs, i), t = startOfDay(d).getTime();
    if (i >= 35 && d.getMonth() !== a.getMonth()) break;
    cells += `<button class="mm-c ${d.getMonth() !== a.getMonth() ? 'out' : ''} ${isToday(d) ? 'today' : ''} ${sameDay(d, a) ? 'sel' : ''}"
      onclick="PL.anchor=${t};renderPlanner()">${d.getDate()}${busy.has(t) ? '<i></i>' : ''}</button>`;
  }
  return `<section class="plr-sec mm">
    <header class="mm-h"><b>${MONTHS[a.getMonth()]} ${a.getFullYear()}</b>
      <span><button onclick="planGo(-1)" aria-label="Previous month">${chev(-1)}</button><button onclick="planGo(1)" aria-label="Next month">${chev(1)}</button></span></header>
    <div class="mm-w">${Array.from({ length: 7 }, (_, i) => `<span>${DOW[(pr.firstDay + i) % 7][0]}</span>`).join('')}</div>
    <div class="mm-g">${cells}</div>
  </section>`;
}
function renderRail() {
  const host = document.getElementById('pl-insp'); if (!host) return;
  host.classList.remove('open');
  host.innerHTML = plRailHTML();
  hydrateIcons(host);
  host.querySelectorAll('.plr-item').forEach((li) => li.addEventListener('click', () => openInspector(li.dataset.id)));
}

/* The honesty strip: hours you have vs hours you owe. Ref-2's stat row. */
function capacityStrip(rep) {
  const tight = rep.demand > rep.supply;
  const pct = rep.demand ? Math.min(100, Math.round(rep.supply / rep.demand * 100)) : 100;
  return `<div class="pl-cap ${tight ? 'tight' : ''}">
    <div class="pl-cap-k"><span class="k">Free next 7 days</span><b>${rep.supply}h</b></div>
    <div class="pl-cap-k"><span class="k">Work it needs</span><b>${rep.demand}h</b></div>
    <div class="pl-cap-k"><span class="k">${tight ? 'Short by' : 'Spare'}</span><b class="${tight ? 'bad' : 'good'}">${Math.abs(Math.round((rep.supply - rep.demand) * 10) / 10)}h</b></div>
    <div class="pl-cap-bar" title="${pct}% of the work fits"><i style="width:${pct}%"></i></div>
    <div class="pl-cap-act">
      ${rep.items.length ? `<button class="pill pill-dark pill-sm" onclick="runPlanWeek()">${ic('spark', 14)} Plan my week</button>` : ''}
      ${rep.slips.length ? `<button class="pill pill-ghost pill-sm" onclick="openTriage()">${rep.slips.length} won’t fit</button>` : ''}
    </div>
  </div>`;
}

function renderStage() {
  const v = planView();
  if (v === 'month') return viewMonth();
  if (v === 'day') return viewDay();
  if (v === 'agenda') return viewAgenda();
  if (v === 'planner') return viewPlanner();
  return viewWeek();
}
function renderPlanner() {
  const root = document.getElementById('pl-root');
  if (!root) return;
  PL.kept = true;                       // a re-render must not throw away scroll position
  const keepScroll = (document.querySelector('.dash-main') || {}).scrollTop || 0;
  const host = document.getElementById('dash-body');
  host.innerHTML = (typeof demoBanner === 'function' ? demoBanner() : '') + dashCalendar();
  hydrateIcons(host);
  wirePlanner();
  const main = document.querySelector('.dash-main'); if (main) main.scrollTop = keepScroll;
  if (PL.sel) openInspector(PL.sel, true);
}
function toggleCal(k) {
  const p = getPlan(); const h = new Set(p.prefs.hidden || []);
  h.has(k) ? h.delete(k) : h.add(k);
  p.prefs.hidden = [...h]; savePlan(p); renderPlanner();
}

/* ————— WEEK (ref 5) ————— */
const PX_H = 76;                        // one hour of grid — the refs breathe
function viewWeek() {
  const pr = planPrefs();
  const s = startOfWeek(new Date(PL.anchor), pr.firstDay);
  const days = Array.from({ length: 7 }, (_, i) => addDays(s, i));
  const all = collectEvents();
  const conflicts = conflictsFor(all);
  const h0 = 0, h1 = 24;
  const nowT = new Date();

  const gutter = Array.from({ length: h1 - h0 }, (_, i) =>
    `<div class="pl-h" style="height:${PX_H}px"><span>${i === 0 ? '' : fmtTime(new Date(2000, 0, 1, i).getTime())}</span></div>`).join('');

  const cols = days.map((d) => {
    const dayS = startOfDay(d).getTime(), dayE = endOfDay(d).getTime();
    const timed = all.filter((e) => !e.point && e.end > dayS && e.start < dayE);
    const pts = all.filter((e) => e.point && e.start >= dayS && e.start <= dayE);
    const lanes = layoutLanes(timed);
    const load = dayLoad(d, all);
    return `<div class="pl-col ${isToday(d) ? 'today' : ''}" data-day="${dayS}">
      <div class="pl-col-allday">${pts.map((e) => pointPill(e)).join('')}</div>
      <div class="pl-col-grid" data-day="${dayS}">
        ${Array.from({ length: h1 - h0 }, (_, i) => `<div class="pl-slot" style="height:${PX_H}px" data-hour="${i}"></div>`).join('')}
        ${isToday(d) ? `<div class="pl-now" style="top:${(nowT.getHours() + nowT.getMinutes() / 60) * PX_H}px"><i></i></div>` : ''}
        ${lanes.map(({ e, lane, of }) => blockEl(e, dayS, lane, of, conflicts.has(e.id))).join('')}
      </div>
      ${load.over ? `<div class="pl-over" title="More scheduled than your working day">${load.hours}h · over</div>` : ''}
    </div>`;
  }).join('');

  return `<div class="pl-week" id="pl-week">
    <div class="pl-week-head">
      <div class="pl-gutter-head"></div>
      ${days.map((d) => `<div class="pl-dh ${isToday(d) ? 'on' : ''}"><span class="n">${d.getDate()}</span><span class="w">${DOW_FULL[d.getDay()]}</span></div>`).join('')}
    </div>
    <div class="pl-week-body" id="pl-week-body">
      <div class="pl-gutter">${gutter}</div>
      ${cols}
    </div>
  </div>`;
}
/* Side-by-side overlap: classic interval-graph lane packing. */
function layoutLanes(list) {
  const sorted = [...list].sort((a, b) => a.start - b.start || b.end - a.end);
  const lanes = []; const out = [];
  for (const e of sorted) {
    let i = lanes.findIndex((end) => end <= e.start);
    if (i < 0) { i = lanes.length; lanes.push(0); }
    lanes[i] = e.end; out.push({ e, lane: i });
  }
  const of = Math.max(1, lanes.length);
  return out.map((o) => Object.assign(o, { of }));
}
function blockEl(e, dayS, lane, of, conflict) {
  const c = CALS[e.cal] || CALS.block;
  const top = (Math.max(e.start, dayS) - dayS) / 36e5 * PX_H;
  const h = Math.max(22, (Math.min(e.end, dayS + DAY_MS) - Math.max(e.start, dayS)) / 36e5 * PX_H);
  const w = 100 / of;
  /* Show only what actually fits. Clipped text reads as broken, and a block
     that has to truncate its own reason is better off not showing one:
       < 46px   title only, one line
       < 78px   title (1 line) + time
       < 116px  title (2 lines) + time
       ≥ 116px  title (2 lines) + time + why  */
  const tier = h < 46 ? 'tiny' : h < 78 ? 'short' : h < 116 ? 'mid' : 'full';
  return `<article class="pl-b h-${tier} s-${e.state} ${conflict ? 'clash' : ''} ${e.stage === 'done' ? 'is-done' : ''}"
     style="--c:${c.color};top:${top}px;height:${h}px;left:${lane * w}%;width:calc(${w}% - 5px)"
     data-id="${e.id}" tabindex="0" role="button"
     aria-label="${esc(e.title)}, ${fmtTime(e.start)} to ${fmtTime(e.end)}${conflict ? ', clashes' : ''}">
    <div class="pl-b-in">
      <b>${esc(e.title)}</b>
      ${tier !== 'tiny' ? `<span class="t">${fmtRange(e.start, e.end)}</span>` : ''}
      ${tier === 'full' && e.why ? `<span class="why">${esc(e.why)}</span>` : ''}
    </div>
    ${e.stage === 'done' ? `<span class="pl-b-badge">${ic('check', 11)} Done</span>` : ''}
    ${conflict ? `<span class="pl-b-clash" title="Clashes with another block">!</span>` : ''}
    ${(CALS[e.cal] || {}).movable !== false ? '<span class="pl-b-grip" aria-hidden="true"></span>' : ''}
  </article>`;
}
function pointPill(e) {
  const c = CALS[e.cal] || CALS.block;
  return `<button class="pl-pt s-${e.state} ${e.stage === 'done' ? 'is-done' : ''}" style="--c:${c.color}" data-id="${e.id}"
    title="${esc(e.title)}${e.sub ? ' — ' + esc(e.sub) : ''}">${ic(c.icon, 11)}<span>${esc(e.title)}</span></button>`;
}

/* ————— DAY ————— */
function viewDay() {
  const d = new Date(PL.anchor);
  const dayS = startOfDay(d).getTime(), dayE = endOfDay(d).getTime();
  const all = collectEvents();
  const timed = all.filter((e) => !e.point && e.end > dayS && e.start < dayE);
  const pts = all.filter((e) => e.point && e.start >= dayS && e.start <= dayE);
  const lanes = layoutLanes(timed);
  const load = dayLoad(d, all);
  const nowT = new Date();
  return `<div class="pl-week pl-day1">
    <div class="pl-week-head"><div class="pl-gutter-head"></div>
      <div class="pl-dh ${isToday(d) ? 'on' : ''}"><span class="n">${d.getDate()}</span><span class="w">${DOW_FULL[d.getDay()]}</span></div></div>
    <div class="pl-day-meta">${load.hours}h scheduled of ${load.cap}h · ${pts.length} dated ${pts.length === 1 ? 'item' : 'items'}</div>
    <div class="pl-week-body">
      <div class="pl-gutter">${Array.from({ length: 24 }, (_, i) => `<div class="pl-h" style="height:${PX_H}px"><span>${i === 0 ? '' : fmtTime(new Date(2000, 0, 1, i).getTime())}</span></div>`).join('')}</div>
      <div class="pl-col ${isToday(d) ? 'today' : ''}" data-day="${dayS}">
        <div class="pl-col-allday">${pts.map(pointPill).join('')}</div>
        <div class="pl-col-grid" data-day="${dayS}">
          ${Array.from({ length: 24 }, (_, i) => `<div class="pl-slot" style="height:${PX_H}px" data-hour="${i}"></div>`).join('')}
          ${isToday(d) ? `<div class="pl-now" style="top:${(nowT.getHours() + nowT.getMinutes() / 60) * PX_H}px"><i></i></div>` : ''}
          ${lanes.map(({ e, lane, of }) => blockEl(e, dayS, lane, of, false)).join('')}
        </div>
      </div>
    </div></div>`;
}

/* ————— MONTH (ref 2: cells + category dots) ————— */
function viewMonth() {
  const pr = planPrefs();
  const a = new Date(PL.anchor);
  const first = new Date(a.getFullYear(), a.getMonth(), 1);
  const gridStart = startOfWeek(first, pr.firstDay);
  const all = collectEvents();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    const s = startOfDay(d).getTime(), e = endOfDay(d).getTime();
    const day = all.filter((x) => x.start <= e && (x.end || x.start) >= s);
    const kinds = [...new Set(day.map((x) => x.cal))];
    const out = d.getMonth() !== a.getMonth();
    cells.push(`<button class="pl-mc ${out ? 'out' : ''} ${isToday(d) ? 'today' : ''}" data-day="${s}" onclick="PL.anchor=${s};setView('day')">
      <span class="pl-mc-n">${d.getDate()}</span>
      <span class="pl-mc-dots">${kinds.slice(0, 4).map((k) => `<i style="background:${CALS[k].color}"></i>`).join('')}</span>
      ${day.length ? `<span class="pl-mc-list">${day.slice(0, 2).map((x) => `<em style="--c:${CALS[x.cal].color}">${esc(x.title)}</em>`).join('')}${day.length > 2 ? `<em class="more">+${day.length - 2} more</em>` : ''}</span>` : ''}
    </button>`);
  }
  const wd = Array.from({ length: 7 }, (_, i) => DOW[(pr.firstDay + i) % 7]);
  return `<div class="pl-month">
    <div class="pl-mh">${wd.map((w) => `<span>${w}</span>`).join('')}</div>
    <div class="pl-mg">${cells.join('')}</div>
  </div>`;
}

/* ————— AGENDA (ref 4: time rail + connected checkboxes) ————— */
function viewAgenda() {
  const from = startOfDay(new Date(PL.anchor)).getTime();
  const to = from + 14 * DAY_MS;
  const all = collectEvents().filter((e) => e.start >= from && e.start < to);
  if (!all.length) {
    return `<div class="pl-empty">${ic('calendar', 22)}<b>Nothing in the next two weeks</b>
      <p>Save something in Discover and its deadline lands here, or type in the box above.</p>
      <button class="pill pill-dark" onclick="closeDash();goV('discover')">Find something</button></div>`;
  }
  const byDay = {};
  all.forEach((e) => { const k = startOfDay(e.start).getTime(); (byDay[k] = byDay[k] || []).push(e); });
  return `<div class="pl-agenda">${Object.keys(byDay).sort((a, b) => a - b).map((k) => {
    const d = new Date(Number(k)); const list = byDay[k];
    return `<section class="pl-ad">
      <header class="pl-ad-h"><b>${fmtDayLabel(d)}</b><span>${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} · ${list.length} ${list.length === 1 ? 'item' : 'items'}</span></header>
      <ol class="pl-rail">${list.map((e, i) => agendaRow(e, i === list.length - 1)).join('')}</ol>
    </section>`;
  }).join('')}</div>`;
}
function agendaRow(e, last) {
  const c = CALS[e.cal] || CALS.block;
  const done = e.stage === 'done';
  return `<li class="pl-r s-${e.state} ${done ? 'is-done' : ''} ${last ? 'last' : ''}" data-id="${e.id}">
    <span class="pl-r-t">${e.point ? '' : fmtTime(e.start)}</span>
    <button class="pl-r-box ${done ? 'on' : ''}" style="--c:${c.color}" onclick="event.stopPropagation();plSetStage('${e.id}','${done ? 'todo' : 'done'}')"
      aria-label="${done ? 'Mark not done' : 'Mark done'}">${done ? ic('check', 12) : ''}</button>
    <div class="pl-r-m">
      <b>${esc(e.title)}</b>
      ${e.sub || e.why ? `<i>${ic('link', 11)} ${esc(e.sub || e.why)}</i>` : ''}
    </div>
    <div class="pl-r-r">
      ${STATE_WORD[e.state] ? `<span class="pl-state ${e.state}">${STATE_WORD[e.state]}</span>` : ''}
      ${!e.point ? `<span class="pl-r-d">${plDur(e.end - e.start)}</span>` : ''}
      ${e.oppId ? `<button class="pl-r-open" onclick="event.stopPropagation();openDetail('${e.oppId}')">Open ${ic('arrow-up-right', 11)}</button>` : ''}
    </div>
  </li>`;
}

/* ————— PLANNER (stages, usable beyond the calendar) ————— */
function viewPlanner() {
  const all = collectEvents();
  const horizon = Date.now() + 21 * DAY_MS;
  const scope = all.filter((e) => e.start < horizon);
  return `<div class="pl-board">${PSTAGES.map(([k, label]) => {
    const list = scope.filter((e) => e.stage === k);
    return `<section class="pl-lane" data-stage="${k}">
      <header class="pl-lane-h">${ic(k === 'done' ? 'check' : k === 'blocked' ? 'x' : k === 'doing' ? 'refresh' : 'layers', 14)}<b>${label}</b><span>${list.length}</span></header>
      <div class="pl-lane-b" data-stage="${k}">
        ${list.map(planCard).join('') || `<div class="pl-lane-empty">Drop here</div>`}
      </div>
    </section>`;
  }).join('')}</div>`;
}
/* Ref-1's card: chip row, title, ↳ subtitle, divider, meta footer. */
function planCard(e) {
  const c = CALS[e.cal] || CALS.block;
  const heat = e.cal === 'deadline' ? deadlineHeat(Math.ceil((e.start - Date.now()) / DAY_MS)) : null;
  return `<article class="pl-card s-${e.state}" draggable="true" data-id="${e.id}" tabindex="0">
    <div class="pl-card-chips">
      ${heat ? `<span class="pl-cchip h-${heat.cls}">${ic('zap', 12)}${heat.t}</span>` : ''}
      <span class="pl-cchip" style="--c:${c.color}">${ic(c.icon, 12)}${c.label.replace(/s$/, '')}</span>
      ${STATE_WORD[e.state] ? `<span class="pl-cchip st-${e.state}">${STATE_WORD[e.state]}</span>` : ''}
    </div>
    <h4>${esc(e.title)}</h4>
    ${e.sub || e.why ? `<p>${ic('link', 12)} ${esc(e.sub || e.why)}</p>` : ''}
    <footer>
      <span class="pl-card-when">${ic('calendar', 12)} ${fmtDayLabel(new Date(e.start))}${e.point ? '' : ` · ${plDur(e.end - e.start)}`}</span>
      ${e.oppId ? `<button onclick="event.stopPropagation();openDetail('${e.oppId}')" title="Open the listing">${ic('arrow-up-right', 12)}</button>` : ''}
    </footer>
  </article>`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INTERACTION
   Desktop and touch are genuinely different instruments, so they get different
   grammar rather than one lowest-common-denominator set of taps:

     pointer (mouse/trackpad)   drag a block to move · drag its lower edge to
                                resize · drag empty grid to carve out a new
                                block · hover lifts and reveals the grip ·
                                shift+wheel or a two-finger horizontal swipe
                                pages the week · full keyboard map
     touch                      long-press empty grid to create · press-and-drag
                                a block to move it (after a 220ms hold, so the
                                page still scrolls normally) · horizontal swipe
                                pages · tap opens the sheet

   Everything snaps to 15 minutes, because a calendar that lets you make a
   block of 37 minutes is lying about how anyone plans.
   ═══════════════════════════════════════════════════════════════════════════ */

const SNAP_MIN = 15;
const snapMs = (ms) => Math.round(ms / (SNAP_MIN * 6e4)) * SNAP_MIN * 6e4;

function wirePlanner() {
  const root = document.getElementById('pl-root'); if (!root) return;
  if (!window.__plSwept) {
    window.__plSwept = true;
    const gone = sweepEmpties();
    if (gone) { toast(`Cleared ${gone} empty ${gone === 1 ? 'block' : 'blocks'}`); return renderPlanner(); }
  }
  const body = document.getElementById('pl-week-body') || root;

  /* — open the inspector — */
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-id]');
    if (b && !ev.target.closest('button')) openInspector(b.dataset.id);
  });

  /* — pointer: move / resize / create — */
  root.addEventListener('pointerdown', onPointerDown);

  /* — touch paging + long-press create — */
  wireTouch(root);

  /* — planner lane drag/drop — */
  root.querySelectorAll('.pl-card').forEach((c) => {
    c.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', c.dataset.id); c.classList.add('drag'); });
    c.addEventListener('dragend', () => c.classList.remove('drag'));
  });
  root.querySelectorAll('.pl-lane-b').forEach((l) => {
    l.addEventListener('dragover', (e) => { e.preventDefault(); l.classList.add('over'); });
    l.addEventListener('dragleave', () => l.classList.remove('over'));
    l.addEventListener('drop', (e) => {
      e.preventDefault(); l.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain'); if (id) plSetStage(id, l.dataset.stage);
    });
  });

  /* — scroll the week to the working day rather than to midnight — */
  const wb = document.getElementById('pl-week-body');
  if (wb && !wb.dataset.scrolled) {
    wb.scrollTop = Math.max(0, (planPrefs().workStart - 1) * PX_H);
    wb.dataset.scrolled = '1';
  }
  const railHost = document.getElementById('pl-insp');
  if (railHost && !PL.sel) {
    railHost.querySelectorAll('.plr-item').forEach((li) => li.addEventListener('click', () => openInspector(li.dataset.id)));
  }
  const main = document.querySelector('.dash-main');
  if (main && !PL.kept) { main.scrollTop = 0; }
  PL.kept = false;
  if (!window.__plKeys) { window.__plKeys = true; document.addEventListener('keydown', planKeys); }
  if (!window.__plTick) { window.__plTick = setInterval(tickNow, 60000); }
}

/* the now-line has to actually move, or it is decoration */
function tickNow() {
  if (S.dashSec !== 'calendar' || !document.getElementById('pl-root')) return;
  const n = new Date(); const top = (n.getHours() + n.getMinutes() / 60) * PX_H;
  document.querySelectorAll('.pl-now').forEach((el) => { el.style.top = top + 'px'; });
}

function onPointerDown(ev) {
  if (ev.pointerType === 'touch') return;            // touch has its own grammar
  if (ev.button !== 0) return;
  const grid = ev.target.closest('.pl-col-grid');
  const block = ev.target.closest('.pl-b');
  if (!grid) return;

  const dayS = Number(grid.dataset.day);
  const rect = grid.getBoundingClientRect();
  const yToMs = (y) => dayS + Math.max(0, Math.min(DAY_MS - 6e4, (y - rect.top) / PX_H * 36e5));

  if (block) {
    const e = eventById(block.dataset.id); if (!e) return;
    if ((CALS[e.cal] || {}).movable === false) return;
    const onGrip = ev.target.closest('.pl-b-grip');
    const dur = e.end - e.start;
    const grabOffset = yToMs(ev.clientY) - e.start;
    ev.preventDefault();
    startDrag(block, (y, col) => {
      const base = col != null ? col : dayS;
      if (onGrip) {                                   // resize from the bottom edge
        const end = snapMs(Math.max(e.start + 15 * 6e4, yToMs(y)));
        return { start: e.start, end };
      }
      const start = snapMs(yToMs(y) - grabOffset + (base - dayS));
      return { start, end: start + dur };
    }, e);
    return;
  }

  /* Drag on empty grid → carve out a block. A stationary CLICK must never make
     one: that produced drifts of empty "Untitled" blocks stacked on each other.
     Nothing is created until the pointer has actually travelled. */
  const a = snapMs(yToMs(ev.clientY));
  const y0 = ev.clientY;
  ev.preventDefault();
  let ghost = null;
  const paint = (s, e2) => {
    if (!ghost) { ghost = document.createElement('div'); ghost.className = 'pl-ghost'; grid.appendChild(ghost); }
    ghost.style.top = (s - dayS) / 36e5 * PX_H + 'px';
    ghost.style.height = Math.max(8, (e2 - s) / 36e5 * PX_H) + 'px';
    ghost.textContent = fmtRange(s, e2);
  };
  const move = (e2) => {
    if (Math.abs(e2.clientY - y0) < 6) return;          // still a click, not a drag
    const b = snapMs(yToMs(e2.clientY));
    paint(Math.min(a, b), Math.max(a, b));
  };
  const up = (e2) => {
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
    if (ghost) ghost.remove();
    if (Math.abs(e2.clientY - y0) < 6) { PL.sel = null; renderRail(); return; }   // click = deselect
    const b = snapMs(yToMs(e2.clientY));
    const s = Math.min(a, b), en = Math.max(a, b);
    if (en - s >= 15 * 6e4) createAt(s, en);
  };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
}

function startDrag(el, compute, e) {
  el.classList.add('dragging');
  const cols = [...document.querySelectorAll('.pl-col-grid')];
  const move = (ev) => {
    const over = cols.find((c) => { const r = c.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right; });
    const col = over ? Number(over.dataset.day) : null;
    const { start, end } = compute(ev.clientY, col);
    const dayS = col == null ? startOfDay(start).getTime() : col;
    el.style.top = (start - dayS) / 36e5 * PX_H + 'px';
    el.style.height = Math.max(22, (end - start) / 36e5 * PX_H) + 'px';
    const t = el.querySelector('.t'); if (t) t.textContent = fmtRange(start, end);
    el.dataset.ns = start; el.dataset.ne = end;
  };
  const up = () => {
    document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
    el.classList.remove('dragging');
    const ns = Number(el.dataset.ns), ne = Number(el.dataset.ne);
    if (ns && ne && (ns !== e.start || ne !== e.end)) {
      planUpdate(e.id, { start: ns, end: ne, ai: false });   // a human touched it; stop auto-replanning it
      toast(`Moved to ${fmtDayLabel(new Date(ns))} ${fmtTime(ns)}`);
    }
    renderPlanner();
  };
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
}

/* touch: swipe to page, long-press to create, hold-then-drag to move */
function wireTouch(root) {
  let x0 = 0, y0 = 0, t0 = 0, held = null, moved = false;
  root.addEventListener('touchstart', (e) => {
    const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; t0 = Date.now(); moved = false;
    const grid = e.target.closest('.pl-col-grid');
    if (grid && !e.target.closest('.pl-b')) {
      held = setTimeout(() => {
        if (moved) return;
        if (navigator.vibrate) navigator.vibrate(8);
        const r = grid.getBoundingClientRect();
        const s = snapMs(Number(grid.dataset.day) + (y0 - r.top) / PX_H * 36e5);
        createAt(s, s + 60 * 6e4);
      }, 480);
    }
  }, { passive: true });
  root.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (Math.abs(t.clientX - x0) > 8 || Math.abs(t.clientY - y0) > 8) { moved = true; clearTimeout(held); }
  }, { passive: true });
  root.addEventListener('touchend', (e) => {
    clearTimeout(held);
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Date.now() - t0 < 600 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8) planGo(dx < 0 ? 1 : -1);
  }, { passive: true });

  /* trackpad: a horizontal two-finger swipe pages, exactly like Fantastical */
  let acc = 0, lock = 0;
  root.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    if (Date.now() < lock) return;
    acc += e.deltaX;
    if (Math.abs(acc) > 120) { planGo(acc > 0 ? 1 : -1); acc = 0; lock = Date.now() + 350; }
  }, { passive: true });
}

function planKeys(e) {
  if (S.dashSec !== 'calendar' || !document.getElementById('pl-root')) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  const map = { m: 'month', w: 'week', d: 'day', a: 'agenda', p: 'planner' };
  if (map[e.key]) { setView(map[e.key]); return; }
  if (e.key === 't') return planToday();
  if (e.key === 'ArrowLeft' || e.key === '[') return planGo(-1);
  if (e.key === 'ArrowRight' || e.key === ']') return planGo(1);
  if (e.key === 'n') { e.preventDefault(); const q = document.getElementById('pl-q'); if (q) q.focus(); return; }
  if (e.key === 'Escape') { PL.sel = null; closeInspector(); }
}

/* ————— create ————— */
function createAt(start, end) {
  const ev = { id: 'b' + Math.random().toString(36).slice(2, 9), cal: 'block', title: '', start, end, stage: 'todo', fresh: true };
  planAdd(ev); PL.sel = ev.id; renderPlanner();
  setTimeout(() => { const i = document.getElementById('insp-title'); if (i) { i.focus(); i.select(); } }, 40);
}
function quickAdd(text) {
  const ev = parseQuickAdd(text);
  if (!ev) return;
  planAdd(ev);
  const q = document.getElementById('pl-q-hint'); if (q) q.textContent = '';
  toast(`Added “${ev.title}” — ${fmtDayLabel(new Date(ev.start))} ${ev.point ? '' : fmtTime(ev.start)}`);
  PL.anchor = ev.start; renderPlanner();
}
/* live parse preview — the user sees the machine's reading before committing */
function quickHint(text) {
  const el = document.getElementById('pl-q-hint'); if (!el) return;
  if (!text || text.length < 3) { el.textContent = ''; return; }
  const ev = parseQuickAdd(text); if (!ev) { el.textContent = ''; return; }
  const link = ev.oppId && S.pipe[ev.oppId] ? ` · links to ${esc(shortTitle(S.pipe[ev.oppId].snap) || '')}` : '';
  el.textContent = `${fmtDayLabel(new Date(ev.start))} ${ev.point ? '' : fmtTime(ev.start) + ' · ' + plDur(ev.end - ev.start)}${link}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INSPECTOR — one panel, every state and every action for the selected thing.
   Desktop: a right rail. Mobile: the same markup as a bottom sheet.
   The rule this panel follows: never show a control the user can't use here.
   A deadline is not editable, so it offers what you CAN do about it instead.
   ═══════════════════════════════════════════════════════════════════════════ */

function openInspector(id, keep) {
  const e = eventById(id); if (!e) return closeInspector();
  PL.sel = id;
  const host = document.getElementById('pl-insp'); if (!host) return;
  const c = CALS[e.cal] || CALS.block;
  const derived = c.derived;
  const opp = e.oppId ? (S.pipe || {})[e.oppId] : null;
  const ef = e.oppId ? effortFor(e.oppId) : null;
  const heat = e.cal === 'deadline' ? deadlineHeat(Math.ceil((e.start - Date.now()) / DAY_MS)) : null;

  host.innerHTML = `
    <header class="insp-h">
      <span class="insp-eyebrow" style="--c:${c.color}">${ic(c.icon, 12)} ${c.label.replace(/s$/, '')}</span>
      <button class="insp-x" onclick="closeInspector()" aria-label="Close">${ic('x', 15)}</button>
    </header>
    ${derived
      ? `<h3 class="insp-t">${esc(e.title)}</h3>`
      : `<input id="insp-title" class="insp-t insp-edit" value="${esc(e.title)}" placeholder="Untitled"
           onchange="planUpdate('${e.id}',{title:this.value,fresh:false});renderPlanner()">`}
    ${e.org ? `<div class="insp-sub">${esc(e.org)}</div>` : ''}

    <div class="insp-when">
      ${ic('calendar', 13)} <b>${fmtDayLabel(new Date(e.start))}</b>
      ${e.point ? '' : `<span>${fmtTime(e.start)} – ${fmtTime(e.end)} · ${plDur(e.end - e.start)}</span>`}
      ${heat ? `<span class="insp-heat h-${heat.cls}">${heat.t}</span>` : ''}
    </div>

    ${!derived ? `<div class="insp-row">
      <label>Starts<input type="datetime-local" value="${toLocalInput(e.start)}"
        onchange="moveEvent('${e.id}', this.value)"></label>
      ${e.point ? '' : `<label>Length
        <select onchange="resizeEvent('${e.id}', this.value)">
          ${[30, 45, 60, 90, 120, 180, 240].map((m) => `<option value="${m}" ${Math.round((e.end - e.start) / 6e4) === m ? 'selected' : ''}>${m < 60 ? m + 'm' : (m / 60) + 'h'}</option>`).join('')}
        </select></label>`}
    </div>` : ''}

    <div class="insp-stages">
      ${PSTAGES.map(([k, l]) => `<button class="insp-st ${e.stage === k ? 'on' : ''}" onclick="plSetStage('${e.id}','${k}')">${l}</button>`).join('')}
    </div>

    ${e.why ? `<p class="insp-why">${ic('spark', 12)} ${esc(e.why)}</p>` : ''}

    ${ef ? `<section class="insp-sec">
      <h5>What this still needs</h5>
      <div class="insp-effort"><b>${ef.hours}h</b><span>${ef.why.join(' · ')}</span></div>
      ${opp && opp.pct ? `<div class="insp-prog"><i style="width:${opp.pct}%"></i></div>` : ''}
    </section>` : ''}

    <section class="insp-sec">
      <h5>Do something about it</h5>
      <div class="insp-acts">
        ${e.oppId ? `<button class="pill pill-dark pill-sm" onclick="applyWithScout('${e.oppId}')">${ic('spark', 13)} Let Scout fill it</button>` : ''}
        ${e.oppId ? `<button class="pill pill-ghost pill-sm" onclick="addPrepChain('${e.oppId}')">${ic('layers', 13)} Build a prep chain</button>` : ''}
        ${e.oppId ? `<button class="pill pill-ghost pill-sm" onclick="blockTimeFor('${e.oppId}')">${ic('clock', 13)} Block time for this</button>` : ''}
        ${e.cal === 'deadline' && e.oppId ? `<button class="pill pill-ghost pill-sm" onclick="addToCalendar('${e.oppId}')">${ic('calendar', 13)} Export .ics</button>` : ''}
        ${e.oppId ? `<button class="pill pill-ghost pill-sm" onclick="openDetail('${e.oppId}')">${ic('arrow-up-right', 13)} Open listing</button>` : ''}
        ${e.state === 'overdue' && !derived ? `<button class="pill pill-ghost pill-sm" onclick="rescheduleEvent('${e.id}')">${ic('refresh', 13)} Move to the next free slot</button>` : ''}
        ${!derived ? `<button class="pill pill-ghost pill-sm danger" onclick="removeEvent('${e.id}')">${ic('x', 13)} Delete</button>` : ''}
      </div>
    </section>

    ${derived ? `<p class="insp-note">${ic('link', 12)} This is projected from ${e.cal === 'milestone' ? 'your board' : 'your pipeline'} — change it there and it changes here.</p>` : ''}
  `;
  hydrateIcons(host);
  host.classList.add('open');
  if (!keep) host.scrollTop = 0;
}
function closeInspector() {
  // abandoning a just-created block without naming it should leave nothing behind
  const e = PL.sel && eventById(PL.sel);
  if (e && e.untitled && !e.oppId && getPlan().events.some((x) => x.id === e.id && x.fresh)) planRemove(e.id);
  PL.sel = null; renderPlanner();
}
function toLocalInput(ms) {
  const d = new Date(ms - d0off(ms));
  return d.toISOString().slice(0, 16);
}
const d0off = (ms) => new Date(ms).getTimezoneOffset() * 6e4;
function moveEvent(id, val) {
  const e = eventById(id); if (!e) return;
  const start = new Date(val).getTime(); if (Number.isNaN(start)) return;
  planUpdate(id, { start, end: start + (e.end - e.start), ai: false });
  PL.anchor = start; renderPlanner();
}
function resizeEvent(id, mins) {
  const e = eventById(id); if (!e) return;
  planUpdate(id, { end: e.start + Number(mins) * 6e4, ai: false }); renderPlanner();
}
function removeEvent(id) { planRemove(id); PL.sel = null; toast('Removed'); renderPlanner(); }
function rescheduleEvent(id) {
  const e = eventById(id); if (!e) return;
  const dur = e.end - e.start;
  const slots = freeSlots(Date.now(), Date.now() + 14 * DAY_MS);
  const fit = slots.find(([a, b]) => b - a >= dur);
  if (!fit) return toast('No free slot in the next two weeks — free something up first');
  planUpdate(id, { start: fit[0], end: fit[0] + dur, ai: false });
  PL.anchor = fit[0]; toast(`Moved to ${fmtDayLabel(new Date(fit[0]))} ${fmtTime(fit[0])}`); renderPlanner();
}

/* ═══════════ THE PLANNING ACTIONS ═══════════ */

function runPlanWeek() {
  const { made, rep } = planWeek(7);
  if (!made) return toast('Nothing to schedule — no dated work in the next 7 days');
  PL.view = 'week'; setPref('view', 'week');
  toast(`Placed ${made} work ${made === 1 ? 'block' : 'blocks'} · ${rep.demand}h of work into ${rep.supply}h free`);
  renderPlanner();
  if (rep.slips.length) setTimeout(openTriage, 500);
}
function blockTimeFor(oppId) {
  const ef = effortFor(oppId);
  const p = (S.pipe || {})[String(oppId)]; if (!p) return;
  const due = p.snap.deadline_ts ? p.snap.deadline_ts * 1000 : Date.now() + 7 * DAY_MS;
  const pr = planPrefs();
  let need = ef.hours * 36e5; const made = [];
  for (const [a, b] of freeSlots(Date.now(), due - 6 * 36e5)) {
    let cur = a;
    while (need > 0 && b - cur >= pr.minBlock * 6e4) {
      const len = Math.min(need, pr.focusLen * 6e4, b - cur);
      if (len < pr.minBlock * 6e4) break;
      made.push({ id: 'b' + Math.random().toString(36).slice(2, 9) + made.length, cal: 'block', oppId: String(oppId),
        title: shortTitle(p.snap) || p.snap.title, start: cur, end: cur + len, stage: 'todo', ai: true,
        why: `${ef.hours}h needed · ${ef.why.join(' · ')}` });
      cur += len; need -= len;
    }
    if (need <= 0) break;
  }
  if (!made.length) return toast('No free time before that deadline — widen your hours in the strip above');
  planAddMany(made);
  toast(`${made.length} ${made.length === 1 ? 'block' : 'blocks'} · ${ef.hours}h booked before the deadline`);
  PL.anchor = made[0].start; renderPlanner();
}
function addPrepChain(oppId) {
  const chain = prepChain(oppId);
  if (!chain.length) return toast('That one has no dated deadline to work back from');
  planAddMany(chain);
  toast(`${chain.length}-step prep chain added, dated back from the deadline`);
  PL.view = 'agenda'; setPref('view', 'agenda'); renderPlanner();
}

/* The triage sheet — the thing no other calendar will tell you. */
function openTriage() {
  const rep = capacityReport(7);
  const body = `<div class="pl-triage">
    <p class="tri-lead">You have <b>${rep.supply}h</b> free in the next 7 days. The work on your plate needs <b>${rep.demand}h</b>.
    ${rep.slips.length ? `At this rate <b>${rep.slips.length}</b> won’t get the time ${rep.slips.length === 1 ? 'it needs' : 'they need'}.` : 'Everything fits — go.'}</p>
    ${rep.fits.length ? `<h5>These fit</h5><ul class="tri-list">${rep.fits.map((i) => `<li><span class="tri-ok">${ic('check', 12)}</span><b>${esc(i.title)}</b><em>${i.hours}h · due ${fmtDayLabel(new Date(i.due))}</em></li>`).join('')}</ul>` : ''}
    ${rep.slips.length ? `<h5>These won’t</h5><ul class="tri-list">${rep.slips.map((i) => `<li><span class="tri-no">${ic('x', 12)}</span><b>${esc(i.title)}</b><em>${i.hours}h · due ${fmtDayLabel(new Date(i.due))}</em>
      <div class="tri-acts">
        <button class="pill pill-ghost pill-sm" onclick="closePlSheet();blockTimeFor('${i.id}')">Make room</button>
        <button class="pill pill-ghost pill-sm" onclick="pipeSet('${i.id}',{stage:'result',outcome:'skipped'});closePlSheet();renderPlanner();toast('Dropped — one less thing')">Drop it</button>
      </div></li>`).join('')}</ul>` : ''}
    <p class="tri-foot">Hours come from your working window (${planPrefs().workStart}:00–${planPrefs().workEnd}:00) minus what’s already booked. Effort is estimated per type and discounted by how much you’ve drafted.</p>
  </div>`;
  openPlSheet('Can this week actually happen?', body);
}

/* a tiny sheet primitive — used by triage and the mobile inspector */
function openPlSheet(title, html) {
  closePlSheet();
  const el = document.createElement('div');
  el.className = 'pl-sheet-wrap'; el.id = 'pl-sheet';
  el.innerHTML = `<div class="pl-sheet-bg" onclick="closePlSheet()"></div>
    <div class="pl-sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header><b>${esc(title)}</b><button onclick="closePlSheet()" aria-label="Close">${ic('x', 16)}</button></header>
      <div class="pl-sheet-b">${html}</div>
    </div>`;
  document.body.appendChild(el); hydrateIcons(el);
  requestAnimationFrame(() => el.classList.add('on'));
}
function closePlSheet() { const el = document.getElementById('pl-sheet'); if (el) el.remove(); }

/* ————— entry points used from elsewhere in Scout ————— */
/* Discover / detail pages call this to put something on the calendar. */
function planFromOpp(oppId) {
  if (!(S.pipe || {})[String(oppId)]) pipeSet(String(oppId), { stage: 'saved' });
  blockTimeFor(String(oppId));
  if (typeof openDash === 'function') openDash();
  renderDash('calendar');
}
window.planFromOpp = planFromOpp;
