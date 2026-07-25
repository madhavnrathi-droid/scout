/* ═══════════════════════════════════════════════════════════
   SCOUT — app logic
   Live feed from /api/opportunities (Unstop + Devpost + curated),
   personal match scoring, rotation, AI agent + search.
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ————— icons (1.5px stroke, thin & elegant) ————— */
const IC = {
  pen: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  link: '<path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7L11 7"/><path d="M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18L13 17"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  'arrow-left':'<path d="M15 4l-8 8 8 8"/>',
  'arrow-right':'<path d="M9 4l8 8-8 8"/>',
  'arrow-up-right':'<path d="M7 17L17 7M9 7h8v8"/>',
  'chev-left':'<path d="M14 6l-6 6 6 6"/>',
  'chev-right':'<path d="M10 6l6 6-6 6"/>',
  'chev-down':'<path d="M6 10l6 6 6-6"/>',
  bell:'<path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6M10.3 20a2 2 0 003.4 0"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2-1.2L14.2 3H9.8l-.4 2.7a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002 1.2l.4 2.7h4.4l.4-2.7a7 7 0 002-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
  folder:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  grid:'<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
  shuffle:'<path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
  bookmark:'<path d="M6 4h12v17l-6-4-6 4z"/>',
  'bookmark-filled':'<path d="M6 4h12v17l-6-4-6 4z" fill="currentColor"/>',
  spark:'<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 114 2c-.8.6-1.5 1-1.5 2M12 17h.01"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>',
  home:'<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1z"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  check:'<path d="M5 13l4 4L19 7"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  send:'<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
  share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
  calendar:'<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v5M16 3v5"/>',
  pin:'<path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.6a3.5 3.5 0 010 6.8M17.5 14.7c2.3.6 4 2.3 4 5.3"/>',
  eye:'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  refresh:'<path d="M20 12a8 8 0 10-2.3 5.6M20 12V7m0 5h-5"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  cap:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v5"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9z"/>',
  zap:'<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  trophy:'<path d="M7 4h10v7a5 5 0 01-10 0zM7 6H4a3 3 0 003 4M17 6h3a3 3 0 01-3 4M12 16v3M8 21h8"/>',
  heart:'<path d="M12 20s-7.5-4.7-9.4-9A5.2 5.2 0 0112 6.6 5.2 5.2 0 0121.4 11c-1.9 4.3-9.4 9-9.4 9z"/>',
  scan:'<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/>',
  command:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M7 9l3 3-3 3M13 15h4"/>',
  orb:'<path d="M12 3.2c.9 5 3 7.1 7.9 8-4.9 1.6-7 3.7-7.9 8.8-.9-5.1-3-7.2-7.9-8.8 4.9-.9 7-3 7.9-8z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="10" stroke-dasharray="2.6 4.2" opacity=".55"/><circle cx="18.8" cy="4.6" r="1.5" fill="currentColor" stroke="none"/>',
  doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  upload:'<path d="M12 16V5M7 9l5-5 5 5"/><path d="M4 19h16"/>',
  download:'<path d="M12 4v11M7 11l5 5 5-5"/><path d="M4 20h16"/>',
  building:'<path d="M4 21V5a1.5 1.5 0 0 1 1.5-1.5H13V21M13 9h5.5A1.5 1.5 0 0 1 20 10.5V21M2 21h20"/><path d="M7 7.5h2M7 11h2M7 14.5h2M16 13h1.5M16 16.5h1.5"/>',
  shield:'<path d="M12 3l7.5 3v5.2c0 4.6-3.2 8-7.5 9.8-4.3-1.8-7.5-5.2-7.5-9.8V6z"/><path d="M9 12l2 2 4-4"/>',
  sliders:'<path d="M4 6h9M18 6h2M4 12h2M11 12h9M4 18h13M20 18h0"/><circle cx="15.5" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18.5" cy="18" r="2"/>',
  tag:'<path d="M3 7v5.6a2 2 0 0 0 .6 1.4l7 7a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.8l-7-7A2 2 0 0 0 11.6 6H6a3 3 0 0 0-3 3z"/><circle cx="8.5" cy="9.5" r="1.2" fill="currentColor" stroke="none"/>',
  'arrow-up':'<path d="M12 20V5M6 11l6-6 6 6"/>',
};
function ic(name, size = 18, cls = '') {
  const d = IC[name] || IC.spark;
  return `<svg class="ic ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
/* flat reddish-pink heart — a plain filled icon, not the pixel brand mark */
const ROSE = '#FF3F6C';
function heartFlat(size = 20, color) {
  return `<svg class="heart-flat" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color || ROSE}" aria-hidden="true"><path d="M12 21.2s-7.6-4.6-9.9-9.4C.7 8.3 2.4 4.8 5.8 4.3 8 3.95 10 5 12 7.3c2-2.3 4-3.35 6.2-3 3.4.5 5.1 4 3.7 7.5C19.6 16.6 12 21.2 12 21.2z"/></svg>`;
}
/* ————— real damped-spring pop (mass=1, underdamped) driven by the shared Phys RAF ————— */
function springPop(el, opts) {
  if (!el) return;
  const o = opts || {};
  if (REDUCED) { el.style.transform = ''; o.onDone && o.onDone(); return; }
  let x = (o.from != null ? o.from : 0.72) - 1, v = o.v != null ? o.v : 0;   // displacement from rest scale 1
  const k = o.k || 340, c = o.damp || 20;                                     // c < 2√k ⇒ bounces
  const base = o.base || '';
  const job = (dt) => {
    const a = -k * x - c * v; v += a * dt; x += v * dt;
    el.style.transform = `${base} scale(${(1 + x).toFixed(4)})`;
    if (Math.abs(x) < 0.0008 && Math.abs(v) < 0.01) { el.style.transform = base; Phys.remove(job); o.onDone && o.onDone(); }
  };
  Phys.add(job);
}
/* ————— a satisfying burst of glyphs, verlet gravity, from a real element ————— */
function burst(el, glyph, color, n) {
  if (REDUCED || !el || !document.body) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const N = n || 11;
  for (let i = 0; i < N; i++) {
    const p = document.createElement('div');
    p.className = 'burst-p'; p.textContent = glyph || '♥';
    p.style.cssText = `left:${cx}px;top:${cy}px;color:${color || ROSE}`;
    document.body.appendChild(p);
    const ang = (-Math.PI / 2) + (Math.random() - 0.5) * 1.9;
    const sp = 180 + Math.random() * 240;
    let vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp, px = 0, py = 0, life = 0;
    const spin = (Math.random() - 0.5) * 700;
    const job = (dt) => {
      life += dt; vy += 900 * dt; px += vx * dt; py += vy * dt;
      const t = Math.min(1, life / 1.05);
      p.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) rotate(${(spin * life).toFixed(0)}deg) scale(${(1 - t * 0.5).toFixed(3)})`;
      p.style.opacity = (1 - t).toFixed(3);
      if (life > 1.05) { p.remove(); Phys.remove(job); }
    };
    Phys.add(job);
  }
}
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-ic]').forEach((el) => {
    el.innerHTML = ic(el.dataset.ic, parseInt(el.dataset.size || 18, 10)) + (el.querySelector('.reddot') ? '<span class="reddot"></span>' : '');
  });
}

/* pixel heart (matches /scout-heart.svg grid) */
// the exact brand mark (user's original pixel art, background keyed out — never redrawn)
function heartSVG() {
  return '<img src="/scout-heart.png?v=3" alt="Scout" class="heart-img" draggable="false">';
}

/* ————— state ————— */
const API_BASE = (() => {
  const h = location.hostname, p = location.port;
  if (h === 'localhost' && p === '3001') return '/api';
  if (h === 'localhost') return 'http://localhost:3001/api';
  return '/api';
})();

function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

// flip to false to park the generative copilot behind "Coming soon" again
const AI_ENABLED = true;
function soon() { toast('Scout AI copilot — coming soon ✨'); return false; }

let DATA = [];
let API_LIVE = false;
let FEED_META = {};
const S = {
  user: null, profile: {}, saved: new Set(), applied: [], pipe: {}, kit: {}, accounts: {},
  attached: [], chatFiles: [], scope: 'feed', lastViewed: null, master: {}, docsIdx: {}, admStage: 'all', admRegion: 'all', dashSec: 'today', histLim: 20, trackFilter: 'live', dosOpen: 'personal', notifLim: 15, demo: false, admField: 'all', admState: 'all', admDur: 'all', admFee: 'all', admSchol: false, admExam: null,
  scView: 'overview', apply: null,
  onb: 0,
  onbData: { name: '', role: '', looking: [], domains: [], institution: '', gradYear: '', cgpa: '', city: '', geo: '', relocate: false, goal: '', reminders: true, digest: false },
  chat: [], ctx: null, busy: false,
  view: 'home', disType: 'All', disSort: 'match', disQuery: '', disLoc: 'all',
  disView: 'foryou', disDomain: null, disCompMode: 'hot', disHorizon: 90, disCause: null,
  ledgerType: 'All', ledgerHorizon: 30, ledgerSort: 'prize',
  insightIdx: 0, insightTimer: null,
};
const SCOUT_V = 44;
function ls(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch { return null; } }
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtIN = (n) => Number(n || 0).toLocaleString('en-IN');
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const PASTELS = ['#FFE3DC', '#FFF1CE', '#E7F5D9', '#DCEBF7', '#EBE1F7'];

/* ————— onboarding data (parity) ————— */
const ROLES = [
  { v: 'school', t: 'School student', d: 'Class 9–12, exploring early' },
  { v: 'ug', t: 'Undergraduate', d: "Bachelor's in progress" },
  { v: 'pg', t: 'Postgraduate', d: "Master's, M.Tech, MBA" },
  { v: 'phd', t: 'PhD or doctoral', d: 'Research scholar' },
  { v: 'researcher', t: 'Researcher or faculty', d: 'Post-doc, scientist, professor' },
  { v: 'professional', t: 'Working professional', d: 'Industry, switching or upskilling' },
];
const LOOKING = ['Scholarships', 'Fellowships', 'Grants', 'Hackathons', 'Competitions', 'Internships', 'Conferences', 'Workshops', 'Events', 'Jobs'];
const DOMAINS = ['AI/ML', 'Engineering', 'Life Sciences', 'Biotech', 'HealthTech', 'ClimaTech', 'Business', 'Policy', 'Social Impact', 'Design', 'Arts', 'Finance'];
const GOALS = [
  { v: 'fund', t: 'Fund my studies or research' },
  { v: 'experience', t: 'Win competitions and build my CV' },
  { v: 'intern', t: 'Land an internship' },
  { v: 'abroad', t: 'Study or work abroad' },
  { v: 'network', t: 'Meet people and attend events' },
  { v: 'explore', t: "Explore what's out there" },
];
const STEPS = ['intro', 'role', 'looking', 'domains', 'education', 'location', 'goal', 'reminders'];

/* ═══════════ ONBOARDING ═══════════ */
function renderOnb() {
  document.getElementById('onb-count').textContent = String(S.onb + 1).padStart(2, '0') + ' / ' + String(STEPS.length).padStart(2, '0');
  document.getElementById('onb-fill').style.width = ((S.onb + 1) / STEPS.length * 100) + '%';
  document.getElementById('onb-back').style.visibility = S.onb > 0 ? 'visible' : 'hidden';
  const b = document.getElementById('onb-body');
  const nx = document.getElementById('onb-next');
  const step = STEPS[S.onb];
  nx.textContent = 'Continue'; nx.disabled = false;
  b.scrollTop = 0;
  const d = S.onbData;

  if (step === 'intro') {
    b.innerHTML = `<div class="vintro">
      <div class="heartmark">${heartSVG()}</div>
      <div class="big">Every opportunity <em>worth</em> your time.</div>
      <div class="lede">Scout pulls fellowships, grants, hackathons, scholarships and internships live from Unstop, Devpost and more — then ranks and rotates them for you, like a news feed for your future.</div>
      <div class="feats">
        <div class="feat"><span class="n">01</span><span class="t">Live scraped feed</span><span class="d">119+ real listings, refreshed all day</span></div>
        <div class="feat"><span class="n">02</span><span class="t">Ranked like a marketplace</span><span class="d">Deadline heat · virality · prize · brand</span></div>
        <div class="feat"><span class="n">03</span><span class="t">An agent that applies with you</span><span class="d">Drafts SoPs, checks eligibility, builds checklists</span></div>
      </div></div>`;
    nx.textContent = 'Get started';
  }
  else if (step === 'role') {
    b.innerHTML = `<div class="onb-h">Which best describes you?</div><div class="onb-sub">This shapes your matches and what Scout surfaces first.</div>
      <div class="optrows">${ROLES.map((r, i) => `<div class="optrow ${d.role === r.v ? 'sel' : ''}" onclick="pickRole('${r.v}')"><span class="n">${String(i + 1).padStart(2, '0')}</span><div class="tx"><div class="ttl">${r.t}</div><div class="dsc">${r.d}</div></div><span class="ring"></span></div>`).join('')}</div>`;
    nx.disabled = !d.role;
  }
  else if (step === 'looking') {
    b.innerHTML = `<div class="onb-h">What are you looking for?</div><div class="onb-sub">Select all that apply. Change anytime.</div>
      <div class="chips-grid">${LOOKING.map((x) => `<button class="chip ${d.looking.includes(x) ? 'sel' : ''}" onclick="toggleMulti('looking','${x}')">${x}</button>`).join('')}</div>`;
    nx.disabled = d.looking.length === 0;
  }
  else if (step === 'domains') {
    b.innerHTML = `<div class="onb-h">Your fields of interest</div><div class="onb-sub">Scout prioritises matches in these areas.</div>
      <div class="chips-grid">${DOMAINS.map((x) => `<button class="chip ${d.domains.includes(x) ? 'sel' : ''}" onclick="toggleMulti('domains','${x}')">${x}</button>`).join('')}</div>`;
    nx.disabled = d.domains.length === 0;
  }
  else if (step === 'education') {
    const yrs = ['School', '1st year', '2nd year', '3rd year', 'Final year', 'Graduated', 'Postgrad', 'PhD'];
    b.innerHTML = `<div class="onb-h">Your background</div><div class="onb-sub">Used to personalise matches and check eligibility.</div>
      <div class="ufield"><label>Your name</label><input placeholder="e.g. Madhav" value="${esc(d.name)}" oninput="S.onbData.name=this.value"></div>
      <div class="ufield"><label>Institution</label><input placeholder="e.g. IIT Madras" value="${esc(d.institution)}" oninput="S.onbData.institution=this.value"></div>
      <div class="ufield"><label>Year or level</label><select onchange="S.onbData.gradYear=this.value"><option value="">Select…</option>${yrs.map((y) => `<option ${d.gradYear === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
      <div class="ufield"><label>CGPA or percentage — optional</label><input placeholder="e.g. 8.7 / 10" value="${esc(d.cgpa)}" oninput="S.onbData.cgpa=this.value"></div>`;
  }
  else if (step === 'location') {
    const geos = [['india', 'India only'], ['abroad', 'Abroad'], ['remote', 'Remote'], ['any', 'Anywhere']];
    b.innerHTML = `<div class="onb-h">Where &amp; how far?</div><div class="onb-sub">Filter by location and surface remote-friendly options.</div>
      <div class="ufield"><label>Current city</label><input placeholder="e.g. Bengaluru" value="${esc(d.city)}" oninput="S.onbData.city=this.value"></div>
      <label class="eyebrow" style="display:block;margin-bottom:14px">Open to</label>
      <div class="chips-grid" style="margin-bottom:30px">${geos.map((g) => `<button class="chip ${d.geo === g[0] ? 'sel' : ''}" onclick="S.onbData.geo='${g[0]}';renderOnb()">${g[1]}</button>`).join('')}</div>
      <div class="togrow"><div><div class="ttl">Willing to relocate</div><div class="dsc">Show opportunities that require a move</div></div><div class="tog ${d.relocate ? 'on' : ''}" onclick="S.onbData.relocate=!S.onbData.relocate;renderOnb()"><i></i></div></div>`;
  }
  else if (step === 'goal') {
    b.innerHTML = `<div class="onb-h">What's your main goal?</div><div class="onb-sub">Helps the agent prioritise and draft applications.</div>
      <div class="optrows">${GOALS.map((g, i) => `<div class="optrow ${d.goal === g.v ? 'sel' : ''}" onclick="S.onbData.goal='${g.v}';renderOnb()"><span class="n">${String(i + 1).padStart(2, '0')}</span><div class="tx"><div class="ttl">${g.t}</div></div><span class="ring"></span></div>`).join('')}</div>`;
    nx.disabled = !d.goal;
  }
  else if (step === 'reminders') {
    const m = topMatch();
    b.innerHTML = `<div class="onb-h">Never miss a deadline</div><div class="onb-sub">Scout reminds you 14 and 3 days before anything you save.</div>
      <div class="togrow"><div><div class="ttl">Deadline reminders</div><div class="dsc">Push and email before deadlines close</div></div><div class="tog ${d.reminders ? 'on' : ''}" onclick="S.onbData.reminders=!S.onbData.reminders;renderOnb()"><i></i></div></div>
      <div class="togrow"><div><div class="ttl">Daily match digest</div><div class="dsc">New 85%+ matches every morning</div></div><div class="tog ${d.digest ? 'on' : ''}" onclick="S.onbData.digest=!S.onbData.digest;renderOnb()"><i></i></div></div>
      ${m ? `<div class="preview-strip"><div class="lab">Preview</div><div class="tx">Your top match is <b>${esc(m.title)}</b> at <b>${m._score}%</b> — closes in ${m.days_left} days.</div></div>` : ''}`;
    nx.textContent = 'See my matches';
  }
  hydrateIcons(b);
}
function topMatch() { S.profile = buildProfile(); return computeMatches()[0]; }
function pickRole(v) { S.onbData.role = v; renderOnb(); }
function toggleMulti(k, v) { const a = S.onbData[k]; const i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); renderOnb(); }
function onbNext() {
  if (S.onb < STEPS.length - 1) { S.onb++; renderOnb(); }
  else {
    // questionnaire done → straight in. Everything is kept in this browser.
    S.profile = buildProfile();
    ls('scout-profile', S.profile);
    S.user = { name: S.onbData.name || 'there', onboarded: true, ts: Date.now() };
    ls('scout-user', S.user);
    enterApp();
  }
}
function onbPrev() { if (S.onb > 0) { S.onb--; renderOnb(); } }
function onbSkip() { if (S.onb === 0) { S.onb = 1; renderOnb(); } else { S.onb = STEPS.length - 1; renderOnb(); } }
function buildProfile() {
  const d = S.onbData;
  return { name: d.name, role: d.role, looking: d.looking, domains: d.domains, institution: d.institution, gradYear: d.gradYear, cgpa: d.cgpa, city: d.city, geo: d.geo || 'any', relocate: d.relocate, goal: d.goal, reminders: d.reminders, digest: !!d.digest };
}

/* ————— personal match (parity formula) ————— */
/* goal → type affinity: the profile's objective re-weights the whole feed */
const GOAL_BOOST = {
  fund: { Grant: 14, Fellowship: 12, Scholarship: 10 },
  experience: { Competition: 12, Hackathon: 12, Quiz: 6 },
  intern: { Internship: 16, Hackathon: 4 },
  abroad: { Fellowship: 10, Scholarship: 9, Conference: 7, Hackathon: 3 },
  network: { Conference: 13, Meetup: 13, Workshop: 9, Talk: 9, Hackathon: 4 },
  explore: {},
};
const LOOK_TYPE = { scholarships: 'Scholarship', fellowships: 'Fellowship', grants: 'Grant', hackathons: 'Hackathon', competitions: 'Competition', internships: 'Internship', conferences: 'Conference', workshops: 'Workshop', events: 'Meetup', jobs: 'Internship' };
/* ═══════════ RECOMMENDATION ENGINE ═══════════
   Eight signals, calibrated so scores actually spread instead of piling up at 90+:
     1 domain affinity (with a kinship graph, not exact-string only)
     2 text relevance between what you care about and what the listing says
     3 type preference — stated (looking/goal) AND learned from your pipeline
     4 eligibility: level, geography, and whether the deadline is physically feasible
     5 quality / signal strength from the source
     6 urgency, but only when you could still finish it
     7 behavioural learning — the orgs, domains and types you actually save and apply to
     8 diversity re-ranking so the top of the feed isn't twenty of the same thing         */
const DOMAIN_KIN = {
  'AI/ML': ['Engineering', 'HealthTech', 'Finance', 'Design'],
  Engineering: ['AI/ML', 'ClimaTech', 'Biotech', 'HealthTech'],
  'Life Sciences': ['Biotech', 'HealthTech'],
  Biotech: ['Life Sciences', 'HealthTech', 'Engineering'],
  HealthTech: ['Biotech', 'Life Sciences', 'AI/ML'],
  ClimaTech: ['Engineering', 'Policy', 'Social Impact'],
  Business: ['Finance', 'Policy', 'Design'],
  Policy: ['Social Impact', 'Business', 'ClimaTech'],
  'Social Impact': ['Policy', 'ClimaTech', 'Arts'],
  Design: ['Arts', 'Business', 'AI/ML'],
  Arts: ['Design', 'Social Impact'],
  Finance: ['Business', 'AI/ML'],
};
const ROLE_ORDER = ['school', 'ug', 'pg', 'phd', 'work'];
const STOPW = new Set(['the', 'and', 'for', 'with', 'you', 'your', 'this', 'that', 'from', 'are', 'all', 'our', 'will', 'can', 'has', 'have', 'who', '其', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'by', 'is', 'it', 'be', 'or', 'as']);
const toks = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s+#]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOPW.has(w));

/* what this user is about — profile plus everything they've actually engaged with */
let _uv = null, _uvKey = '';
function userVector() {
  const p = (S.profile && S.profile.domains) ? S.profile : buildProfile();
  const pipeKey = Object.keys(S.pipe || {}).length + ':' + (p.domains || []).join(',') + ':' + p.goal + ':' + p.role;
  if (_uv && _uvKey === pipeKey) return _uv;

  const interest = new Map();                       // token → weight
  const bump = (t, w) => { for (const k of toks(t)) interest.set(k, (interest.get(k) || 0) + w); };
  (p.domains || []).forEach((d) => bump(d, 3));
  (p.looking || []).forEach((l) => bump(l, 1.5));
  bump(p.goal, 1); bump(p.institution, 0.5);

  // learned: the things they saved / drafted / applied to say more than the questionnaire
  const typeAff = {}, domAff = {}, orgAff = {};
  const W = { saved: 1, draft: 2.5, applied: 4, result: 4 };
  let engaged = 0;
  for (const rec of Object.values(S.pipe || {})) {
    if (rec && rec._demo) continue;              // demo records never teach the recommender
    const o = rec && rec.snap; if (!o) continue;
    const w = W[rec.stage] || 1; engaged += w;
    typeAff[o.type] = (typeAff[o.type] || 0) + w;
    (o.dom || []).forEach((d) => { domAff[d] = (domAff[d] || 0) + w; });
    if (o.org) orgAff[o.org] = (orgAff[o.org] || 0) + w;
    bump(o.title, w * 0.6); (o.skills || []).forEach((s) => bump(s, w * 0.5));
  }
  _uvKey = pipeKey;
  _uv = { p, interest, typeAff, domAff, orgAff, engaged };
  return _uv;
}
function invalidateUV() { _uv = null; }

const logistic = (x) => 1 / (1 + Math.exp(-x));
function recScore(o, uv) {
  const { p, interest, typeAff, domAff, orgAff, engaged } = uv;
  const why = [];
  let z = 0;

  // 1 · domain affinity — direct hits count fully, kindred domains partly
  const mine = p.domains || [];
  const od = o.dom || [];
  let domHit = 0, kin = 0;
  for (const d of od) {
    if (mine.includes(d)) domHit++;
    else if (mine.some((m) => (DOMAIN_KIN[m] || []).includes(d))) kin++;
  }
  if (domHit) { z += Math.min(domHit, 2) * 1.15; why.push(`${od.filter((d) => mine.includes(d)).slice(0, 2).join(' + ')} — your field`); }
  else if (kin) { z += 0.45; why.push('adjacent to your fields'); }
  else if (mine.length && od.length) z -= 0.55;

  // 2 · text relevance — do the words you care about actually appear here?
  if (interest.size) {
    const text = toks(o.title + ' ' + (o.skills || []).join(' ') + ' ' + String(o.description || '').slice(0, 240));
    let hit = 0; const seen = new Set();
    for (const t of text) if (interest.has(t) && !seen.has(t)) { seen.add(t); hit += Math.min(interest.get(t), 4); }
    const rel = Math.min(hit / 9, 1);
    z += rel * 1.25;
    if (rel > 0.55) why.push('matches what you keep looking at');
  }

  // 3 · type preference — stated, then learned
  const wanted = new Set((p.looking || []).map((x) => LOOK_TYPE[String(x).toLowerCase()]).filter(Boolean));
  if (wanted.has(o.type)) { z += 0.85; why.push(`you asked for ${o.type.toLowerCase()}s`); }
  z += ((GOAL_BOOST[p.goal] || {})[o.type] || 0) / 14;
  if (engaged > 0) {
    const share = (typeAff[o.type] || 0) / engaged;
    z += Math.min(share * 1.6, 0.9);
    if (share > 0.3) why.push(`you keep picking ${o.type.toLowerCase()}s`);
    const dShare = od.reduce((a, d) => a + (domAff[d] || 0), 0) / engaged;
    z += Math.min(dShare * 0.9, 0.6);
    if (o.org && orgAff[o.org]) { z += 0.45; why.push(`you've tracked ${o.org} before`); }
  }

  // 4 · eligibility — level, geography, and whether the deadline is actually survivable
  const roles = o.roles || [];
  if (roles.length) {
    if (roles.includes(p.role)) z += 0.6;
    else {
      const near = roles.some((r) => Math.abs(ROLE_ORDER.indexOf(r) - ROLE_ORDER.indexOf(p.role)) === 1);
      z -= near ? 0.4 : 1.3;                       // clearly wrong level is a real penalty
    }
  }
  if (!p.geo || p.geo === 'any' || o.geo === 'remote' || o.geo === p.geo) z += 0.35;
  else if (p.geo === 'abroad' && o.geo === 'global') z += 0.35;
  else z -= 0.5;
  const need = (EFFORT_HOURS[o.type] || 8) / 8;    // days of honest work
  if (o.days_left > 0 && o.days_left < need) { z -= 0.9; why.push('tight — barely time to do it justice'); }

  // 5 · quality of the listing itself
  z += ((o.score || 0.4) - 0.45) * 1.5;
  if ((o.applied || 0) > 400 || (o.views || 0) > 6000) z += 0.25;

  // 6 · urgency, only when it is still feasible
  if (o.days_left > 0 && o.days_left <= 7 && o.days_left >= need) { z += 0.5; why.push(`closes in ${o.days_left} day${o.days_left === 1 ? '' : 's'}`); }
  else if (o.days_left <= 0) z -= 2.5;

  // squash to a spread-out, honest-looking percentage
  const score = Math.round(30 + logistic(z * 0.78) * 68);
  return { score: Math.max(12, Math.min(99, score)), why: why.slice(0, 3), z };
}

/* diversity re-rank (MMR-ish): never let one org or type own the top of the feed */
function diversify(list, span) {
  const out = [], typeSeen = {}, orgSeen = {};
  const pool = list.slice(0, span || 220);
  while (pool.length && out.length < (span || 220)) {
    let bestI = 0, best = -1e9;
    for (let i = 0; i < pool.length; i++) {
      const o = pool[i];
      const pen = (typeSeen[o.type] || 0) * 1.6 + (orgSeen[o.org] || 0) * 3.2;
      const v = o._blend - pen;
      if (v > best) { best = v; bestI = i; }
    }
    const pick = pool.splice(bestI, 1)[0];
    typeSeen[pick.type] = (typeSeen[pick.type] || 0) + 1;
    orgSeen[pick.org] = (orgSeen[pick.org] || 0) + 1;
    out.push(pick);
  }
  return out.concat(list.slice(span || 220));
}

function computeMatches(list) {
  const uv = userVector();
  const scored = (list || DATA).map((o) => {
    const r = recScore(o, uv);
    return Object.assign({}, o, { _score: r.score, _why: r.why, _blend: r.score + 14 * (o.score || 0.4) });
  }).sort((a, b) => b._blend - a._blend);
  return diversify(scored);
}

/* ═══════════ METRICS — competition intensity · ROI · opportunity cost · CV value · odds ═══════════ */
const EFFORT_HOURS = { Hackathon: 48, Competition: 30, Internship: 14, Scholarship: 22, Fellowship: 26, Grant: 24, Conference: 5, Talk: 16, Workshop: 4, Quiz: 2, Meetup: 2, Volunteering: 24, Exhibition: 3, Cultural: 3, Networking: 3, Academic: 6 };
const CV_BASE = { Fellowship: 90, Grant: 84, Scholarship: 80, Talk: 82, Internship: 78, Competition: 76, Academic: 70, Hackathon: 72, Volunteering: 68, Conference: 60, Exhibition: 46, Workshop: 42, Networking: 44, Quiz: 36, Meetup: 26 };
const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
function fmtDur(h) { return h >= 40 ? 'a weekend+' : h >= 16 ? Math.round(h / 8) + ' days' : h + ' hrs'; }
function metrics(o, score) {
  const applied = o.applied || 0, views = o.views || 0, prize = o.prize_cash || 0;
  // competition intensity 0-100: crowd (log registrations) + prize gravity + urgency + solo crowding
  const crowd = Math.log1p(applied) / Math.log1p(15000);
  const conv = views > 80 ? Math.min(1, (applied / views) * 6) : crowd;
  let intensity = crowd * 55 + conv * 15 + Math.min(prize / 1e6, 1) * 20 + (o.team === '1' ? 6 : 0) + (o.days_left > 0 && o.days_left <= 5 ? 6 : 0);
  intensity = clampN(intensity, 4, 99);
  const effort = EFFORT_HOURS[o.type] || 8;
  // CV value 0-100
  let cv = (CV_BASE[o.type] || 50) + Math.min(prize / 1e6, 1) * 8 + (applied > 3000 ? 6 : 0) + (intensity > 72 ? 6 : 0);
  cv = clampN(cv, 15, 99);
  // reward value (prize + prestige); ROI = reward discounted by crowd + effort
  const reward = Math.min(prize / 1.5e5, 1) * 55 + cv * 0.5;
  const roi = clampN(reward * (1 - intensity / 240) * (1 - Math.min(effort, 60) / 160), 5, 99);
  const grade = roi >= 55 ? 'A+' : roi >= 44 ? 'A' : roi >= 33 ? 'B' : roi >= 22 ? 'C' : 'D';
  // your odds given fit
  const fit = score || o._score || 70;
  const odds = clampN(100 - intensity * 0.72 + (fit - 70) * 0.5, 3, 96);
  return { intensity, effort, effortText: fmtDur(effort), cv, roi, grade, odds, reward: Math.round(reward) };
}
function intensityLabel(i) { return i >= 80 ? 'Fierce' : i >= 62 ? 'High' : i >= 42 ? 'Moderate' : i >= 24 ? 'Approachable' : 'Wide open'; }

function whyMatch(o) {
  const p = S.profile || {};
  const out = [];
  const dom = (o.dom || []).filter((d) => (p.domains || []).includes(d));
  if (dom.length) out.push(`Matches your interest in <b>${dom.slice(0, 2).join(' and ')}</b>`);
  if ((p.looking || []).map((x) => x.toLowerCase()).includes((o.type || '').toLowerCase() + 's')) out.push(`You're looking for <b>${o.type}s</b>`);
  if ((o.roles || []).includes(p.role)) out.push(`Open to <b>${((ROLES.find((r) => r.v === p.role) || { t: 'your level' }).t).toLowerCase()}</b>`);
  if (o.geo === 'remote') out.push('Fully remote · location-independent');
  else if (p.geo === 'india' && o.geo === 'india') out.push('Based in India · no relocation');
  if (o.applied > 1000) out.push(`<b>${fmtIN(o.applied)}</b> already registered — high signal`);
  if (o.days_left <= 14) out.push(`<b style="color:var(--red)">Closes in ${o.days_left} days</b> — apply soon`);
  if (!out.length) out.push('Broadly aligned with your profile');
  return out;
}

/* ═══════════ AUTH (parity flows) ═══════════ */

/* ═══════════ YOUR DATA LIVES IN THIS BROWSER ═══════════
   No accounts, no server, nothing uploaded. Small records sit in localStorage;
   documents (which are far too big for it) go in IndexedDB. Export/Import is the
   backup mechanism — a single JSON file the person owns outright. */
function signedIn() { return true; }              // every feature is open to everyone now
function queueSync() { setSyncBadge('saved'); }   // saving is instant + local
async function syncNow() { return true; }
function setSyncBadge(state) {
  const els = [document.getElementById('sync-badge'), document.getElementById('dash-sync')].filter(Boolean);
  const txt = state === 'saving' ? 'Saving…' : 'Saved on this device';
  els.forEach((el) => {
    el.className = 'sync-badge sb-ok'; el.textContent = txt;
    clearTimeout(el._t); el._t = setTimeout(() => { el.textContent = ''; el.className = 'sync-badge'; }, 1800);
  });
}
function resetDevice() {
  if (!confirm('This clears your profile, saves, drafts and documents from this browser. Export first if you want a backup. Continue?')) return;
  try { ['scout-user','scout-profile','scout-pipe','scout-saved','scout-kit','scout-accounts','scout-threads','scout-master','scout-docsidx','scout-feed-cache','scout-notifs','scout-reminders','scout-agentlog','scout-acts','scout-recent','scout-streak','scout-scope','scout-board'].forEach((k) => localStorage.removeItem(k)); } catch {}
  idbClear();
  location.reload();
}
const signOut = resetDevice;

/* ————— IndexedDB: where documents actually live ————— */
const IDB_NAME = 'scout-docs', IDB_STORE = 'files';
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(IDB_STORE)) r.result.createObjectStore(IDB_STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbPut(key, val) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(val, key);
    tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((res) => {
    const rq = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null);
  });
}
async function idbDel(key) {
  const db = await idb();
  return new Promise((res) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = () => res(true); tx.onerror = () => res(false);
  });
}
async function idbClear() { try { const db = await idb(); db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).clear(); } catch {} }

/* ————— export / import: the backup that replaces an account ————— */
const BACKUP_KEYS = ['scout-profile', 'scout-master', 'scout-pipe', 'scout-saved', 'scout-kit', 'scout-accounts', 'scout-threads', 'scout-notifs', 'scout-reminders', 'scout-acts', 'scout-streak', 'scout-user', 'scout-docsidx', 'scout-board'];
async function exportData() {
  toast('Packing everything up…');
  const bundle = { app: 'scout', version: 1, exportedAt: new Date().toISOString(), data: {}, docs: {} };
  BACKUP_KEYS.forEach((k) => { const v = ls(k); if (v !== null && v !== undefined) bundle.data[k] = v; });
  // documents live in IndexedDB, so a backup that skipped them would be a lie
  for (const slot of Object.keys(ls('scout-docsidx') || {})) {
    const doc = await idbGet('doc:' + slot);
    if (doc) bundle.docs[slot] = doc;
  }
  const blob = new Blob([JSON.stringify(bundle)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `scout-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  const n = Object.keys(bundle.docs).length;
  toast(`Backup downloaded${n ? ` — including ${n} document${n === 1 ? '' : 's'}` : ''}. Keep it somewhere safe.`);
}
async function importData(input) {
  const f = input.files && input.files[0]; if (!f) return;
  try {
    const bundle = JSON.parse(await f.text());
    if (!bundle || bundle.app !== 'scout' || !bundle.data) throw new Error('That is not a Scout backup');
    Object.entries(bundle.data).forEach(([k, v]) => ls(k, v));
    for (const [slot, doc] of Object.entries(bundle.docs || {})) await idbPut('doc:' + slot, doc);
    toast('Restored — reloading');
    setTimeout(() => location.reload(), 700);
  } catch (e) { toast(String(e.message || e)); }
  finally { input.value = ''; }
}

/* ═══════════ DATA ═══════════ */
/* instant paint: keep a trimmed snapshot of the last feed so the app renders
   real content the moment it opens, then the live fetch replaces it */
function cacheFeed() {
  try {
    const slim = DATA.slice(0, 320).map((o) => ({
      id: o.id, title: o.title, org: o.org, type: o.type, img: o.img, imgThumb: o.imgThumb, realImg: o.realImg,
      description: String(o.description || '').slice(0, 200), deadline: o.deadline, deadline_ts: o.deadline_ts,
      prize: o.prize, prize_cash: o.prize_cash, team: o.team, applied: o.applied, views: o.views,
      skills: (o.skills || []).slice(0, 4), dom: o.dom, roles: o.roles, geo: o.geo, location: o.location,
      source_url: o.source_url, display_url: o.display_url, eligibility: String(o.eligibility || '').slice(0, 160),
      cause: o.cause, score: o.score,
    }));
    localStorage.setItem('scout-feed-cache', JSON.stringify({ t: Date.now(), items: slim }));
  } catch { /* quota — skip */ }
}
function hydrateFeedCache() {
  try {
    const c = JSON.parse(localStorage.getItem('scout-feed-cache') || 'null');
    if (!c || !Array.isArray(c.items) || !c.items.length) return false;
    const now = Date.now() / 1000;
    DATA = c.items.map((o) => ({ ...o, days_left: o.deadline_ts ? Math.ceil((o.deadline_ts - now) / 86400) : o.days_left }))
      .filter((o) => !o.deadline_ts || o.days_left > -2);
    return DATA.length > 0;
  } catch { return false; }
}
async function loadFeed(bust) {
  try {
    const r = await fetch(`${API_BASE}/opportunities?limit=5000${bust ? '&r=' + Date.now() : ''}`, { signal: AbortSignal.timeout(20000) });
    if (r.ok) {
      const j = await r.json();
      if (j && (j.results || []).length) {
        DATA = j.results;
        API_LIVE = j.source === 'live';
        FEED_META = { count: j.count, live: j.live_count, updated: j.updated, bucket: j.rotation_bucket };
        cacheFeed();
        return true;
      }
    }
  } catch { /* offline / API down */ }
  return false;
}

/* ═══════════ ENTER APP ═══════════ */
async function enterApp() {
  show('main');
  document.getElementById('brand-heart').innerHTML = heartSVG();
  hydrateIcons();
  const nm = (S.user && S.user.name) || 'there';
  const initial = (nm[0] || 'S').toUpperCase();
  const av = document.getElementById('me-av');
  av.textContent = initial;
  av.style.background = PASTELS[initial.charCodeAt(0) % PASTELS.length];
  av.style.color = 'var(--ink)';
  const first = nm.split(' ')[0];
  document.getElementById('me-name').textContent = `${first}${/s$/i.test(first) ? "'" : "'s"} Dashboard`;
  document.getElementById('me-role').textContent = ((ROLES.find((r) => r.v === (S.profile && S.profile.role)) || {}).t || 'Member').split(' or ')[0];
  const meBtn = document.querySelector('.topbar .me');
  if (meBtn) meBtn.setAttribute('aria-label', `${first}${/s$/i.test(first) ? "'" : "'s"} dashboard`);
  renderNav();
  renderTabbar();
  // signed-in users get their workspace one click away
  if (!document.getElementById('dash-btn')) {
    const orb = document.querySelector('.icbtn.agent-orb');
    if (orb) orb.insertAdjacentHTML('beforebegin', `<button class="icbtn" id="dash-btn" data-ic="grid" onclick="openDash()" aria-label="Dashboard" title="Your dashboard"></button>`);
    hydrateIcons(document.querySelector('.top-right'));
  }
  checkReminders();
  paintStateDot();
  setInterval(checkReminders, 5 * 60e3);
  if (!DATA.length) hydrateFeedCache();     // paint real cards instantly; live fetch replaces them
  goV('home');
  const ok = await loadFeed();
  const fc = document.getElementById('feed-count');
  if (fc) fc.textContent = API_LIVE ? (FEED_META.live || DATA.length) + ' live' : (ok ? 'curated' : 'offline');
  // The live feed replaces the instant-paint cache. Only redraw if the person is
  // still at the top and hasn't started reading — re-rendering under someone
  // mid-scroll shifts the page and replays every reveal animation.
  if (window.scrollY < 120 && S.view === 'home') renderView(S.view);
  else if (S.view !== 'home') renderView(S.view);
  bumpStreak();
}
function renderNav() {
  const items = [['home', 'home', 'Home', 0], ['discover', 'compass', 'Discover', 1], ['admissions', 'cap', 'Admissions', 1], ['scouted', 'bookmark', 'Scouted', 1], ['profile', 'user', 'Profile', 0]];
  document.getElementById('nav-center').innerHTML = items.map(([v, icn, lab, hasMenu]) => {
    if (v === 'agent' && !AI_ENABLED) return `<button class="nav-it soon" onclick="soon()" title="Coming soon">${ic(icn, 17)}<span class="lab">${lab}</span><span class="soon-tag">Soon</span></button>`;
    return `<button class="nav-it ${S.view === v ? 'on' : ''}" data-menu="${hasMenu ? v : ''}" onclick="goV('${v}')" aria-haspopup="${!!hasMenu}" aria-label="${lab}">${ic(icn, 17)}<span class="lab">${lab}</span>${hasMenu ? `<span class="chev">${ic('chev-down', 12)}</span>` : ''}</button>`;
  }).join('');
  wireMenubar();
}
function renderDockChips() { /* suggestion chips retired — the bar speaks for itself */ }

/* ═══════════ SCOUTED — the pipeline ═══════════
   Every opportunity you touch gets a stage and a SNAPSHOT, so your saved/applied
   work survives the 20-minute feed rotation that swaps DATA underneath it. */
const STAGES = [
  { v: 'saved', t: 'Saved', icn: 'bookmark', d: 'Bookmarked — not started', col: 'var(--ink3)' },
  { v: 'draft', t: 'Drafts', icn: 'pen', d: 'Application in progress', col: 'var(--orange)' },
  { v: 'applied', t: 'Applied', icn: 'send', d: 'Submitted', col: 'var(--ink)' },
  { v: 'result', t: 'Results', icn: 'trophy', d: 'You heard back', col: 'var(--green-deep)' },
];
const OUTCOMES = [['won', 'Won / accepted'], ['shortlist', 'Shortlisted'], ['rejected', "Didn't get it"], ['waiting', 'Still waiting']];
function snapOf(o) {
  return { id: o.id, title: o.title, org: o.org, type: o.type, img: o.img, imgThumb: o.imgThumb, realImg: o.realImg,
    description: (o.description || '').slice(0, 220), deadline: o.deadline, deadline_ts: o.deadline_ts, prize: o.prize,
    prize_cash: o.prize_cash, location: o.location, source_url: o.source_url, display_url: o.display_url,
    applied: o.applied, skills: o.skills, dom: o.dom, _score: o._score };
}
function pipeGet(id) { return S.pipe[String(id)]; }
function pipeSet(id, patch, o) {
  const k = String(id), prev = S.pipe[k] || {};
  const snap = (o && snapOf(o)) || prev.snap || (DATA.find((x) => String(x.id) === k) && snapOf(DATA.find((x) => String(x.id) === k)));
  S.pipe[k] = { id: k, stage: 'saved', ts: Date.now(), ...prev, ...patch, snap: snap || prev.snap };
  if (!S.demo) ls('scout-pipe', S.pipe);      // demo mode is in-memory; never let it reach disk
  invalidateUV(); queueSync();
  if (patch.stage && patch.stage !== prev.stage) logAct(patch.stage, k);
  try { window.dispatchEvent(new CustomEvent('scout:pipe')); } catch {}   // the board listens
  return S.pipe[k];
}
function pipeDel(id) { delete S.pipe[String(id)]; ls('scout-pipe', S.pipe); invalidateUV(); queueSync(); }
function pipeIn(stage) {
  return Object.values(S.pipe).filter((p) => p.stage === stage && p.snap)
    .sort((a, b) => (a.snap.deadline_ts || 9e9) - (b.snap.deadline_ts || 9e9));
}
function pipeCounts() { const c = {}; for (const s of STAGES) c[s.v] = pipeIn(s.v).length; return c; }
/* the live card if the feed still has it, else the snapshot we kept */
function pipeOpp(p) { return DATA.find((o) => String(o.id) === p.id) || p.snap; }
function logAct(k, id) { const a = ls('scout-acts') || []; a.push({ k, id, t: Date.now() }); ls('scout-acts', a.slice(-500)); }

/* ═══════════ BOARD BRIDGE ═══════════
   The React canvas (public/board) reads/writes Scout ONLY through window.Scout.
   scout-pipe stays the source of truth; the board persists node positions in
   scout-board (positions only — never pipeline data). */
function matchScore(id) { try { const o = resolveOpp(id); if (!o) return null; return Math.round(recScore(o, userVector()).score); } catch { return null; } }
function riskReason(id) { const r = riskItems().find((x) => x.id === String(id)); return r ? r._risk : null; }
function exportEventICS(id) { addToCalendar(id); }
function getBoard() { return ls('scout-board') || { nodes: {} }; }
function saveBoard(state) { if (state && !S.demo) ls('scout-board', state); }
let _boardLoaded = false;
function ensureBoard(el) {
  if (!document.getElementById('board-css')) {
    const l = document.createElement('link'); l.id = 'board-css'; l.rel = 'stylesheet'; l.href = '/board/board.css?v=' + SCOUT_V;
    document.head.appendChild(l);
  }
  const mount = () => { try { window.ScoutBoard.mount(el); } catch (e) { el.innerHTML = '<div class="board-fail">Board could not load. <button onclick="renderDash(\'board\')">Retry</button></div>'; } };
  if (window.ScoutBoard) return mount();
  if (_boardLoaded) { const t = setInterval(() => { if (window.ScoutBoard) { clearInterval(t); mount(); } }, 60); return; }
  _boardLoaded = true;
  const sc = document.createElement('script'); sc.src = '/board/board.js?v=' + SCOUT_V;
  sc.onload = mount; sc.onerror = () => { el.innerHTML = '<div class="board-fail">Board failed to load.</div>'; };
  document.body.appendChild(sc);
}
window.Scout = {
  getPipe: () => S.pipe, resolveOpp, pipeSet, pipeDays, deadlineHeat, matchScore, riskReason,
  applyWithScout, exportEventICS, openDetail: (id) => { closeDash(); openDetail(id); },
  startApply: (id) => { closeDash(); startApply(id); }, toast,
  getBoard, saveBoard, getDashSec: () => S.dashSec,
};

/* Days from the SNAPSHOT, not the live feed — snapOf never stores days_left, so
   reading o.days_left silently yields undefined for anything the feed rotated out. */
function pipeDays(p) {
  const ts = p && p.snap && p.snap.deadline_ts;
  return ts ? Math.ceil((ts * 1000 - Date.now()) / 864e5) : null;
}
function deadlineHeat(d) {
  if (d == null) return { cls: 'none', t: 'no date' };
  if (d < 0) return { cls: 'gone', t: `closed ${Math.abs(d)}d ago` };
  if (d === 0) return { cls: 'now', t: 'closes today' };
  if (d <= 3) return { cls: 'now', t: `${d}d left` };
  if (d <= 7) return { cls: 'soon', t: `${d}d left` };
  if (d <= 21) return { cls: 'warm', t: `${d}d left` };
  return { cls: 'cool', t: `${d}d left` };
}
/* Everything that needs you, worst first, each carrying the reason in words. */
function riskItems() {
  const out = [];
  for (const p of Object.values(S.pipe || {})) {
    if (!p.snap || !['saved', 'draft'].includes(p.stage)) continue;
    const d = pipeDays(p); if (d == null) continue;
    const pct = p.pct || 0;
    const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;   // never "1 days"
    if (d < 0) out.push({ ...p, _d: d, _sev: 3, _risk: `closed ${days(Math.abs(d))} ago — you never sent it` });
    else if (d <= 2) out.push({ ...p, _d: d, _sev: 0, _risk: `${d === 0 ? 'closes today' : `closes in ${days(d)}`} · draft ${pct}% done` });
    else if (d <= 7 && pct < 60) out.push({ ...p, _d: d, _sev: 1, _risk: `closes in ${days(d)} · draft ${pct}% done` });
    else if (d <= 14 && pct === 0) out.push({ ...p, _d: d, _sev: 2, _risk: `closes in ${days(d)} · not started` });
  }
  return out.sort((a, b) => a._sev - b._sev || a._d - b._d);
}

/* ═══════════ NAVIGATION ═══════════ */
const CRUMB = { home: 'For You', discover: 'Discover', admissions: 'Admissions', scouted: 'Scouted', detail: 'Listing', agent: 'Agent', apply: 'Apply', profile: 'Profile' };
function goV(v, opts) {
  // Profile IS the dashboard once you have an account — the workspace, not a settings page
  if (v === 'agent' && !AI_ENABLED) return soon();
  S.view = v;
  stopCountdown();
  closeMenu(true);
  closeDockPop(true);
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('on', x.id === 'vw-' + v));
  document.getElementById('crumb-b').textContent = CRUMB[v] || v;
  // the global search dock floats on every view (agent has its own input when enabled)
  document.getElementById('ai-dock').classList.toggle('hidden', v === 'agent' || v === 'apply');
  renderNav();
  renderTabbar();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  renderView(v, opts);
  if (opts && opts.scrollTo) setTimeout(() => {
    const t = document.querySelector(opts.scrollTo);
    if (t) t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
  }, 120);
}
function renderView(v, opts) {
  if (v === 'home') renderHome();
  else if (v === 'discover') renderDiscover();
  else if (v === 'admissions') renderAdmissions(opts);
  else if (v === 'scouted') renderScouted();
  else if (v === 'apply') renderApply();
  else if (v === 'agent') renderAgent(opts);
  else if (v === 'profile') renderProfile();
}

/* ═══════════ SVG CHARTS ═══════════ */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}
const TYPE_COLOR = { Hackathon: '#FF4B2E', Competition: '#FFA02E', Scholarship: '#111111', Internship: '#4FCB3F', Fellowship: '#111111', Grant: '#6F6D66', Conference: '#5B8DEF', Talk: '#FF6FA5', Workshop: '#9A7BFF', Quiz: '#FFC53D', Meetup: '#2FBFBF', Job: '#3A7D5C', Volunteering: '#E0568A', Exhibition: '#C77DFF', Networking: '#2FBFBF', Cultural: '#FF8A3D', Academic: '#5B8DEF' };

/* Finsera pulse chart — weekly deadline histogram, thin grouped bars */
function pulseChart(items) {
  const W = 760, H = 240, PADL = 34, PADB = 26;
  const weeks = 8, types = ['Hackathon', 'Competition', 'Scholarship', 'Internship'];
  const counts = Array.from({ length: weeks }, () => ({}));
  items.forEach((o) => { const w = Math.floor(o.days_left / 7); if (w >= 0 && w < weeks) counts[w][o.type] = (counts[w][o.type] || 0) + 1; });
  const max = Math.max(4, ...counts.flatMap((c) => types.map((t) => c[t] || 0)));
  const gw = (W - PADL - 10) / weeks;
  let bars = '', peakWeek = 0, peakVal = 0;
  counts.forEach((c, wi) => {
    const tot = types.reduce((s, t) => s + (c[t] || 0), 0);
    if (tot > peakVal) { peakVal = tot; peakWeek = wi; }
    types.forEach((t, ti) => {
      const v = c[t] || 0; if (!v) return;
      const bh = Math.max(3, v / max * (H - PADB - 30));
      const x = PADL + wi * gw + 14 + ti * 9;
      bars += `<rect class="pbar" x="${x.toFixed(1)}" y="${(H - PADB - bh).toFixed(1)}" width="3.5" height="${bh.toFixed(1)}" rx="1.75" fill="${TYPE_COLOR[t]}" style="transform-origin:${x + 2}px ${H - PADB}px"/>`;
    });
  });
  let grid = '', labels = '';
  for (let i = 0; i <= 3; i++) {
    const y = H - PADB - i * (H - PADB - 30) / 3;
    grid += `<line x1="${PADL}" y1="${y}" x2="${W - 6}" y2="${y}" stroke="#EDEBE4" stroke-width="1"/>`;
    labels += `<text x="${PADL - 8}" y="${y + 3}" font-size="9.5" fill="#ABA9A1" text-anchor="end">${Math.round(max * i / 3)}</text>`;
  }
  const wk = ['This wk', '+1', '+2', '+3', '+4', '+5', '+6', '+7'];
  wk.forEach((l, i) => { labels += `<text x="${PADL + i * gw + gw / 2}" y="${H - 8}" font-size="9.5" fill="#ABA9A1" text-anchor="middle">${l}</text>`; });
  const tipX = Math.min(78, Math.max(2, (PADL + peakWeek * gw) / W * 100));
  const peakType = types.reduce((a, b) => ((counts[peakWeek][a] || 0) >= (counts[peakWeek][b] || 0) ? a : b));
  return { svg: `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Deadlines by week">${grid}${bars}${labels}</svg>`,
    tip: `<div class="chart-tip" style="left:${tipX}%;top:8%"><span style="display:flex;align-items:center;gap:6px"><i style="width:7px;height:7px;border-radius:50%;background:${TYPE_COLOR[peakType]};display:inline-block"></i>${peakType}s</span><b>${peakVal} closing</b>${peakWeek === 0 ? 'this week' : peakWeek === 1 ? 'next week' : peakWeek + ' weeks out'}</div>` };
}

/* Insight mini charts — red gradient area + hatch column */
function areaChartRed(seed) {
  const W = 150, H = 90;
  const rnd = (i) => Math.abs(Math.sin(seed * 3.7 + i * 1.3));
  const pts = Array.from({ length: 9 }, (_, i) => [i * (W / 8), H - 14 - rnd(i) * (H - 34) * (0.35 + i / 12)]);
  const line = smoothPath(pts);
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    <defs><linearGradient id="rg${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FF4B2E" stop-opacity=".55"/><stop offset="100%" stop-color="#FF4B2E" stop-opacity="0"/></linearGradient></defs>
    <path d="${line} L${W},${H} L0,${H} Z" fill="url(#rg${seed})"/><path d="${line}" fill="none" stroke="#FF4B2E" stroke-width="1.6"/></svg>`;
}
function hatchChart(seed) {
  const W = 150, H = 90;
  let l = '';
  for (let i = 0; i < 26; i++) {
    const h = 12 + Math.abs(Math.sin(seed + i * 0.9)) * (H - 30);
    l += `<line x1="${6 + i * 5.5}" y1="${H - 10}" x2="${6 + i * 5.5}" y2="${H - 10 - h}" stroke="#E4E2DA" stroke-width="2.4"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${l}</svg>`;
}

/* green forecast bars (Finsera bottom-left) */
function greenBars(items) {
  const W = 300, H = 90;
  const scores = computeMatches(items).map((o) => o._score);
  let bars = '';
  const n = 44;
  for (let i = 0; i < n; i++) {
    const s = scores[Math.floor(i / n * scores.length)] || 50;
    const h = 6 + (s - 40) / 58 * (H - 22);
    bars += `<rect class="pbar" x="${4 + i * (W / n)}" y="${H - 8 - h}" width="3" height="${h}" rx="1.5" fill="${i < n * 0.75 ? '#4FCB3F' : '#DDDACF'}" style="transform-origin:${4 + i * (W / n)}px ${H - 8}px"/>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${bars}</svg>`;
}
/* green line (closing soon) */
function greenLine(items) {
  const W = 300, H = 90;
  const days = 14;
  const per = Array.from({ length: days }, (_, d) => items.filter((o) => o.days_left === d).length);
  const max = Math.max(3, ...per);
  const pts = per.map((v, i) => [8 + i * ((W - 30) / (days - 1)), H - 12 - v / max * (H - 34)]);
  const today = per[0];
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
    <path d="${smoothPath(pts)}" fill="none" stroke="#4FCB3F" stroke-width="2"/>
    <circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="4.5" fill="#4FCB3F" stroke="#fff" stroke-width="2"/>
    <text x="${pts[0][0] + 9}" y="${pts[0][1] - 8}" font-size="10.5" font-weight="700" fill="#101010">${today} today</text></svg>`;
}

/* Ledgerix dense B&W chart */
function ledgerChart(items, horizon) {
  const W = 1100, H = 200;
  const per = Array.from({ length: horizon }, (_, d) => items.filter((o) => o.days_left === d).length);
  const max = Math.max(3, ...per);
  const bw = Math.min(12, Math.max(2, (W - 20) / horizon - 2.5));
  let bars = '';
  per.forEach((v, i) => {
    const h = Math.max(2, v / max * (H - 46));
    bars += `<rect class="pbar" x="${(10 + i * ((W - 20) / horizon)).toFixed(1)}" y="${H - 26 - h}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="#161616" opacity="${v ? .88 : .18}" style="transform-origin:0 ${H - 26}px"/>`;
  });
  const avg = per.map((_, i) => { const w = per.slice(Math.max(0, i - 2), i + 3); return w.reduce((a, b) => a + b, 0) / w.length; });
  const pts = avg.map((v, i) => [10 + i * ((W - 20) / horizon) + bw / 2, H - 26 - v / max * (H - 46)]);
  const peakIdx = per.indexOf(Math.max(...per));
  const px = 10 + peakIdx * ((W - 20) / horizon);
  const peakDate = new Date(Date.now() + peakIdx * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="Closings per day">
      ${bars}<path d="${smoothPath(pts)}" fill="none" stroke="#101010" stroke-width="1.4" opacity=".85"/>
      <line x1="10" y1="${H - 25}" x2="${W - 10}" y2="${H - 25}" stroke="#E4E2DA"/>
      <text x="10" y="${H - 8}" font-size="10" fill="#ABA9A1">today</text>
      <text x="${W - 10}" y="${H - 8}" font-size="10" fill="#ABA9A1" text-anchor="end">+${horizon}d</text></svg>
    <div class="chart-tip" style="left:${Math.min(86, Math.max(3, px / W * 100))}%;top:-4%"><b>${Math.max(...per)} close</b>${peakDate} <span class="pos">peak</span></div></div>`;
}

/* ═══════════ HOME — the command center ═══════════ */
function timeGreet() { const h = new Date().getHours(); return h < 5 ? 'Late night' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; }

function renderHome() {
  const el = document.getElementById('vw-home');
  if (!DATA.length) { el.innerHTML = skeletonHome(); hydrateIcons(el); return; }
  const matches = computeMatches();
  const open = DATA.filter((o) => o.days_left > 0);
  const closing7 = open.filter((o) => o.days_left <= 7);
  const fresh = DATA.filter((o) => o.updated_at && (Date.now() - new Date(o.updated_at)) < 7 * 86400000).length;
  const totalPrize = DATA.reduce((s, o) => s + (o.prize_cash || 0), 0);
  const avgMatch = Math.round(matches.slice(0, 10).reduce((s, o) => s + o._score, 0) / Math.min(10, matches.length || 1));
  const closeMatches = matches.filter((o) => o._score >= 80).length;
  const upd = FEED_META.updated ? new Date(FEED_META.updated) : new Date();
  const pulse = pulseChart(open);
  const insights = buildInsights();
  const nm = ((S.user && S.user.name) || 'there').split(' ')[0];

  el.innerHTML = `
  <section class="hero">
    <span class="eyebrow"><span class="pd"></span>Live · ${open.length} opportunities · re-ranked every 20 min</span>
    <h1 class="hero-h">Don't chase opportunities.<br><em>Scout</em><span class="hero-heart">${heartSVG()}</span><em>them.</em></h1>
    <p class="hero-sub"><b>${open.length} live listings</b> worth <b>₹${shortIN(totalPrize)}</b> — hackathons, internships, fellowships and events, plus <b>admissions</b> to colleges, exec MBAs and online degrees. Scraped live, matched to your profile, and Scout fills the applications. <b>${closing7.length} close this week.</b></p>
    <div class="hero-ctas">
      <button class="pill pill-red pill-lg" onclick="setDisType('All','closing');goV('discover')">What's closing ${ic('arrow-right', 15)}</button>
      <button class="pill pill-ghost pill-lg" onclick="goV('admissions')">${ic('cap', 15)} Admissions</button>
      ${AI_ENABLED
        ? `<button class="pill pill-white pill-lg" onclick="goV('agent')">${ic('orb', 15)} Ask Scout</button>`
        : `<button class="pill pill-white pill-lg soon" onclick="soon()">${ic('spark', 14)} Ask Scout<span class="soon-tag">Soon</span></button>`}
    </div>
    <div class="bigsearch home-search rv">
      ${ic('search', 22)}
      <input id="home-search" placeholder="Search everything — “remote AI hackathons closing this week”, “MBA admissions”" onkeydown="if(event.key==='Enter')runSearch(this.value)">
      <button class="pill pill-dark go" onclick="runSearch(document.getElementById('home-search').value)">${ic('search', 14)} Search</button>
    </div>
  </section>

  ${deptRowHTML()}

  <div class="dash-eyebrow rv"><span class="eyebrow">Opportunity command center</span><span class="lastupd">rotation #${FEED_META.bucket || '—'} · ${timeGreet().toLowerCase()}, ${esc(nm)}</span></div>

  <div class="dash">
    <div class="card rv clickcard" onclick="cardGo(event,()=>{setDisType('All','closing');goV('discover')})">
      <div class="card-h">
        <div><div class="t">Live pulse</div><div class="s">Deadlines ahead, by week</div></div>
        <div class="tools"><span class="lastupd">Last update:<br>${upd.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })} at ${upd.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span><button class="icbtn" data-ic="refresh" onclick="rotateFeed()" aria-label="Refresh"></button></div>
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap">
        <div class="stat-huge"><span data-count="${open.length}">0</span><sup>live<span class="tri"></span></sup></div>
        <div class="legend">
          <b style="--dot:#FF4B2E" onclick="event.stopPropagation();setDisType('Hackathon');goV('discover')">Hackathons</b><b style="--dot:#FFA02E" onclick="event.stopPropagation();setDisType('Competition');goV('discover')">Competitions</b><b style="--dot:#111" onclick="event.stopPropagation();setDisType('Scholarship');goV('discover')">Scholarships</b><b style="--dot:#4FCB3F" onclick="event.stopPropagation();setDisType('Internship');goV('discover')">Internships</b>
        </div>
      </div>
      <div class="chart-wrap">${pulse.svg}${pulse.tip}</div>
    </div>

    <div class="card rv">
      <div class="card-h"><div class="t">Insight</div><div class="insight-nav"><button class="icbtn" data-ic="chev-left" onclick="insightNav(-1)" aria-label="Previous insight"></button><button class="icbtn" data-ic="chev-right" onclick="insightNav(1)" aria-label="Next insight"></button></div></div>
      <div id="insight-body">${insightHTML(insights[0], 0)}</div>
    </div>
  </div>

  <div class="dash2">
    <div class="card rv clickcard" onclick="cardGo(event,()=>{setDisType('All','match');goV('discover')})">
      <div class="card-h"><div><div class="t">Match forecast</div><div class="s">Fit across the live feed</div></div><button class="icbtn" data-ic="arrow-up-right" onclick="goV('discover')" aria-label="Open discover"></button></div>
      <div style="display:flex;align-items:baseline;gap:14px;margin:6px 0 4px"><div class="stat-huge"><span data-count="${avgMatch}">0</span><sup>%<span class="tri"></span></sup></div></div>
      <div class="legend" style="margin-bottom:8px"><b style="--dot:#4FCB3F">Strong match</b><b style="--dot:#DDDACF">Rest of feed</b></div>
      ${greenBars(DATA)}
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px"><span class="stat-big" data-count="${closeMatches}">0</span><span class="lastupd">80%+ matches this rotation</span></div>
    </div>

    ${AI_ENABLED ? `<div class="ai-panel rv">
      <div class="hd"><div class="t">Scout copilot</div><button class="icbtn" data-ic="arrow-up-right" onclick="goV('agent')" aria-label="Open the copilot"></button></div>
      <div class="ai-sugg">
        <button class="sugg" onclick="askScout('What is my strongest match right now?')">What's my strongest match?</button>
        <button class="sugg" onclick="askScout('What closes this week that I qualify for?')">What closes this week?</button>
        <button class="sugg" onclick="askScout('Draft an SoP for my top match')">Draft my SoP</button>
      </div>
      <form class="ai-bar chat-bar" onsubmit="panelAsk(event)">
        <button type="submit" class="ai-spark heart-spark" aria-label="Ask">${heartFlat(19)}</button>
        <input id="ai-panel-input" placeholder="Ask the copilot anything …" autocomplete="off">
      </form>
    </div>` : `<div class="ai-panel rv soon" onclick="soon()">
      <div class="hd"><div class="t">Scout AI copilot ${ic('spark', 15)}</div><span class="soon-tag">Coming soon</span></div>
      <div class="ai-sugg">
        <button class="sugg" disabled>Draft my SoP</button>
        <button class="sugg" disabled>Check my eligibility</button>
        <button class="sugg" disabled>Plan my week</button>
      </div>
      <div class="soon-copy">Your personal application copilot — drafts SoPs, checks eligibility, and builds a plan from the live feed. Landing shortly. For now, browse &amp; search everything below.</div>
    </div>`}

    <div class="card rv clickcard" onclick="cardGo(event,()=>{setDisType('All','closing');goV('discover')})">
      <div class="card-h"><div><div class="t">Closing soon</div><div class="s">Deadlines in the next 7 days</div></div><button class="icbtn" data-ic="arrow-up-right" onclick="setDisType('All','closing');goV('discover')" aria-label="See closing"></button></div>
      <div style="display:flex;align-items:baseline;gap:14px;margin:6px 0 4px"><div class="stat-huge"><span data-count="${closing7.length}">0</span><sup><span class="tri"></span></sup></div></div>
      <div class="legend" style="margin-bottom:8px"><b style="--dot:#4FCB3F">Closings / day</b></div>
      ${greenLine(open)}
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px"><span class="stat-big">₹${shortIN(closing7.reduce((s, o) => s + (o.prize_cash || 0), 0))}</span><span class="lastupd">at stake this week</span></div>
    </div>
  </div>

  ${weekPlanHTML(matches)}

  ${railHTML('For you', matches.slice(0, 10), 'hcard', 'Picked by your profile — rotation ' + (FEED_META.bucket || ''))}
  ${goalRailHTML(matches)}
  ${domainRailHTML(matches)}
  ${railHTML('Hackathons', computeMatches(DATA.filter((o) => o.type === 'Hackathon')).slice(0, 10), 'scard')}

  <section class="ledger rv">
    <span class="eyebrow">Prize pool · is the money worth it</span>
    <div class="ledger-fig">₹<span data-count="${totalPrize}" data-inr="1">0</span></div>
    <div class="ledger-sub">live across ${fmtIN(DATA.length)} listings from Unstop, Devpost, Devfolio &amp; more — re-ranked every 20 min</div>
    <div class="ledger-stats" id="ledger-stats"></div>
    <div class="ledger-ctl">
      <div class="radiogrp" id="ledger-radios"></div>
      <div class="seg" id="ledger-seg"></div>
      <div class="seg ledger-sort" id="ledger-sort"></div>
    </div>
    <div id="ledger-chart"></div>
    <div class="ltable" id="ledger-table"></div>
  </section>

  ${railHTML('Talks & conferences', computeMatches(DATA.filter((o) => ['Conference', 'Talk', 'Meetup'].includes(o.type))).slice(0, 10), 'scard', 'Rooms worth being in — stages worth speaking on')}
  ${railHTML('Workshops & learning', computeMatches(DATA.filter((o) => ['Workshop', 'Quiz'].includes(o.type))).slice(0, 10), 'scard', 'Skill up in an afternoon')}
  ${railHTML('Internships', computeMatches(DATA.filter((o) => o.type === 'Internship')).slice(0, 10), 'scard')}
  ${railHTML('Low-competition gems', gems(), 'scard', 'High views, few registrations — better odds')}
  ${railHTML('Scholarships & Grants', computeMatches(DATA.filter((o) => ['Scholarship', 'Grant', 'Fellowship'].includes(o.type))).slice(0, 10), 'scard')}
  ${railHTML('Big prize energy', computeMatches(DATA.filter((o) => (o.prize_cash || 0) >= 100000)).sort((a, b) => b.prize_cash - a.prize_cash).slice(0, 10), 'scard', '₹1L+ on the table')}
  ${railHTML('Competitions', computeMatches(DATA.filter((o) => o.type === 'Competition')).slice(0, 10), 'scard')}

  <div class="strips rv">
    <div class="strip" id="streak-strip"><span class="dotc" style="background:var(--lime)"></span><span class="t" id="streak-t">Day 1 — you're starting strong</span><span class="d" id="streak-d">Check in daily · 7 days unlocks a free Plus week</span></div>
    <div class="strip" id="wa-strip" onclick="enableWhatsApp()"><span class="dotc" style="background:#25D366"></span><span class="t">Get deadline reminders on WhatsApp</span><span class="d">Saved opps · daily digest · one tap</span><span class="arrow">${ic('arrow-right', 16)}</span></div>
  </div>

  <footer class="foot rv">
    <span class="fh"><span class="brand-heart">${heartSVG()}</span>Scout</span>
    <span class="src">every opportunity worth your time — live from unstop.com · devpost.com · curated fellowships &amp; grants</span>
  </footer>`;

  hydrateIcons(el);
  renderLedger();
  renderStreakStrip();
  if (ls('scout-whatsapp')) { const w = document.getElementById('wa-strip'); if (w) w.style.display = 'none'; }
  animateIn(el);
  startInsights(insights);
}

function skeletonHome() {
  return `<h1 class="h-display">Opportunity Command Center</h1>
  <div class="dash"><div class="card"><div class="skel" style="height:220px"></div></div><div class="card"><div class="skel" style="height:220px"></div></div></div>
  <div class="rail">${Array.from({ length: 4 }, () => '<div class="skel-card"><div class="skel si"></div><div class="sb"><div class="skel sl" style="width:70%"></div><div class="skel sl" style="width:45%"></div></div></div>').join('')}</div>`;
}

function shortIN(n) {
  if (n >= 1e7) return (n / 1e7).toFixed(1).replace(/\.0$/, '') + ' Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L';
  return fmtIN(n);
}

/* insights */
function buildInsights() {
  const viral = DATA.slice().sort((a, b) => b.applied - a.applied)[0];
  const prize = DATA.slice().sort((a, b) => (b.prize_cash || 0) - (a.prize_cash || 0))[0];
  const week = DATA.filter((o) => o.days_left > 0 && o.days_left <= 7);
  const out = [];
  if (viral) out.push({ gray: `${viral.org}'s ${shortTitle(viral)}`, bold: `has ${fmtIN(viral.applied)} people racing for it`, a: [fmtIN(viral.applied), 'registered'], b: [viral.days_left + 'd', 'until deadline'], seed: 1, id: viral.id });
  if (prize && prize.prize_cash) out.push({ gray: shortTitle(prize), bold: `put ${prize.prize} on the table`, a: [prize.prize, 'top prize'], b: [fmtIN(prize.applied), 'registered'], seed: 2, id: prize.id });
  out.push({ gray: 'This week on Scout', bold: `${week.length} opportunities close in 7 days`, a: [String(week.length), 'closing'], b: ['₹' + shortIN(week.reduce((s, o) => s + (o.prize_cash || 0), 0)), 'at stake'], seed: 3 });
  return out;
}
function shortTitle(o) { const t = o.title.split(/[|–—:]/)[0].trim(); return t.length > 42 ? t.slice(0, 40) + '…' : t; }
function insightHTML(ins, idx) {
  if (!ins) return '';
  return `<div class="insight-line" ${ins.id ? `style="cursor:pointer" onclick="openDetail('${ins.id}')"` : ''}>${esc(ins.gray)}<br><b>${esc(ins.bold)}</b></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:end">${areaChartRed(ins.seed)}${hatchChart(ins.seed)}</div>
    <div class="insight-stats"><div><span class="stat-big">${esc(ins.a[0])}</span><div class="l">${esc(ins.a[1])}</div></div><div style="text-align:right"><span class="stat-big">${esc(ins.b[0])}</span><div class="l">${esc(ins.b[1])}</div></div></div>`;
}
let _insights = [];
function startInsights(ins) {
  _insights = ins;
  clearInterval(S.insightTimer);
  if (!REDUCED) S.insightTimer = setInterval(() => insightNav(1, true), 7000);
}
function insightNav(dir, auto) {
  if (!_insights.length) return;
  if (!auto) clearInterval(S.insightTimer);
  S.insightIdx = (S.insightIdx + dir + _insights.length) % _insights.length;
  const body = document.getElementById('insight-body');
  if (!body) return;
  if (window.gsap && !REDUCED) {
    gsap.to(body, { opacity: 0, x: dir * -14, duration: .18, ease: 'power2.in', onComplete: () => {
      body.innerHTML = insightHTML(_insights[S.insightIdx], S.insightIdx);
      gsap.fromTo(body, { opacity: 0, x: dir * 14 }, { opacity: 1, x: 0, duration: .3, ease: 'power2.out' });
    } });
  } else body.innerHTML = insightHTML(_insights[S.insightIdx], S.insightIdx);
}

/* ledger */
function renderLedger() {
  const present = new Set(DATA.map((o) => o.type));
  const cashTypes = ['Hackathon', 'Competition', 'Quiz', 'Internship', 'Scholarship'];
  const radios = ['All', ...cashTypes.filter((t) => present.has(t))];
  document.getElementById('ledger-radios').innerHTML = radios.map((r) => `<button class="${S.ledgerType === r ? 'on' : ''}" onclick="S.ledgerType='${r}';renderLedger()">${r === 'All' ? 'All' : r + 's'}</button>`).join('');
  const horizons = [[7, 'Week'], [30, 'Month'], [60, 'Quarter'], [90, 'Season']];
  document.getElementById('ledger-seg').innerHTML = horizons.map(([h, l]) => `<button class="${S.ledgerHorizon === h ? 'on' : ''}" onclick="S.ledgerHorizon=${h};renderLedger()">${l}</button>`).join('');
  const sorts = [['prize', 'Biggest ₹'], ['roi', 'Best ROI'], ['winnable', 'Winnable']];
  document.getElementById('ledger-sort').innerHTML = sorts.map(([v, l]) => `<button class="${S.ledgerSort === v ? 'on' : ''}" onclick="S.ledgerSort='${v}';renderLedger()">${l}</button>`).join('');

  let items = DATA.filter((o) => o.days_left > 0 && o.days_left <= S.ledgerHorizon);
  if (S.ledgerType !== 'All') items = items.filter((o) => o.type === S.ledgerType);
  document.getElementById('ledger-chart').innerHTML = ledgerChart(items, S.ledgerHorizon);

  // Glassdoor-style satellite stats over the current filter
  const cash = items.filter((o) => (o.prize_cash || 0) > 0).map((o) => o.prize_cash).sort((a, b) => a - b);
  const median = cash.length ? cash[Math.floor(cash.length / 2)] : 0;
  const week = items.filter((o) => o.days_left <= 7);
  const weekCash = week.reduce((s, o) => s + (o.prize_cash || 0), 0);
  const bigN = items.filter((o) => (o.prize_cash || 0) >= 100000).length;
  document.getElementById('ledger-stats').innerHTML = [
    ['₹' + shortIN(items.reduce((s, o) => s + (o.prize_cash || 0), 0)), 'live cash in view'],
    [median ? '₹' + shortIN(median) : '—', 'median prize'],
    ['₹' + shortIN(weekCash), 'at stake in 7 days'],
    [fmtIN(bigN), '₹1L+ purses'],
  ].map(([v, l]) => `<div class="lstat"><b>${v}</b><span>${l}</span></div>`).join('');

  let ranked = computeMatches(items);
  if (S.ledgerSort === 'roi') ranked = ranked.slice().sort((a, b) => metrics(b, b._score).roi - metrics(a, a._score).roi);
  else if (S.ledgerSort === 'winnable') ranked = ranked.slice().sort((a, b) => metrics(b, b._score).odds - metrics(a, a._score).odds);
  else ranked = ranked.slice().sort((a, b) => (b.prize_cash || 0) - (a.prize_cash || 0));
  const rows = ranked.slice(0, 10);
  const gcol = { 'A+': 'var(--green-deep)', 'A': 'var(--green-deep)', 'B': 'var(--orange)', 'C': 'var(--orange)', 'D': 'var(--ink3)' };
  document.getElementById('ledger-table').innerHTML =
    `<div class="lrow lhead"><span>#</span><span></span><span>Opportunity</span><span class="hide-m">Prize</span><span>Field</span><span class="hide-m">ROI</span><span>Match</span></div>` +
    rows.map((o, i) => { const m = metrics(o, o._score); return `<div class="lrow" onclick="openDetail('${o.id}')">
      <span class="idx">${String(i + 1).padStart(2, '0')}</span>
      <span class="th"><img src="${esc(o.imgThumb || o.img)}" alt="" loading="lazy" onerror="this.style.display='none'"></span>
      <span><span class="tt">${esc(o.title)}</span><span class="oo">${esc(o.org)} · ${o.days_left}d left · ${fmtIN(o.applied)} in</span></span>
      <span class="cell hide-m"><b>${esc(o.prize)}</b></span>
      <span class="cell"><span class="lint"><i style="width:${m.intensity}%;background:${m.intensity >= 62 ? 'var(--red)' : m.intensity >= 42 ? 'var(--orange)' : 'var(--green)'}"></i></span>${intensityLabel(m.intensity)}</span>
      <span class="cell hide-m"><b style="color:${gcol[m.grade]}">${m.grade}</b></span>
      <span class="cell"><b>${o._score}%</b></span></div>`; }).join('');
}

/* rails */
function railHTML(title, items, kind, subtitle) {
  if (!items.length) return '';
  const id = 'rail-' + title.toLowerCase().replace(/[^a-z]+/g, '-');
  const typeForAll = { Hackathons: 'Hackathon', Internships: 'Internship', Competitions: 'Competition', 'Scholarships & Grants': 'Scholarship' }[title] || 'All';
  return `<section class="rail-sec rv">
    <div class="rail-top">
      <h2>${title}</h2>
      <div class="rt-actions">
        <span class="count-chip">${subtitle || items.length + ' live'}</span>
        <button class="pill pill-red" onclick="setDisType('${typeForAll}');goV('discover')">View All ${ic('arrow-up-right', 14)}</button>
        <button class="arr" onclick="railScroll('${id}',-1)" aria-label="Scroll left">${ic('chev-left', 17)}</button>
        <button class="arr" onclick="railScroll('${id}',1)" aria-label="Scroll right">${ic('chev-right', 17)}</button>
      </div>
    </div>
    <hr class="rail-rule">
    <div class="rail" id="${id}">${items.map((o) => kind === 'hcard' ? hcardHTML(o) : scardHTML(o)).join('')}</div>
  </section>`;
}
function railScroll(id, dir) {
  const el = document.getElementById(id);
  if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.7), behavior: 'smooth' });
}
function scardHTML(o, chip) {
  const sv = S.saved.has(o.id);
  const urgent = o.days_left > 0 && o.days_left <= 7;
  return `<article class="scard" draggable="true" ondragstart="event.dataTransfer.setData('application/scout-opp','${o.id}');event.dataTransfer.effectAllowed='copy'" onclick="openDetail('${o.id}')">
    <div class="im ${o.realImg ? 'contain' : ''}">${o.realImg ? `<img class="blurfill" src="${esc(o.img)}" alt="" aria-hidden="true" loading="lazy">` : ''}<img class="mainimg" src="${esc(o.img)}" alt="${esc(o.title)}" loading="lazy" onerror="this.style.display='none'">
      <span class="tagchip">${o.applied > 500 ? fmtIN(o.applied) + ' registered' : o.type}</span>${badge2(o)}
      <button class="savebtn ${sv ? 'on' : ''}" onclick="event.stopPropagation();toggleSave('${o.id}',this)" aria-label="Save">${ic(sv ? 'bookmark-filled' : 'bookmark', 15)}</button>
      ${o.imgThumb && !o.realImg ? `<span class="orglogo"><img src="${esc(o.imgThumb)}" alt="${esc(o.org)}" loading="lazy" onerror="this.parentElement.style.display='none'"></span>` : ''}
    </div>
    <div class="bd">
      <div class="tt">${esc(o.title)}</div>
      <div class="ds">${esc(o.description.slice(0, 180))}</div>
      ${chip || ''}
      <div class="ft">
        <div class="dt"><span class="k">Deadline</span><span class="v ${urgent ? 'urgent' : ''}">${urgent ? o.days_left + ' days left' : esc(o.deadline)}</span></div>
        <span class="explore">Explore ${ic('arrow-up-right', 14)}</span>
      </div>
    </div></article>`;
}
function hcardHTML(o) {
  const m = o._score || 80;
  return `<article class="hcard" draggable="true" ondragstart="event.dataTransfer.setData('application/scout-opp','${o.id}');event.dataTransfer.effectAllowed='copy'" onclick="openDetail('${o.id}')">
    <img class="bg" src="${esc(o.img)}" alt="${esc(o.title)}" loading="lazy">
    <div class="shade"></div>
    <span class="glasschip">${m}% match</span>
    <div class="dots"><i></i><i></i><i></i><i></i></div>
    <div class="inf">
      <div class="rw1"><span class="tt">${esc(shortTitle(o))}</span><span class="pr">${esc(o.prize)}</span></div>
      <div class="addr">${esc(o.org)} · ${esc(o.location)}</div>
      <div class="specs">
        <span class="sp">${ic('calendar', 13)}<b>${o.days_left}d</b></span>
        <span class="sp">${ic('zap', 13)}<b>${o.type}</b></span>
        <span class="sp">${ic('users', 13)}<b>${o.applied > 999 ? (o.applied / 1000).toFixed(1) + 'K' : o.applied || 'New'}</b></span>
      </div>
    </div></article>`;
}

/* ═══════════ DISCOVER ═══════════ */
/* explicit location facet — remote / my city / India / global */
function applyLocFilter(list) {
  const L = S.disLoc;
  if (!L || L === 'all') return list;
  const myCity = ((S.profile && S.profile.city) || '').toLowerCase();
  if (L === 'remote') return list.filter((o) => o.geo === 'remote' || /online|remote|virtual/i.test(o.location || ''));
  if (L === 'city') return myCity ? list.filter((o) => String(o.location || '').toLowerCase().includes(myCity)) : list;
  if (L === 'india') return list.filter((o) => o.geo === 'india' || /india|delhi|mumbai|bengaluru|bangalore|hyderabad|pune|chennai|kolkata/i.test(o.location || ''));
  if (L === 'global') return list.filter((o) => o.geo === 'global' || o.geo === 'remote');
  return list;
}
function locFilterHTML() {
  const myCity = (S.profile && S.profile.city) || '';
  const opts = [['all', 'Anywhere'], ['remote', 'Remote'], ...(myCity ? [['city', myCity]] : []), ['india', 'India'], ['global', 'Global']];
  return `<span class="sortsel">${ic('pin', 13)}&nbsp;<select onchange="S.disLoc=this.value;renderDiscover()">${opts.map(([v, t]) => `<option value="${v}" ${S.disLoc === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></span>`;
}
function setDisType(t, sort) { S.disView = 'foryou'; S.disType = t; if (sort) S.disSort = sort; S.disQuery = ''; }
function setDisView(v) { S.disView = v; S.disDomain = null; S.disQuery = ''; renderDiscover(); }

const DIS_TABS = [
  ['foryou', 'For you', 'compass'],
  ['upcoming', 'Upcoming', 'calendar'],
  ['domains', 'By field', 'grid'],
  ['competitive', 'By competition', 'trophy'],
  ['cv', 'Build your CV', 'cap'],
  ['culture', 'Culture & events', 'globe'],
  ['giveback', 'Give back', 'heart'],
];
const EVENT_TYPES = ['Conference', 'Talk', 'Workshop', 'Meetup', 'Quiz', 'Exhibition', 'Cultural', 'Networking', 'Academic'];
const VOL_TYPES = ['Volunteering', 'Social'];

function intensityChip(o) {
  const m = metrics(o, o._score);
  const col = m.intensity >= 62 ? 'var(--red)' : m.intensity >= 42 ? 'var(--orange)' : 'var(--green-deep)';
  return `<div class="scard-chip"><span class="ci-bar"><i style="width:${m.intensity}%;background:${col}"></i></span><b style="color:${col}">${intensityLabel(m.intensity)}</b><span>· ${m.odds}% your odds</span></div>`;
}
function cvChip(o) {
  const m = metrics(o, o._score);
  return `<div class="scard-chip"><span class="ci-bar"><i style="width:${m.cv}%;background:var(--ink)"></i></span><b>CV ${m.cv}</b><span>· ROI ${m.grade}</span></div>`;
}

function renderDiscover() {
  const el = document.getElementById('vw-discover');
  const matches = computeMatches();
  const V = S.disView;
  let list = matches, chipFn = null, subhtml = '', countLabel = '';

  if (S.disQuery) {
    const f = parseQuery(S.disQuery);
    list = nlpSearch(S.disQuery, matches, f);
    const chips = summarizeFacets(f);
    subhtml = `<div class="nlp-read"><span class="nlp-lab">Understood</span>${chips.map((c) => `<span class="nlp-chip">${esc(c)}</span>`).join('') || '<span class="nlp-chip">free text</span>'}<button class="nlp-clear" onclick="S.disQuery='';renderDiscover()">Clear ✕</button></div>`;
    countLabel = fmtIN(list.length) + ' matches for “' + esc(S.disQuery) + '” — ranked for you';
  } else if (V === 'foryou') {
    const present = new Set(DATA.map((o) => o.type));
    const types = ['All', ...['Hackathon', 'Competition', 'Scholarship', 'Internship', 'Fellowship', 'Grant', ...EVENT_TYPES, ...VOL_TYPES].filter((t) => present.has(t))];
    if (S.disType !== 'All') list = list.filter((o) => o.type === S.disType);
    list = applyLocFilter(list);
    if (S.disSort === 'closing') list = list.filter((o) => o.days_left > 0).sort((a, b) => a.days_left - b.days_left);
    else if (S.disSort === 'viral') list = list.slice().sort((a, b) => b.applied - a.applied);
    else if (S.disSort === 'prize') list = list.slice().sort((a, b) => (b.prize_cash || 0) - (a.prize_cash || 0));
    else if (S.disSort === 'odds') list = list.slice().sort((a, b) => metrics(b, b._score).odds - metrics(a, a._score).odds);
    else if (S.disSort === 'roi') list = list.slice().sort((a, b) => metrics(b, b._score).roi - metrics(a, a._score).roi);
    else if (S.disSort === 'cv') list = list.slice().sort((a, b) => metrics(b, b._score).cv - metrics(a, a._score).cv);
    subhtml = `<div class="filters">
      ${types.map((t) => `<button class="${S.disType === t ? 'on' : ''}" onclick="S.disType='${t}';renderDiscover()">${t === 'All' ? 'All' : t + 's'}</button>`).join('')}
      <span class="spacer"></span>
      ${locFilterHTML()}
      <span class="sortsel">Sort&nbsp;<select onchange="S.disSort=this.value;renderDiscover()">
        <option value="match" ${S.disSort === 'match' ? 'selected' : ''}>Best match</option>
        <option value="closing" ${S.disSort === 'closing' ? 'selected' : ''}>Closing soon</option>
        <option value="odds" ${S.disSort === 'odds' ? 'selected' : ''}>Best odds</option>
        <option value="roi" ${S.disSort === 'roi' ? 'selected' : ''}>Best ROI</option>
        <option value="cv" ${S.disSort === 'cv' ? 'selected' : ''}>Best for CV</option>
        <option value="viral" ${S.disSort === 'viral' ? 'selected' : ''}>Most registered</option>
        <option value="prize" ${S.disSort === 'prize' ? 'selected' : ''}>Biggest prize</option>
      </select></span>
    </div>`;
    countLabel = fmtIN(list.length) + ' opportunities · ' + (S.disSort === 'match' ? 'sorted by your fit' : 'sorted by ' + S.disSort) + (API_LIVE ? ' · live' : '');
  } else if (V === 'upcoming') {
    list = applyLocFilter(matches.filter((o) => o.days_left > 0 && o.days_left <= S.disHorizon)).sort((a, b) => a.days_left - b.days_left);
    const H = [[7, 'This week'], [30, 'This month'], [90, 'This season'], [365, 'This year']];
    subhtml = `<div class="filters">${H.map(([d, l]) => `<button class="${S.disHorizon === d ? 'on' : ''}" onclick="S.disHorizon=${d};renderDiscover()">${l}</button>`).join('')}</div>`;
    countLabel = fmtIN(list.length) + ' happening in the next ' + (S.disHorizon >= 365 ? 'year' : S.disHorizon + ' days') + ' — soonest first';
  } else if (V === 'domains') {
    if (!S.disDomain) {
      const counts = {};
      matches.forEach((o) => (o.dom || []).forEach((d) => { counts[d] = (counts[d] || 0) + 1; }));
      const doms = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      el.innerHTML = discoverShell(`<div class="domgrid">${doms.map(([d, c]) => `<button class="domcard" onclick="S.disDomain='${d.replace(/'/g, "")}';renderDiscover()"><span class="dm-n">${esc(d)}</span><span class="dm-c">${c} live</span></button>`).join('')}</div>`);
      hydrateIcons(el); animateIn(el); return;
    }
    list = matches.filter((o) => (o.dom || []).includes(S.disDomain));
    subhtml = `<div class="dom-head"><button class="pill pill-ghost" onclick="S.disDomain=null;renderDiscover()">${ic('arrow-left', 14)} All fields</button><span class="dom-title">${esc(S.disDomain)}</span></div>`;
    countLabel = fmtIN(list.length) + ' in ' + esc(S.disDomain);
  } else if (V === 'competitive') {
    const hot = S.disCompMode === 'hot';
    list = matches.filter((o) => o.days_left > 0).slice().sort((a, b) => hot ? metrics(b, b._score).intensity - metrics(a, a._score).intensity : metrics(a, a._score).odds > metrics(b, b._score).odds ? 1 : -1);
    if (!hot) list = matches.filter((o) => o.days_left > 0).slice().sort((a, b) => metrics(b, b._score).odds - metrics(a, a._score).odds);
    chipFn = intensityChip;
    subhtml = `<div class="filters"><button class="${hot ? 'on' : ''}" onclick="S.disCompMode='hot';renderDiscover()">Most competitive</button><button class="${!hot ? 'on' : ''}" onclick="S.disCompMode='odds';renderDiscover()">Best odds for you</button></div>`;
    countLabel = hot ? 'Ranked by how fierce the field is' : 'Ranked by your odds — the winnable ones first';
  } else if (V === 'cv') {
    list = matches.slice().sort((a, b) => metrics(b, b._score).cv - metrics(a, a._score).cv);
    chipFn = cvChip;
    countLabel = 'The lines that make a CV — ranked by prestige signal';
  } else if (V === 'culture') {
    const present = EVENT_TYPES.filter((t) => DATA.some((o) => o.type === t));
    if (S.disType !== 'All' && present.includes(S.disType)) list = matches.filter((o) => o.type === S.disType);
    else list = matches.filter((o) => EVENT_TYPES.includes(o.type));
    list = list.slice().sort((a, b) => a.days_left - b.days_left);
    subhtml = `<div class="filters"><button class="${S.disType === 'All' || !present.includes(S.disType) ? 'on' : ''}" onclick="S.disType='All';renderDiscover()">All</button>${present.map((t) => `<button class="${S.disType === t ? 'on' : ''}" onclick="S.disType='${t}';renderDiscover()">${t}s</button>`).join('')}</div>`;
    countLabel = fmtIN(list.length) + ' talks, workshops, meetups & cultural happenings';
  } else if (V === 'giveback') {
    let vol = matches.filter((o) => VOL_TYPES.includes(o.type));
    const causes = [...new Set(vol.map((o) => o.cause).filter(Boolean))].sort().slice(0, 14);
    if (S.disCause) vol = vol.filter((o) => o.cause === S.disCause);
    list = vol.slice().sort((a, b) => a.days_left - b.days_left);
    subhtml = causes.length ? `<div class="filters"><button class="${!S.disCause ? 'on' : ''}" onclick="S.disCause=null;renderDiscover()">All causes</button>${causes.map((c) => `<button class="${S.disCause === c ? 'on' : ''}" onclick="S.disCause='${String(c).replace(/'/g, '')}';renderDiscover()">${esc(c)}</button>`).join('')}</div>` : '';
    countLabel = list.length ? fmtIN(list.length) + ' ways to give back' + (S.disCause ? ' · ' + esc(S.disCause) : '') + ' — with real NGOs across India' : '';
  }

  const cards = list.slice(0, 60).map((o) => scardHTML(o, chipFn ? chipFn(o) : '')).join('')
    || `<div class="empty" style="grid-column:1/-1"><div class="h">${V === 'giveback' ? 'Volunteering listings are landing soon' : 'Nothing here yet'}</div><div class="s">${V === 'giveback' ? 'Scout is wiring live volunteering & social-impact sources.' : 'Try another collection, field, or ask the AI above.'}</div></div>`;
  el.innerHTML = discoverShell(`${subhtml}<div class="count-line">${countLabel}</div><div class="grid-cards">${cards}</div>`);
  hydrateIcons(el); animateIn(el);
}
function discoverShell(inner) {
  return `
    <h1 class="h-display">Discover</h1>
    <div class="bigsearch">
      ${ic('search', 24)}
      <input id="dis-search" placeholder="Try “remote AI hackathons closing this week” or “volunteering in Delhi”" value="${esc(S.disQuery)}" onkeydown="if(event.key==='Enter')runSearch(this.value)" oninput="if(!this.value){S.disQuery='';renderDiscover()}">
      <button class="pill pill-dark go" onclick="runSearch(document.getElementById('dis-search').value)">${ic('search', 14)} Search</button>
    </div>
    <nav class="dis-tabs">${DIS_TABS.map(([v, lab, icn]) => `<button class="${S.disView === v && !S.disQuery ? 'on' : ''}" onclick="setDisView('${v}')">${ic(icn, 15)}${lab}</button>`).join('')}</nav>
    ${inner}`;
}

/* ═══════════ REAL NLP SEARCH — client-side, no LLM ═══════════ */
const SEARCH_SYN = {
  'AI/ML': ['ai', 'ml', 'machine learning', 'artificial intelligence', 'deep learning', 'llm', 'genai', 'gen ai', 'nlp', 'data science', 'data'],
  'Engineering': ['coding', 'developer', 'software', 'web dev', 'app dev', 'robotics', 'cyber', 'blockchain', 'web3', 'cloud', 'devops', 'programming', 'engineering'],
  'Design': ['design', 'ui', 'ux', 'figma', 'graphic', 'product design'],
  'Business': ['business', 'startup', 'entrepreneur', 'marketing', 'consulting', 'strategy', 'mba', 'case study', 'sales'],
  'Finance': ['finance', 'fintech', 'trading', 'investment', 'banking', 'accounting'],
  'ClimaTech': ['climate', 'sustainability', 'environment', 'renewable', 'clean energy', 'climatech'],
  'Life Sciences': ['biology', 'biotech', 'pharma', 'genomics', 'life science'],
  'HealthTech': ['health', 'medical', 'medicine', 'wellness', 'clinical', 'healthtech'],
  'Policy': ['policy', 'governance', 'law', 'legal', 'civic', 'public policy'],
  'Social Impact': ['social impact', 'ngo', 'nonprofit', 'community service', 'csr', 'social work'],
  'Arts': ['arts', 'music', 'film', 'photography', 'dance', 'theatre', 'literature', 'painting'],
};
const SEARCH_TYPES = { hackathon: 'Hackathon', hack: 'Hackathon', competition: 'Competition', contest: 'Competition', quiz: 'Quiz', internship: 'Internship', intern: 'Internship', jobs: 'Job', job: 'Job', scholarship: 'Scholarship', fellowship: 'Fellowship', grant: 'Grant', conference: 'Conference', talk: 'Talk', workshop: 'Workshop', meetup: 'Meetup', networking: 'Networking', volunteering: 'Volunteering', volunteer: 'Volunteering', exhibition: 'Exhibition', gallery: 'Exhibition', cfp: 'Academic' };
const SEARCH_CITIES = ['bangalore', 'bengaluru', 'delhi', 'mumbai', 'hyderabad', 'pune', 'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'noida', 'gurugram', 'goa'];
const SEARCH_STOP = new Set(['the', 'a', 'an', 'for', 'in', 'on', 'of', 'me', 'my', 'with', 'and', 'to', 'that', 'are', 'is', 'best', 'good', 'show', 'find', 'get', 'near', 'this', 'week', 'soon', 'online', 'remote', 'free', 'paid', 'want', 'looking', 'some', 'any', 'all', 'closing', 'open']);
const reWord = (w) => new RegExp('(^|[^a-z])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?([^a-z]|$)');

function parseQuery(q) {
  const t = ' ' + q.toLowerCase().trim() + ' ';
  const f = { types: [], domains: [], city: null, remote: false, maxDays: null, free: false, minPrize: 0, cv: false, terms: [] };
  for (const [w, T] of Object.entries(SEARCH_TYPES)) if (reWord(w).test(t) && !f.types.includes(T)) f.types.push(T);
  for (const [D, words] of Object.entries(SEARCH_SYN)) { for (const w of words) if (reWord(w).test(t)) { if (!f.domains.includes(D)) f.domains.push(D); break; } }
  for (const c of SEARCH_CITIES) if (t.includes(c)) f.city = c;
  if (/\b(remote|online|virtual|work from home|wfh)\b/.test(t)) f.remote = true;
  if (/\b(this week|closing soon|urgent|expiring|last chance)\b/.test(t)) f.maxDays = 7;
  else if (/\b(this month|next 30)\b/.test(t)) f.maxDays = 30;
  else { const m = t.match(/(\d+)\s*days?/); if (m) f.maxDays = parseInt(m[1], 10); }
  if (/\b(free|no fee|no cost|zero cost)\b/.test(t)) f.free = true;
  if (/\b(paid|stipend|cash|prize money|salary|lpa)\b/.test(t)) f.minPrize = 1;
  const pm = t.match(/(\d+)\s*(lakh|l\b|lac)/); if (pm) f.minPrize = parseInt(pm[1], 10) * 100000;
  if (/\b(cv|resume|résumé|resume-worthy|portfolio|prestigious)\b/.test(t)) f.cv = true;
  f.terms = q.toLowerCase().split(/[^a-z0-9+/]+/).filter((w) => w.length > 2 && !SEARCH_STOP.has(w));
  return f;
}
function summarizeFacets(f) {
  const out = [];
  f.types.forEach((T) => out.push(T));
  f.domains.forEach((D) => out.push(D));
  if (f.city) out.push(f.city[0].toUpperCase() + f.city.slice(1));
  if (f.remote) out.push('Remote');
  if (f.maxDays) out.push('≤ ' + f.maxDays + 'd');
  if (f.free) out.push('Free');
  if (f.minPrize > 1) out.push('₹' + shortIN(f.minPrize) + '+');
  else if (f.minPrize) out.push('Paid');
  if (f.cv) out.push('CV-worthy');
  return out;
}
function nlpSearch(q, items, f) {
  f = f || parseQuery(q);
  const strict = f.terms.length && !f.types.length && !f.domains.length && !f.city && !f.remote;
  const scored = [];
  for (const o of items) {
    if (o.days_left < 0) continue;
    let s = 0, tok = 0;
    if (f.types.length) s += f.types.includes(o.type) ? 32 : -10;
    if (f.domains.length) { const h = (o.dom || []).filter((d) => f.domains.includes(d)).length; s += h ? 18 * h : -4; }
    if (f.remote) s += o.geo === 'remote' ? 15 : -4;
    if (f.city) s += (o.location || '').toLowerCase().includes(f.city) ? 18 : -4;
    if (f.maxDays) s += (o.days_left > 0 && o.days_left <= f.maxDays) ? 12 : -5;
    if (f.free) s += (o.prize_cash || 0) === 0 ? 7 : -2;
    if (f.minPrize) s += (o.prize_cash || 0) >= f.minPrize ? 12 : -3;
    if (f.cv) s += (metrics(o, o._score).cv - 55) * 0.35;
    const title = (o.title || '').toLowerCase(), org = (o.org || '').toLowerCase(), skl = (o.skills || []).join(' ').toLowerCase(), dom = (o.dom || []).join(' ').toLowerCase(), desc = (o.description || '').toLowerCase();
    for (const term of f.terms) {
      if (title.includes(term)) { s += 24; tok++; }
      else if (org.includes(term)) { s += 15; tok++; }
      else if (skl.includes(term) || dom.includes(term)) { s += 13; tok++; }
      else if (desc.includes(term)) { s += 6; tok++; }
    }
    if (strict && tok === 0) continue;                 // typed real words but nothing matched
    if (s <= 0 && (f.types.length || f.domains.length || f.city)) continue;
    s += (o._score || 70) * 0.08;                      // profile fit tiebreaker
    scored.push({ o, s });
  }
  return scored.sort((a, b) => b.s - a.s).map((r) => r.o);
}
// entry point used by the search box + the global dock
function runSearch(q) {
  q = (q || '').trim();
  if (!q) { S.disQuery = ''; if (S.view === 'discover') renderDiscover(); return; }
  const recent = (ls('scout-recent') || []).filter((x) => x !== q);
  recent.unshift(q); ls('scout-recent', recent.slice(0, 6));
  S.disQuery = q; S.disView = 'foryou';
  if (S.view === 'discover') renderDiscover(); else goV('discover');
}
function fireSearch(q) { runSearch(q); }

/* ═══════════ SAVED ═══════════ */
/* ═══════════ SCOUTED — progress workspace ═══════════ */
function scoutedShell(inner, countLine) {
  const c = pipeCounts();
  const tabs = [['overview', 'Overview', 'layers', null], ...STAGES.map((s) => [s.v, s.t, s.icn, c[s.v]])];
  return `<h1 class="h-display">Scouted</h1>
    <div class="count-line">${countLine}</div>
    <div class="sc-tabs">${tabs.map(([v, t, icn, n]) =>
      `<button class="sc-tab ${S.scView === v ? 'on' : ''}" onclick="setSc('${v}')">${ic(icn, 14)} ${t}${n ? `<span class="sc-n">${n}</span>` : ''}</button>`).join('')}</div>
    ${inner}`;
}
function setSc(v) { S.scView = v; renderScouted(); window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); }
function renderScouted() {
  const el = document.getElementById('vw-scouted');
  const c = pipeCounts();
  const total = c.saved + c.draft + c.applied + c.result;
  let inner, line;
  if (!total) {
    inner = `<div class="empty"><div class="h">Nothing scouted yet</div><div class="s">Save anything you like and it lands here — Scout tracks the deadline, your draft, and whether you actually sent it.</div><button class="pill pill-dark" onclick="goV('discover')">Browse opportunities</button></div>`;
    line = 'Your pipeline — saved, drafted, applied, decided';
  } else if (S.scView === 'overview') {
    inner = scOverview();
    line = `${total} tracked · ${c.applied + c.result} sent`;
  } else {
    const list = pipeIn(S.scView);
    const st = STAGES.find((s) => s.v === S.scView);
    inner = list.length
      ? `<div class="grid-cards">${list.map((pp) => pipeCardHTML(pp)).join('')}</div>`
      : `<div class="empty"><div class="h">No ${st.t.toLowerCase()} yet</div><div class="s">${st.d}.</div><button class="pill pill-dark" onclick="setSc('overview')">Back to overview</button></div>`;
    line = `${list.length} ${st.t.toLowerCase()} · ${st.d}`;
  }
  el.innerHTML = scoutedShell(inner, line);
  hydrateIcons(el);
  animateIn(el);
}

/* a pipeline card — renders from the snapshot, so it survives feed rotation */
function pipeCardHTML(pp) {
  const o = pipeOpp(pp);
  const days = o.deadline_ts ? Math.ceil((o.deadline_ts * 1000 - Date.now()) / 86400000) : null;
  const dead = days !== null && days <= 0;
  const urgent = days !== null && days > 0 && days <= 7;
  const st = STAGES.find((s) => s.v === pp.stage);
  const gone = !DATA.find((x) => String(x.id) === pp.id);
  const pct = pp.pct || 0;
  return `<article class="scard pipe" onclick="openDetail('${pp.id}')">
    <div class="im ${o.realImg ? 'contain' : ''}">${o.realImg ? `<img class="blurfill" src="${esc(o.img)}" alt="" aria-hidden="true" loading="lazy">` : ''}<img class="mainimg" src="${esc(o.img)}" alt="" loading="lazy" onerror="this.style.display='none'">
      <span class="tagchip stage-chip" style="--sc:${st.col}">${ic(st.icn, 11)} ${st.t.replace(/s$/, '')}</span>
      ${dead ? '<span class="badge2 closed">Closed</span>' : ''}
    </div>
    <div class="bd">
      <div class="tt">${esc(o.title)}</div>
      <div class="ds">${esc(o.org)} · ${esc(o.type)}</div>
      ${pp.stage === 'draft' ? `<div class="pipe-prog"><div class="pp-bar"><i style="width:${pct}%"></i></div><span>${pct}% drafted</span></div>` : ''}
      ${pp.stage === 'applied' ? `<div class="pipe-meta">${ic('send', 12)} Sent ${relTime(pp.appliedAt)}${pp.method === 'external' ? ' · marked by you' : pp.method === 'demo' ? ' · demo submit' : ''}</div>` : ''}
      ${pp.stage === 'result' ? `<div class="pipe-meta res-${pp.outcome}">${ic('trophy', 12)} ${(OUTCOMES.find((x) => x[0] === pp.outcome) || ['', 'Heard back'])[1]}</div>` : ''}
      <div class="ft">
        <div class="dt"><span class="k">${dead ? 'Closed' : 'Deadline'}</span><span class="v ${urgent ? 'urgent' : ''}">${dead ? esc(o.deadline) : urgent ? days + ' days left' : esc(o.deadline)}</span></div>
        ${pp.stage === 'saved' && !dead ? `<button class="pill pill-dark pill-sm" onclick="event.stopPropagation();startApply('${pp.id}')">${ic('pen', 12)} Start</button>`
          : pp.stage === 'draft' ? `<button class="pill pill-dark pill-sm" onclick="event.stopPropagation();startApply('${pp.id}')">${ic('pen', 12)} Resume</button>`
          : pp.stage === 'applied' ? `<button class="pill pill-ghost pill-sm" onclick="event.stopPropagation();askOutcome('${pp.id}')">${ic('trophy', 12)} Log result</button>`
          : ''}
      </div>
      ${gone ? '<div class="pipe-gone">Kept from when you saved it — no longer in the live feed</div>' : ''}
    </div>
  </article>`;
}
function relTime(ts) {
  if (!ts) return 'recently';
  const d = Math.floor((Date.now() - ts) / 86400000);
  return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 30 ? d + ' days ago' : new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function askOutcome(id) {
  const pp = pipeGet(id); if (!pp) return;
  sheet(`<div class="sh-h">How did it go?</div><div class="sh-s">${esc(pp.snap.title)}</div>
    <div class="sh-opts">${OUTCOMES.map(([v, t]) => `<button class="sh-opt" onclick="setOutcome('${id}','${v}')">${t}</button>`).join('')}</div>`);
}
function setOutcome(id, v) {
  const o = DATA.find((x) => String(x.id) === String(id));
  pipeSet(id, v === 'waiting' ? { stage: 'applied' } : { stage: 'result', outcome: v, resultAt: Date.now() }, o);
  closeSheet();
  toast(v === 'won' ? 'Logged. It stays in your record.' : v === 'waiting' ? 'Still open — kept in Applied' : 'Logged. On to the next one.');
  if (dashLive()) renderDash(S.dashSec); else renderScouted();
}

/* ————— overview: the honest progress dashboard ————— */
function scOverview() {
  const c = pipeCounts();
  const all = Object.values(S.pipe).filter((p) => p.snap);
  const sent = c.applied + c.result;
  const results = pipeIn('result');
  const wins = results.filter((p) => p.outcome === 'won' || p.outcome === 'shortlist').length;
  const atStake = all.filter((p) => p.stage === 'applied').reduce((s, p) => s + (p.snap.prize_cash || 0), 0);
  const hours = all.filter((p) => p.stage !== 'saved').reduce((s, p) => s + (EFFORT_HOURS[p.snap.type] || 8), 0);
  // saved, closing soon, nothing started — the thing this whole app exists to prevent
  const atRisk = pipeIn('saved').filter((p) => {
    const d = p.snap.deadline_ts ? Math.ceil((p.snap.deadline_ts * 1000 - Date.now()) / 86400000) : 99;
    return d > 0 && d <= 10;
  }).slice(0, 4);
  const slipped = pipeIn('saved').filter((p) => p.snap.deadline_ts && p.snap.deadline_ts * 1000 < Date.now()).length;
  return `<div class="sc-funnel rv">${STAGES.map((s, i) => {
      const n = c[s.v], w = Math.max(6, (n / Math.max(1, c.saved + c.draft + c.applied + c.result)) * 100);
      return `<button class="fn-step" onclick="setSc('${s.v}')">
        <div class="fn-top"><span class="fn-t">${ic(s.icn, 13)} ${s.t}</span><span class="fn-n" data-count="${n}">0</span></div>
        <div class="fn-bar"><i style="width:${w}%;background:${s.col}"></i></div>
        <div class="fn-d">${s.d}</div>
      </button>${i < STAGES.length - 1 ? `<span class="fn-ar">${ic('arrow-right', 13)}</span>` : ''}`;
    }).join('')}</div>

    <div class="sc-stats rv">
      <div class="sc-stat"><div class="l">Actually sent</div><div class="v"><b data-count="${sent}">0</b><span>of ${c.saved + c.draft + c.applied + c.result} saved</span></div>
        <div class="sc-mini">${sent && (c.saved + c.draft + c.applied + c.result) ? Math.round(sent / (c.saved + c.draft + c.applied + c.result) * 100) : 0}% follow-through${slipped ? ` · ${slipped} slipped past the deadline` : ''}</div></div>
      <div class="sc-stat"><div class="l">Hours invested</div><div class="v"><b data-count="${hours}">0</b><span>hrs</span></div>
        <div class="sc-mini">estimated across everything you've drafted or sent</div></div>
      <div class="sc-stat"><div class="l">Riding on it</div><div class="v"><b>₹${fmtIN(atStake)}</b></div>
        <div class="sc-mini">total purse across your live applications</div></div>
      <div class="sc-stat"><div class="l">Heard back</div><div class="v"><b data-count="${results.length}">0</b><span>${wins ? '· ' + wins + ' good' : ''}</span></div>
        <div class="sc-mini">${sent ? Math.round(results.length / sent * 100) + '% of what you sent has closed out' : 'log outcomes to see your real hit rate'}</div></div>
    </div>

    ${atRisk.length ? `<section class="sc-risk rv">
      <div class="sc-h"><h3>Saved, closing, untouched</h3><span>the exact thing Scout exists to stop</span></div>
      ${atRisk.map((p) => {
        const d = Math.ceil((p.snap.deadline_ts * 1000 - Date.now()) / 86400000);
        return `<div class="risk-row" onclick="openDetail('${p.id}')">
          <span class="rr-d ${d <= 3 ? 'hot' : ''}">${d}d</span>
          <span class="rr-t">${esc(p.snap.title)}</span>
          <span class="rr-o">${esc(p.snap.org)}</span>
          <button class="pill pill-dark pill-sm" onclick="event.stopPropagation();startApply('${p.id}')">${ic('pen', 12)} Start it</button>
        </div>`;
      }).join('')}
    </section>` : ''}

    ${!(S.user && S.user.email) && (c.draft + c.applied) >= 1 ? `<section class="sc-nudge rv">
      <div><div class="sn-t">${ic('bookmark', 14)} This all lives in one browser</div>
      <div class="sn-s">${c.draft + c.applied} ${c.draft + c.applied === 1 ? 'application' : 'applications'} of real work. An account keeps it if this device doesn't.</div></div>
    </section>` : ''}

    <section class="sc-act rv">
      <div class="sc-h"><h3>Your last 12 weeks</h3><span>every save, draft and send</span></div>
      ${actGridHTML()}
    </section>`;
}
function actGridHTML() {
  const acts = ls('scout-acts') || [];
  const byDay = {};
  for (const a of acts) byDay[new Date(a.t).toISOString().slice(0, 10)] = (byDay[new Date(a.t).toISOString().slice(0, 10)] || 0) + 1;
  const cells = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today - 83 * 86400000);
  for (let i = 0; i < 84; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const k = d.toISOString().slice(0, 10);
    const n = byDay[k] || 0;
    cells.push(`<i class="ac-c l${n === 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3}" title="${k} — ${n} action${n === 1 ? '' : 's'}"></i>`);
  }
  const active = Object.keys(byDay).length;
  return `<div class="act-grid">${cells.join('')}</div>
    <div class="act-leg"><span>${active} active day${active === 1 ? '' : 's'} · ${acts.length} action${acts.length === 1 ? '' : 's'}</span>
    <span class="ac-key">less ${[0, 1, 2, 3].map((l) => `<i class="ac-c l${l}"></i>`).join('')} more</span></div>`;
}

/* ————— bottom sheet (outcomes, quick pickers) ————— */
function sheet(html) {
  let el = document.getElementById('sheet');
  if (!el) { el = document.createElement('div'); el.id = 'sheet'; el.className = 'sheet-wrap'; document.body.appendChild(el); }
  el.innerHTML = `<div class="sheet-scrim" onclick="closeSheet()"></div><div class="sheet">${html}</div>`;
  el.classList.add('on');
  if (window.gsap && !REDUCED) gsap.fromTo(el.querySelector('.sheet'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: 'power3.out' });
}
function closeSheet() { const el = document.getElementById('sheet'); if (el) el.classList.remove('on'); }

/* ═══════════ APPLY WITH SCOUT — the supervised browser agent ═══════════
   Scout can't reach another site's tab from the PWA sandbox, so the agent lives
   in the browser extension. This surface explains the flow, hands off to the
   portal, and — crucially — lets a student watch it work once on a practice form
   before trusting it on a real application. The agent NEVER submits; that's the
   whole trust position. */
function scoutExt() { return document.documentElement.getAttribute('data-scout-ext') || null; }
function applyWithScout(id) {
  const o = resolveOpp(id);
  if (!o) return toast('That listing is no longer available');
  const has = scoutExt();
  const url = esc(o.source_url || '');
  const site = esc(o.display_url || 'the portal');
  sheet(`
    <div class="aws">
      <div class="aws-head">
        <span class="aws-heart">${heartSVG()}</span>
        <div><b>Let Scout fill it</b><i>${has ? 'The Scout agent is installed and ready.' : 'Scout fills the form while you watch — you review and submit.'}</i></div>
      </div>
      <ol class="aws-steps">
        <li><span>1</span><div><b>Open ${site}</b><i>The application form, in a new tab.</i></div></li>
        <li><span>2</span><div><b>Scout takes over — visibly</b><i>It dims the page, walks field by field filling from your details, and narrates each step. Stop it any time.</i></div></li>
        <li><span>3</span><div><b>You review and submit</b><i>Scout stops at the review. Passwords, payments and OTPs are never touched. The final click is always yours.</i></div></li>
      </ol>
      ${has
        ? `<button class="pill pill-red pill-lg wide" onclick="closeSheet();window.open('${url}','_blank')">Open ${site} &amp; let Scout fill it ${ic('arrow-up-right', 15)}</button>
           <button class="aws-2nd" onclick="closeSheet();window.open('/ext-test.html','_blank')">Try it on a practice form first →</button>`
        : `<div class="aws-install">${ic('help', 14)} <span>The one-time browser add-on isn't installed yet. It runs entirely on your machine — no account, nothing uploaded.</span></div>
           <button class="pill pill-dark pill-lg wide" onclick="downloadExtension()">${ic('download', 15)} Get the Scout add-on</button>
           <button class="aws-2nd" onclick="closeSheet();window.open('/ext-test.html','_blank')">Watch it work on a practice form →</button>
           <a class="aws-2nd" href="${url}" target="_blank" rel="noopener" onclick="closeSheet()">Or just open ${site} and fill it yourself →</a>`}
      <div class="aws-fine">Scout never submits, pays, or confirms — and never runs where you can't see it.</div>
    </div>`);
}

/* ═══════════ DETAIL — full competition page ═══════════ */
function detailSpecs(o, urgent) {
  // type-specific spec sheet, Ledgerix hairline rows
  const rows = [['Deadline', `${esc(o.deadline)} · ${o.days_left <= 0 ? 'closing' : o.days_left + ' days left'}`, urgent]];
  if (o.type === 'Hackathon' || o.type === 'Competition') {
    rows.push(['Prize pool', esc(o.prize)], ['Team size', esc(o.team || '1')], ['Mode', esc(o.location)]);
    if (o.period) rows.push(['Submission window', esc(o.period)]);
  } else if (o.type === 'Internship') {
    rows.push(['Stipend', esc(o.prize)], ['Location', esc(o.location)], ['Duration', esc(o.duration || 'See listing')]);
  } else if (o.type === 'Scholarship' || o.type === 'Fellowship' || o.type === 'Grant') {
    rows.push(['Award', esc(o.prize)], ['Geography', esc(o.location)], ['Duration', esc(o.duration || 'One-time')]);
  } else {
    rows.push(['Prize / stipend', esc(o.prize)], ['Location', esc(o.location)]);
  }
  if (o.applied) rows.push(['Registered', fmtIN(o.applied)]);
  if (o.views) rows.push(['Views', fmtIN(o.views)]);
  rows.push(['Your match', o._score + '%']);
  return rows.map(([k, v, u]) => `<div class="spec-row"><span class="k">${k}</span><span class="v ${u ? 'urgent' : ''}">${v}</span></div>`).join('');
}
/* percentile distributions over the live feed — memoized per feed load */
let _dist = null;
function feedDist() {
  if (_dist && _dist.n === DATA.length) return _dist;
  const cv = [], appliedByType = {};
  for (const o of DATA) {
    const m = metrics(o, 70);
    cv.push(m.cv);
    (appliedByType[o.type] = appliedByType[o.type] || []).push(o.applied || 0);
  }
  cv.sort((a, b) => a - b);
  for (const t in appliedByType) appliedByType[t].sort((a, b) => a - b);
  _dist = { n: DATA.length, cv, appliedByType };
  return _dist;
}
function pctOf(sorted, v) {
  if (!sorted || !sorted.length) return 50;
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] <= v) lo = mid + 1; else hi = mid; }
  return Math.round(lo / sorted.length * 100);
}

/* ————— The real math: tangible viz, not linear meters ————— */
function dotMatrixSVG(frac, hot) {
  // Interfaces-style dot matrix: 24×7 grid, filled bottom-up per column like a skyline
  const C = 24, R = 7, out = [];
  for (let c = 0; c < C; c++) {
    const jitter = (hashCode('dm' + c) % 100) / 100 - 0.5;
    const h = Math.max(0, Math.min(R, Math.round((frac + jitter * 0.22) * R)));
    for (let r = 0; r < R; r++) {
      const on = (R - r) <= h;
      out.push(`<rect x="${c * 13}" y="${r * 13}" width="9" height="9" rx="2" fill="${on ? (hot ? '#FF6A50' : '#FFFFFF') : 'rgba(255,255,255,.16)'}"/>`);
    }
  }
  return `<svg viewBox="0 0 ${C * 13 - 4} ${R * 13 - 4}" style="width:100%;height:auto" aria-hidden="true">${out.join('')}</svg>`;
}
function ringSVG(pct, col) {
  const r = 26, cir = 2 * Math.PI * r;
  return `<svg viewBox="0 0 64 64" class="ringviz" aria-hidden="true">
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="var(--hair)" stroke-width="7"/>
    <circle cx="32" cy="32" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${(pct / 100 * cir).toFixed(1)} ${cir.toFixed(1)}" transform="rotate(-90 32 32)"/></svg>`;
}
function daySegsHTML(effort, daysLeft) {
  const planDays = Math.max(1, Math.min(daysLeft || 1, 7));
  const perDay = effort / planDays;
  let segs = '';
  for (let d = 0; d < planDays; d++) {
    const h = Math.min(1, perDay / 8);   // 8h day = full bar
    segs += `<div class="seg-day"><i style="height:${Math.max(10, h * 100).toFixed(0)}%;background:${perDay > 6 ? 'var(--red)' : perDay > 3 ? 'var(--orange)' : 'var(--green)'}"></i><span>D${d + 1}</span></div>`;
  }
  return { segs, planDays, perDay };
}
function cvSparkHTML(cvSorted, mine) {
  // 20-bin histogram of CV weight across the feed, marker at this listing
  const bins = new Array(20).fill(0);
  for (const v of cvSorted) bins[Math.min(19, Math.floor(v / 5))]++;
  const max = Math.max(...bins, 1);
  const bars = bins.map((b, i) => {
    const isMine = Math.floor(mine / 5) === i;
    return `<rect x="${i * 8}" y="${(40 - b / max * 38).toFixed(1)}" width="6" height="${(b / max * 38 + 2).toFixed(1)}" rx="1.5" fill="${isMine ? 'var(--red)' : 'var(--hair)'}"/>`;
  }).join('');
  return `<svg viewBox="0 0 158 42" style="width:100%;height:auto" aria-hidden="true">${bars}</svg>`;
}
function detailMetrics(o) {
  const m = metrics(o, o._score);
  const dist = feedDist();
  const crowdPct = pctOf(dist.appliedByType[o.type], o.applied || 0);
  const cvPct = pctOf(dist.cv, m.cv);
  const oneIn = Math.max(2, Math.round(100 / Math.max(1, m.odds)));
  const ev = Math.round((m.odds / 100) * (o.prize_cash || 0));
  const evHr = m.effort ? Math.round(ev / m.effort) : 0;
  const { segs, planDays, perDay } = daySegsHTML(m.effort, o.days_left);
  const oddsCol = m.odds >= 55 ? 'var(--green-deep)' : m.odds >= 30 ? 'var(--orange)' : 'var(--red)';
  return `<div class="dsec"><h3>The real math</h3>
    <div class="metgrid v2">
      <div class="metcard dark">
        <div class="met-h">The field you're entering</div>
        <div class="met-big">${o.applied ? fmtIN(o.applied) : 'No crowd yet'}<span>${o.applied ? 'already in' : ''}</span></div>
        ${dotMatrixSVG(m.intensity / 100, m.intensity >= 62)}
        <div class="met-sub">${intensityLabel(m.intensity)} — more crowded than <b>${crowdPct}%</b> of live ${o.type.toLowerCase()}s</div>
      </div>
      <div class="metcard">
        <div class="met-h">Your odds</div>
        <div class="met-ring">${ringSVG(m.odds, oddsCol)}<div class="met-big" style="color:${oddsCol}">1<span>in</span>${oneIn}</div></div>
        <div class="met-sub">${m.odds}% est. — your ${o._score}% fit vs this field</div>
      </div>
      <div class="metcard">
        <div class="met-h">Worth per hour</div>
        ${(o.prize_cash || 0) > 0
          ? `<div class="met-big">₹${fmtIN(evHr)}<span>/hr</span></div><div class="met-sub">odds-weighted purse ₹${fmtIN(ev)} ÷ ${m.effort}h of honest effort</div>`
          : `<div class="met-big">${(m.cv / m.effort).toFixed(1)}<span>CV pts/hr</span></div><div class="met-sub">no cash purse — this one pays in résumé signal</div>`}
        <div class="met-duo"><span style="width:${Math.min(100, (o.prize_cash ? evHr / 8 : m.cv))}%"></span></div>
      </div>
      <div class="metcard">
        <div class="met-h">Time to do it right</div>
        <div class="met-big">${m.effort}<span>hrs</span></div>
        <div class="segrow">${segs}</div>
        <div class="met-sub">≈ ${perDay < 1 ? '<1' : perDay.toFixed(perDay % 1 ? 1 : 0)}h/day across ${planDays} day${planDays > 1 ? 's' : ''}${perDay > 6 ? ' — a sprint, block the calendar' : perDay > 3 ? ' — a steady push' : ' — fits around classes'}</div>
      </div>
      <div class="metcard">
        <div class="met-h">Résumé weight</div>
        <div class="met-big">Top ${Math.max(1, 100 - cvPct)}%</div>
        ${cvSparkHTML(dist.cv, m.cv)}
        <div class="met-sub">where this sits across ${fmtIN(DATA.length)} live listings — ${m.cv >= 80 ? 'a marquee line' : m.cv >= 60 ? 'a solid line' : 'a supporting line'} on the CV</div>
      </div>
    </div>
    <div class="met-note">Computed from live registrations, prize value, effort norms per format, and your profile — a compass, not a promise.</div>
  </div>`;
}

function detailTimeline(o) {
  if (!o.regn_start || !o.deadline_ts) return '';
  const a = new Date(o.regn_start).getTime(), b = o.deadline_ts * 1000, now = Date.now();
  if (!(b > a)) return '';
  const p = Math.max(0, Math.min(1, (now - a) / (b - a)));
  const fmt = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `<div class="det-timeline"><div class="tl-bar"><div class="tl-fill" style="width:${(p * 100).toFixed(1)}%"></div><div class="tl-dot" style="left:${(p * 100).toFixed(1)}%"></div></div>
    <div class="tl-lbls"><span><b>${fmt(a)}</b>registration opened</span><span style="text-align:center"><b>${Math.round(p * 100)}% elapsed</b>you are here</span><span style="text-align:right"><b>${fmt(b)}</b>closes</span></div></div>`;
}
function regVelocity(o) {
  if (!o.regn_start || !o.applied) return '';
  const days = Math.max(1, (Date.now() - new Date(o.regn_start)) / 86400000);
  const perDay = o.applied / days;
  if (perDay < 2) return '';
  return `<div class="regvel">Filling at <b>~${Math.round(perDay)} registrations/day</b>${o.days_left > 0 ? ` — roughly <b>${fmtIN(Math.round(perDay * o.days_left))} more</b> expected before it closes` : ''}.</div>`;
}
function openDetail(id) {
  const o = computeMatches().find((x) => String(x.id) === String(id));
  if (!o) return;
  S.lastViewed = String(id);
  const el = document.getElementById('vw-detail');
  const sv = S.saved.has(o.id);
  const urgent = o.days_left <= 7;
  const similar = computeMatches(DATA.filter((x) => x.type === o.type && x.id !== o.id)).slice(0, 3);
  const paras = o.description.split(/(?<=\.)\s+(?=[A-Z0-9₹])/).reduce((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && (last + ' ' + s).length < 380) acc[acc.length - 1] = last + ' ' + s; else acc.push(s);
    return acc;
  }, []);
  el.innerHTML = `
    <a class="backlink" onclick="goV('${S.view === 'detail' ? 'home' : S.view}')">${ic('arrow-left', 15)} Back</a>
    <div class="det">
      <div>
        <div class="det-eyebrow"><span class="typechip">${o.type}</span><span class="eyebrow">${esc(o.display_url || o.source)}</span></div>
        <h1 class="det-title">${esc(o.title)}</h1>
        <div class="det-org">by <a href="${esc(o.source_url)}" target="_blank" rel="noopener">${esc(o.org)}</a> · ${esc(o.location)}</div>
        ${o.orgLogo || o.imgThumb ? `<div class="orgchip"><img src="${esc(o.orgLogo || o.imgThumb)}" alt="" onerror="this.style.display='none'"><span><span class="on">${esc(o.org)}</span><br><span class="os">host · via ${esc(o.display_url)}</span></span></div>` : ''}
        <div class="det-count ${urgent ? 'urgent' : ''}" id="det-count" data-ts="${o.deadline_ts || ''}"></div>
        ${detailTimeline(o)}
        <div class="toolrow">
          <button class="tool" onclick="addToCalendar('${o.id}')">${ic('calendar', 14)} Add deadline to calendar</button>
          <button class="tool" onclick="shareOpp('${o.id}')">${ic('share', 14)} Share</button>
          <a class="tool" href="${esc(o.source_url)}" target="_blank" rel="noopener">${ic('arrow-up-right', 14)} Official page</a>
          ${remindBtnHTML(o.id, 'deadline')}
          ${AI_ENABLED
            ? `<button class="tool" onclick="askScout('Build me a deadline checklist for ${esc(shortTitle(o)).replace(/'/g, '')}')">${ic('check', 14)} AI checklist</button>
          <button class="tool" onclick="askScout('Am I eligible for ${esc(shortTitle(o)).replace(/'/g, '')}?')">${ic('spark', 14)} Check eligibility</button>`
            : `<button class="tool soon" onclick="soon()">${ic('check', 14)} AI checklist<span class="soon-tag">Soon</span></button>
          <button class="tool soon" onclick="soon()">${ic('spark', 14)} Check eligibility<span class="soon-tag">Soon</span></button>`}
          <button class="tool" onclick="markApplied('${o.id}',this)">${ic('check', 14)} ${(pipeGet(o.id) || {}).stage === 'applied' ? 'Applied ✓' : 'Mark as applied'}</button>
        </div>
        <div class="spec-table">${detailSpecs(o, urgent)}</div>
        ${detailMetrics(o)}
        <div class="why"><h3>Why this matches you</h3>${whyMatch(o).map((t, i) => `<div class="why-it"><span class="n">${String(i + 1).padStart(2, '0')}</span><span>${t}</span></div>`).join('')}</div>
        ${planHTML(o)}
        <div class="dsec det-desc"><h3>About</h3>${paras.map((s) => `<p>${esc(s)}</p>`).join('')}</div>
        <div class="dsec"><h3>Eligibility</h3><p>${esc(o.eligibility)}</p></div>
        ${(o.skills || []).length ? `<div class="dsec"><h3>Skills</h3><div class="skillrow">${o.skills.map((s) => `<span>${esc(s)}</span>`).join('')}</div></div>` : ''}
      </div>
      <div class="det-side"><div class="det-sticky">
        <div class="det-img ${o.realImg ? 'contain' : ''}">${o.realImg ? `<img class="blurfill" src="${esc(o.img)}" alt="" aria-hidden="true">` : ''}<img class="mainimg" src="${esc(o.realImg ? o.img : (o.imgThumb || o.img))}" alt="${esc(o.title)}" onerror="this.src='${esc(o.img)}'"><span class="tagchip">${o.realImg ? 'Official banner' : o.imgThumb ? 'From ' + esc(o.display_url) : o.type}</span></div>
        <div class="det-cta">
          <button class="pill pill-red pill-lg" onclick="applyWithScout('${o.id}')">${ic('spark', 15)} Let Scout fill it</button>
          <button class="pill pill-ghost" onclick="window.open('${esc(o.source_url)}','_blank')">Open ${esc(o.display_url || 'source')} yourself ${ic('arrow-up-right', 14)}</button>
          <div class="rowx">
            ${AI_ENABLED
              ? `<button class="pill pill-dark" onclick="startApply('${o.id}')">${ic('spark', 14)} Apply with AI</button>`
              : `<button class="pill pill-dark soon" onclick="soon()">${ic('spark', 14)} Apply with AI<span class="soon-tag">Soon</span></button>`}
            <button class="icbtn ink ${sv ? 'on' : ''}" onclick="toggleSave('${o.id}',this)" aria-label="Save">${ic(sv ? 'bookmark-filled' : 'bookmark', 17)}</button>
            <button class="icbtn ink" onclick="shareOpp('${o.id}')" aria-label="Share">${ic('share', 17)}</button>
          </div>
          <div class="det-social"><span><b>${o.applied ? fmtIN(o.applied) : 'New'}</b>${o.applied ? ' registered' : ' — no crowd yet'}</span><span class="${urgent ? 'v urgent' : ''}" style="${urgent ? 'color:var(--red);font-weight:700' : ''}">${o.days_left} days left</span></div>
          ${regVelocity(o)}
        </div>
      </div></div>
    </div>
    ${similar.length ? `<section class="rail-sec"><div class="rail-top"><h2 style="font-size:clamp(28px,3vw,44px)">More like this</h2></div><hr class="rail-rule"><div class="rail">${similar.map(scardHTML).join('')}</div></section>` : ''}`;
  hydrateIcons(el);
  goV('detail');
  startCountdown(o);
}
function startCountdown(o) {
  stopCountdown();
  const host = document.getElementById('det-count');
  if (!host) return;
  const ts = o.deadline_ts ? o.deadline_ts * 1000 : Date.now() + o.days_left * 86400000;
  const cell = (v, l) => `<span class="cd"><b>${String(v).padStart(2, '0')}</b><span>${l}</span></span>`;
  const paint = () => {
    let ms = ts - Date.now();
    if (ms <= 0) { host.innerHTML = '<span class="cd"><b>Closed</b><span>registration</span></span>'; stopCountdown(); return; }
    const d = Math.floor(ms / 86400000); ms -= d * 86400000;
    const h = Math.floor(ms / 3600000); ms -= h * 3600000;
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms - m * 60000) / 1000);
    host.innerHTML = cell(d, 'days') + '<span class="sep">:</span>' + cell(h, 'hrs') + '<span class="sep">:</span>' + cell(m, 'min') + '<span class="sep">:</span>' + cell(s, 'sec');
  };
  paint();
  S._cd = setInterval(paint, 1000);
}
function stopCountdown() { if (S._cd) { clearInterval(S._cd); S._cd = null; } }
function addToCalendar(id) {
  const o = resolveOpp(id) || (S.pipe[String(id)] && S.pipe[String(id)].snap);
  if (!o) return toast('That deadline is no longer available');
  const dt = o.deadline_ts ? new Date(o.deadline_ts * 1000) : (o.days_left != null ? new Date(Date.now() + o.days_left * 864e5) : null);
  if (!dt) return toast('No dated deadline to export');
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Scout//EN', 'BEGIN:VEVENT',
    'UID:' + o.id + '@scout', 'DTSTAMP:' + stamp(new Date()),
    'DTSTART:' + stamp(new Date(dt.getTime() - 3600000)), 'DTEND:' + stamp(dt),
    'SUMMARY:' + o.title.replace(/[,;]/g, ' ') + ' — deadline',
    'DESCRIPTION:Apply: ' + o.source_url, 'BEGIN:VALARM', 'TRIGGER:-P3D', 'ACTION:DISPLAY', 'DESCRIPTION:3 days left', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'scout-deadline.ics';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Deadline exported — includes a 3-day-before alarm');
}
/* ═══════════ WHAT SCOUT KNOWS — the memory behind autofill ═══════════
   Pulled from four real places: your onboarding profile, the accounts you connect,
   everything you have typed to the copilot, and the answers you have already written. */
async function connectGitHub(handle) {
  handle = (handle || '').trim().replace(/^.*github\.com\//, '').replace(/\/$/, '');
  if (!handle) return toast('Enter your GitHub username');
  toast('Reading your public GitHub…');
  try {
    const [u, r] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(handle)}`).then((x) => x.json()),
      fetch(`https://api.github.com/users/${encodeURIComponent(handle)}/repos?sort=pushed&per_page=8`).then((x) => x.json()),
    ]);
    if (u.message === 'Not Found') return toast('No GitHub user by that name');
    const repos = (Array.isArray(r) ? r : []).filter((x) => !x.fork).slice(0, 6)
      .map((x) => ({ name: x.name, desc: (x.description || '').slice(0, 120), lang: x.language, stars: x.stargazers_count, url: x.html_url }));
    S.accounts.github = { handle: u.login, name: u.name, bio: u.bio, company: u.company, location: u.location,
      blog: u.blog, repos, followers: u.followers, publicRepos: u.public_repos, ts: Date.now() };
    ls('scout-accounts', S.accounts); queueSync();
    // fill the gaps it can fill for real
    if (!S.kit.github) S.kit.github = u.html_url;
    if (!S.kit.name && u.name) S.kit.name = u.name;
    if (!S.kit.bio && u.bio) S.kit.bio = u.bio;
    if (!S.kit.portfolio && u.blog) S.kit.portfolio = /^https?:/.test(u.blog) ? u.blog : 'https://' + u.blog;
    if (!S.kit.city && u.location) S.kit.city = u.location;
    ls('scout-kit', { ...ls('scout-kit'), ...S.kit }); queueSync();
    if (S.apply) { S.apply.kit = { ...S.apply.kit, ...S.kit }; renderApply(); }
    else renderProfile();
    toast(`GitHub connected — ${repos.length} project${repos.length === 1 ? '' : 's'} Scout can now write about`);
  } catch { toast('Could not reach GitHub just now'); }
}
function disconnectAcct(k) { delete S.accounts[k]; ls('scout-accounts', S.accounts); queueSync(); S.apply ? renderApply() : renderProfile(); toast('Disconnected'); }
/* everything you have ever told the copilot, deduped */
function mineChat() {
  const th = ls('scout-threads') || [];
  const said = [];
  for (const t of th) for (const m of (t.msgs || [])) {
    if (m.r !== 'me') continue;
    const s = String(m.c || '').trim();
    if (s.length > 12 && !said.includes(s)) said.push(s);
  }
  return said.slice(-25);
}
/* answers you have already written — the best source of your own voice */
function minePast(exceptId) {
  const out = [];
  for (const p of Object.values(S.pipe)) {
    if (!p.answers || p.id === String(exceptId)) continue;
    for (const [k, v] of Object.entries(p.answers)) {
      if (String(v || '').trim().length > 60) out.push({ q: k, a: String(v).slice(0, 500), on: p.snap ? p.snap.title : '' });
    }
  }
  return out.slice(0, 6);
}
function scoutMemory(exceptId) {
  return { profile: S.profile || {}, kit: S.kit || {}, accounts: S.accounts || {}, chat: mineChat(), past: minePast(exceptId) };
}
function memorySources(exceptId) {
  const m = scoutMemory(exceptId), out = [];
  const p = m.profile;
  if (p.role || (p.domains || []).length) out.push({ i: 'user', t: 'Your profile', d: [((ROLES.find((r) => r.v === p.role) || {}).t || '').split(' or ')[0], (p.domains || []).slice(0, 2).join(', '), p.city].filter(Boolean).join(' · ') });
  if (m.accounts.github) out.push({ i: 'link', t: 'GitHub', d: `@${m.accounts.github.handle} · ${m.accounts.github.repos.length} projects Scout can cite` });
  if (m.chat.length) out.push({ i: 'spark', t: 'What you told Scout', d: `${m.chat.length} message${m.chat.length === 1 ? '' : 's'} of context from your chats` });
  if (m.past.length) out.push({ i: 'file', t: 'Your past answers', d: `${m.past.length} from applications you already wrote` });
  return out;
}

/* ═══════════ APPLY THROUGH SCOUT ═══════════
   Scout builds the whole application: your kit auto-fills, the answers get drafted
   against the real listing, and it tracks what you sent. Where an organiser exposes
   a public form, Scout hands off with everything ready to paste. Where the portal is
   locked, it can't submit for you — the flow says so rather than pretending. */
const KIT_FIELDS = [
  ['name', 'Full name', 'text', 'Riya Sharma'],
  ['email', 'Email', 'email', 'you@college.ac.in'],
  ['phone', 'Phone', 'tel', '+91 90000 00000'],
  ['institution', 'Institution / employer', 'text', 'BITS Pilani'],
  ['year', 'Year / role', 'text', '3rd year, B.E. CS'],
  ['city', 'City', 'text', 'Bengaluru'],
  ['portfolio', 'Portfolio / website', 'url', 'https://'],
  ['github', 'GitHub', 'url', 'https://github.com/'],
  ['linkedin', 'LinkedIn', 'url', 'https://linkedin.com/in/'],
  ['resume', 'Résumé link (Drive/Dropbox)', 'url', 'https://'],
  ['bio', 'One-line bio', 'text', 'CS undergrad building ML tools for Indian classrooms'],
];
const Q_SETS = {
  Hackathon: [['idea', 'Your idea in one line', 140], ['why', 'Why this hackathon?', 600], ['team', 'Team & roles', 300], ['proof', 'Relevant work you can point to', 500]],
  Competition: [['why', 'Why you should win a slot', 600], ['proof', 'Relevant experience', 500]],
  Internship: [['why', 'Why this role, why this company', 900], ['proof', 'Most relevant thing you have built', 600], ['avail', 'Availability & start date', 200]],
  Scholarship: [['sop', 'Statement of purpose', 1800], ['need', 'Why you need this support', 800], ['impact', 'What you will do with it', 600]],
  Fellowship: [['sop', 'Statement of purpose', 1800], ['impact', 'The problem you want to work on', 900], ['proof', 'Track record', 600]],
  Grant: [['sop', 'Project summary', 1200], ['budget', 'How you would use the money', 700], ['impact', 'Expected outcome', 600]],
  Volunteering: [['why', 'Why this cause matters to you', 600], ['skills', 'Skills you bring', 400], ['avail', 'When you are free', 200]],
  Quiz: [['why', 'Why you are entering', 300]],
  Conference: [['why', 'What you hope to get out of it', 400], ['proof', 'Your background', 400]],
  Talk: [['idea', 'Talk title & thesis', 200], ['why', 'Why this audience needs it', 600], ['proof', 'Speaking history', 400]],
  Job: [['why', 'Why this role, why this company', 900], ['proof', 'Most relevant thing you have shipped', 600], ['avail', 'Notice period & start date', 200]],
  Academic: [['sop', 'Your research interest', 900], ['proof', 'Academic background', 500]],
  // events you register for rather than apply to — keep it to what a form actually asks
  Workshop: [['why', 'What you want out of it', 300]],
  Meetup: [['why', 'What brings you', 300]],
  Networking: [['why', 'What you are hoping to find', 300], ['bio', 'How you introduce yourself', 200]],
  Exhibition: [['why', 'What draws you to it', 300]],
  Cultural: [['why', 'What draws you to it', 300]],
};
const Q_DEFAULT = [['why', 'Why you are a fit', 700], ['proof', 'Relevant experience', 500]];
Q_SETS['Admission'] = [
  ['statement', 'Personal statement', 1500],
  ['whyProgram', 'Why this program', 650],
  ['academics', 'Academic record — the story behind the numbers', 500],
  ['activities', 'Activities & achievements', 900],
];
function qsFor(o) { return Q_SETS[o.type] || Q_DEFAULT; }
/* admission answers start from the essay bank — written once, adapted here */
function seedFromEssayBank(o, answers) {
  if (o.type !== 'Admission') return answers;
  const m = S.master || {};
  if (!answers.statement && m.personalStatement) answers.statement = m.personalStatement;
  if (!answers.whyProgram && m.whyProgram) answers.whyProgram = m.whyProgram;
  if (!answers.activities && m.activities) answers.activities = m.activities;
  return answers;
}
function kitSeed() {
  const p = S.profile || {}, d = S.onbData || {};
  const k = S.kit || {};
  return { name: k.name || S.user?.name || d.name || '', email: k.email || S.user?.email || '',
    phone: k.phone || '', institution: k.institution || p.institution || d.institution || '',
    year: k.year || p.gradYear || d.gradYear || '', city: k.city || p.city || d.city || '',
    portfolio: k.portfolio || '', github: k.github || '', linkedin: k.linkedin || '',
    resume: k.resume || '', bio: k.bio || '' };
}
function kitDone(k) { return ['name', 'email', 'institution'].every((f) => (k[f] || '').trim()); }
function applyPct(a) {
  const o = S.apply && S.apply.o; if (!o) return 0;
  const qs = qsFor(o);
  const filled = qs.filter((q) => ((a || {})[q[0]] || '').trim().length > 24).length;
  const kitOk = kitDone(S.apply.kit) ? 1 : 0;
  return Math.round(((filled / qs.length) * 0.75 + kitOk * 0.25) * 100);
}
function startApply(id) {
  const o = resolveOpp(id);
  if (!o) return toast('That listing is no longer available');
  const pp = pipeGet(id);
  const answers = seedFromEssayBank(o, (pp && pp.answers) || {});
  S.apply = { o, step: (pp && pp.answers && Object.keys(pp.answers).length) ? 1 : 0, kit: kitSeed(), answers, drafting: null };
  S.saved.add(String(id)); ls('scout-saved', [...S.saved]);
  // NOT promoted to 'draft' here — saveApply() does that on the first persisted answer.
  // Opening the window for three seconds must not inflate the draft tile or riskItems severity.
  goV('apply');
}
function saveApply() {
  const a = S.apply; if (!a) return;
  S.kit = { ...S.kit, ...a.kit }; ls('scout-kit', S.kit);
  const pct = applyPct(a.answers);
  const cur = pipeGet(a.o.id);
  if (!cur || cur.stage === 'saved' || cur.stage === 'draft') pipeSet(a.o.id, { stage: 'draft', answers: a.answers, pct }, a.o);
  else pipeSet(a.o.id, { answers: a.answers, pct }, a.o);
}
function applyStep(n) { saveApply(); S.apply.step = n; renderApply(); window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); }
function setKit(f, v) { S.apply.kit[f] = v; }
function setAns(f, v) { S.apply.answers[f] = v; const el = document.getElementById('ap-pct'); if (el) el.textContent = applyPct(S.apply.answers) + '%'; }
function renderApply() {
  const el = document.getElementById('vw-apply');
  const a = S.apply;
  if (!a) { goV('scouted'); return; }
  const o = a.o, steps = ['Your kit', 'Tailored answers', 'Review & send'];
  el.innerHTML = `<button class="backlink" onclick="saveApply();goV('scouted')">${ic('arrow-left', 14)} Save & close</button>
    <div class="ap-head">
      <div class="ap-org">${o.imgThumb ? `<img src="${esc(o.imgThumb)}" alt="" onerror="this.style.display='none'">` : ''}<div><div class="ap-t">${esc(o.title)}</div><div class="ap-s">${esc(o.org)} · ${esc(o.type)} · closes ${esc(o.deadline)}</div></div></div>
      <div class="ap-pct"><b id="ap-pct">${applyPct(a.answers)}%</b><span>ready</span></div>
    </div>
    <div class="ap-steps">${steps.map((t, i) =>
      `<button class="ap-step ${i === a.step ? 'on' : ''} ${i < a.step ? 'done' : ''}" onclick="applyStep(${i})"><span class="ap-n">${i < a.step ? ic('check', 13) : i + 1}</span>${t}</button>${i < 2 ? '<i class="ap-line"></i>' : ''}`).join('')}</div>
    <div class="ap-work">
      <div class="ap-body">${a.step === 0 ? apKit() : a.step === 1 ? apAnswers() : apReview()}</div>
      <aside class="ap-side">${apSide()}</aside>
    </div>`;
  hydrateIcons(el);
  animateIn(el);
}
/* the right rail — what Scout is drawing on, and what this one is worth */
function apSide() {
  const o = S.apply.o;
  const srcs = memorySources(o.id);
  const m = metrics(o, o._score || 70);
  const oneIn = Math.max(2, Math.round(100 / Math.max(1, m.odds)));
  return `<div class="aps-card">
      <div class="aps-h">${ic('spark', 14)} What Scout is drawing on</div>
      ${srcs.length ? srcs.map((s) => `<div class="aps-src"><span class="aps-i">${ic(s.i, 14)}</span><span><b>${s.t}</b><i>${esc(s.d)}</i></span>${ic('check', 13)}</div>`).join('')
        : '<div class="aps-empty">Nothing connected yet. Add an account below and Scout writes from your real work instead of guessing.</div>'}
      ${AI_ENABLED ? `<button class="pill pill-dark aps-auto" onclick="autofillAll()" id="auto-btn">${ic('zap', 14)} Autofill everything</button>` : ''}
      <div class="aps-fine">Autofill uses only what is on this device — nothing is stored on a server.</div>
    </div>
    <div class="aps-card">
      <div class="aps-h">${ic('link', 14)} Connected accounts</div>
      ${S.accounts.github ? `<div class="aps-acct">
          <span class="aps-i">${ic('link', 14)}</span>
          <span><b>@${esc(S.accounts.github.handle)}</b><i>${S.accounts.github.publicRepos} public repos · ${S.accounts.github.followers} followers</i></span>
          <button class="aps-x" onclick="disconnectAcct('github')" aria-label="Disconnect">${ic('x', 13)}</button>
        </div>
        <div class="aps-repos">${S.accounts.github.repos.slice(0, 3).map((r) => `<span class="aps-repo">${esc(r.name)}${r.lang ? ` · ${esc(r.lang)}` : ''}</span>`).join('')}</div>`
        : `<div class="aps-conn">
            <input id="gh-in" placeholder="your-github-username" onkeydown="if(event.key==='Enter')connectGitHub(this.value)">
            <button class="pill pill-ghost pill-sm" onclick="connectGitHub(document.getElementById('gh-in').value)">Connect</button>
          </div>
          <div class="aps-fine">Public data only — Scout reads your repos to write about real projects. No login.</div>`}
    </div>
    <div class="aps-card">
      <div class="aps-h">${ic('trophy', 14)} What it's worth</div>
      <div class="aps-mets">
        <div class="aps-met"><b>1 in ${oneIn}</b><span>your odds</span></div>
        <div class="aps-met"><b>${m.effort}h</b><span>honest effort</span></div>
        <div class="aps-met"><b>${o.prize_cash ? '₹' + fmtIN(o.prize_cash) : o.prize || '—'}</b><span>on the table</span></div>
        <div class="aps-met"><b>${o.days_left > 0 ? o.days_left + 'd' : 'closed'}</b><span>left</span></div>
      </div>
      <a class="aps-link" href="${esc(o.source_url)}" target="_blank" rel="noopener">${ic('arrow-up-right', 13)} See the original listing</a>
    </div>`;
}
function apKit() {
  const k = S.apply.kit;
  return `<div class="ap-sec">
    <div class="ap-lead"><h3>Your kit</h3><p>Filled in from your profile. Scout reuses this on every application — you type it once, ever. Stored on this device.</p></div>
    <div class="ap-grid">${KIT_FIELDS.map(([f, lab, type, ph]) =>
      `<label class="ap-f ${f === 'bio' ? 'wide' : ''}"><span>${lab}</span>
        <input type="${type}" value="${esc(k[f] || '')}" placeholder="${esc(ph)}" oninput="setKit('${f}',this.value)">
      </label>`).join('')}</div>
    <div class="ap-foot"><span class="ap-note">${kitDone(k) ? ic('check', 13) + ' Ready' : 'Name, email and institution are needed by nearly every form.'}</span>
      <button class="pill pill-dark pill-lg" onclick="applyStep(1)">Continue ${ic('arrow-right', 14)}</button></div>
  </div>`;
}
function apAnswers() {
  const o = S.apply.o, a = S.apply.answers;
  return `<div class="ap-sec">
    <div class="ap-lead"><h3>Tailored answers</h3><p>The questions ${esc(o.org)} will actually ask for a ${o.type.toLowerCase()}. Scout drafts each one against the real listing and everything it knows about you — then you make it yours.</p></div>
    ${qsFor(o).map(([f, lab, max]) => `<div class="ap-q">
      <div class="ap-qh"><span class="ap-ql">${lab}</span>
        ${AI_ENABLED ? `${(a[f] || '').trim() ? `<button class="pill pill-ghost pill-sm" onclick="rewriteToggle('${f}')">${ic('pen', 12)} Rewrite</button>` : ''}<button class="pill pill-ghost pill-sm ap-draft" id="dr-${f}" onclick="draftAns('${f}')">${ic('spark', 12)} ${(a[f] || '').trim() ? 'Redraft' : 'Draft with Scout'}</button>` : `<button class="pill pill-ghost pill-sm soon" onclick="soon()">${ic('spark', 12)} Draft<span class="soon-tag">Soon</span></button>`}
      </div>
      <textarea id="an-${f}" maxlength="${max}" placeholder="Write it yourself, or let Scout draft a first pass…" oninput="setAns('${f}',this.value);this.nextElementSibling.textContent=this.value.length+' / ${max}'">${esc(a[f] || '')}</textarea>
      <div class="ap-count">${(a[f] || '').length} / ${max}</div>
      <form class="rw-bar" id="rw-${f}" hidden onsubmit="event.preventDefault();rewriteAns('${f}',this.querySelector('input').value)">
        <input placeholder="How should it change? — “shorter”, “lead with the hackathon win”…"><button type="submit" class="pill pill-dark pill-sm">Go</button>
      </form>
    </div>`).join('')}
    <div class="ap-foot"><span class="ap-note">Everything autosaves to your draft.</span>
      <button class="pill pill-dark pill-lg" onclick="applyStep(2)">Review ${ic('arrow-right', 14)}</button></div>
    <form class="ap-chat" onsubmit="event.preventDefault();applyChat(this.querySelector('input').value);this.querySelector('input').value=''">
      <span class="apc-ic">${ic('orb', 16)}</span>
      <input placeholder="Tell Scout what to change — “mention my NCC certificate”, “make the essay warmer”, “what am I missing?”" autocomplete="off">
      <button type="submit" class="cmp-send" aria-label="Send">${heartFlat(19)}</button>
    </form>
  </div>`;
}
/* the apply-page copilot: takes an instruction, rewrites the affected answers,
   says what changed — or what is still missing */
async function applyChat(instr) {
  instr = String(instr || '').trim(); if (!instr) return;
  if (!AI_ENABLED) return soon();
  const a = S.apply; if (!a) return;
  const qs = qsFor(a.o);
  toast('Scout is working on it…');
  const prompt = `You are editing a live application draft with the user. Their instruction: "${instr}"
Return ONLY a JSON object: {"changes": {<fieldKey>: "<full new text>"}, "note": "<one plain sentence to the user: what you changed, or what info is missing and how to add it>"}.
Only include fields you actually changed. Respect each field's character limit. If the instruction asks a question or the needed info is missing from the facts, return empty changes and answer in "note".
FIELDS: ${qs.map((q) => `${q[0]} ("${q[1]}", max ${q[2]}) — current: ${JSON.stringify(String(a.answers[q[0]] || '').slice(0, 500))}`).join('\n')}
APPLYING TO: ${a.o.title} — ${a.o.org} (${a.o.type})
FACTS ABOUT THE APPLICANT:\n${memoryBrief(a.o.id)}`;
  try {
    const r = await fetch(API_BASE + '/compose', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, mode: 'json', max_tokens: 1800 }), signal: AbortSignal.timeout(50000) });
    const d = await r.json();
    if (!d.ok || !d.data) throw new Error(d.error || 'busy');
    const ch = d.data.changes || {};
    let n = 0;
    for (const [f, , max] of qs) {
      if (!(f in ch)) continue;
      const v = String(ch[f] || '').trim().slice(0, max); if (!v) continue;
      a.answers[f] = v; n++;
      const ta = document.getElementById('an-' + f);
      if (ta) { ta.value = v; const c = ta.nextElementSibling; if (c) c.textContent = v.length + ' / ' + max; springPop(ta.closest('.ap-q'), { from: 0.97, k: 380, damp: 20 }); }
    }
    if (n) { saveApply(); const pct = document.getElementById('ap-pct'); if (pct) pct.textContent = applyPct(a.answers) + '%'; }
    toast(d.data.note ? String(d.data.note).slice(0, 140) : (n ? `Updated ${n} answer${n === 1 ? '' : 's'}` : 'Nothing needed changing'));
  } catch (e) {
    logAgent('j' + Date.now(), { kind: 'edit', oppId: a.o.id, label: 'Edit failed — ' + shortTitle(a.o), status: 'failed', detail: 'Your answers were not changed.' });
    toast('Scout could not do that: ' + String(e.message || e));
  }
}
/* per-field rewrite with a one-line instruction */
function rewriteToggle(f) {
  const bar = document.getElementById('rw-' + f); if (!bar) return;
  bar.hidden = !bar.hidden;
  if (!bar.hidden) bar.querySelector('input').focus();
}
async function rewriteAns(f, instr) {
  instr = String(instr || '').trim(); if (!instr) return;
  const a = S.apply; if (!a) return;
  const q = qsFor(a.o).find((x) => x[0] === f); if (!q) return;
  const cur = String(a.answers[f] || '');
  toast('Rewriting…');
  try {
    const r = await fetch(API_BASE + '/compose', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: `Rewrite this application answer per the instruction. Instruction: "${instr}"\nQuestion: "${q[1]}" (max ${q[2]} chars — write to ~85% of it)\nCurrent answer: ${JSON.stringify(cur)}\nFacts you may draw on:\n${memoryBrief(a.o.id)}\nReturn only the rewritten answer text.`, mode: 'text', max_tokens: Math.ceil(q[2] / 2.2) + 100 }), signal: AbortSignal.timeout(40000) });
    const d = await r.json();
    if (!d.ok || !d.text) throw new Error(d.error || 'busy');
    a.answers[f] = d.text.slice(0, q[2]); saveApply();
    const ta = document.getElementById('an-' + f);
    if (ta) { ta.value = a.answers[f]; const c = ta.nextElementSibling; if (c) c.textContent = ta.value.length + ' / ' + q[2]; springPop(ta.closest('.ap-q'), { from: 0.97, k: 380, damp: 20 }); }
    const bar = document.getElementById('rw-' + f); if (bar) bar.hidden = true;
    toast('Rewritten — it stays yours to edit');
  } catch (e) { toast('Could not rewrite: ' + String(e.message || e)); }
}
/* ————— autofill: one pass over every field, from everything Scout knows ————— */
function memoryBrief(exceptId) {
  const m = scoutMemory(exceptId);
  const L = [];
  const p = m.profile;
  L.push(`PROFILE: ${(ROLES.find((r) => r.v === p.role) || {}).t || 'student'}; fields: ${(p.domains || []).join(', ') || 'general'}; goal: ${(GOALS.find((g) => g.v === p.goal) || {}).t || 'grow'}; city: ${p.city || 'India'}; institution: ${p.institution || m.kit.institution || '—'}; year: ${p.gradYear || '—'}${p.cgpa ? '; CGPA ' + p.cgpa : ''}`);
  if (m.kit.bio) L.push(`BIO: ${m.kit.bio}`);
  const ma = S.master || {};
  const maBits = [];
  if (ma.pct10) maBits.push(`Class 10: ${ma.pct10}% (${ma.board10 || 'board'} ${ma.year10 || ''})`);
  if (ma.pct12) maBits.push(`Class 12: ${ma.pct12}% ${ma.stream12 || ''} (${ma.board12 || ''})`);
  if (ma.degree) maBits.push(`${ma.degree} ${ma.branch || ''} @ ${ma.college || ''} CGPA ${ma.cgpa || '—'}`);
  ['jee', 'cat', 'gate', 'sat', 'gre', 'gmat', 'ielts', 'toefl'].forEach((t) => { if (ma[t]) maBits.push(`${t.toUpperCase()}: ${ma[t]}`); });
  if (ma.workExYears) maBits.push(`${ma.workExYears} yrs work-ex`);
  if (maBits.length) L.push(`ACADEMIC RECORD: ${maBits.join('; ')}`);
  if (ma.activities) L.push(`ACTIVITIES: ${String(ma.activities).slice(0, 400)}`);
  if ((ma.links || []).length) L.push(`PORTFOLIO & LINKS (real, connected by them — cite these): ${ma.links.map((l) => `[${l.kind || l.platform}] ${l.title || l.url}: ${(l.summary || '').slice(0, 160)}${(l.highlights || []).length ? ' · ' + l.highlights.slice(0, 3).join('; ') : ''}`).join(' | ').slice(0, 1100)}`);
  if ((ma.certs || []).length) L.push(`VERIFIED CERTIFICATES ON FILE (cite these; each is uploaded proof): ${ma.certs.map((c) => `[${c.kind}] ${c.summary}`).join(' | ').slice(0, 900)}`);
  if (ma.personalStatement) L.push(`THEIR OWN PERSONAL STATEMENT (their voice): ${String(ma.personalStatement).slice(0, 500)}`);
  if (m.accounts.github) {
    const g = m.accounts.github;
    L.push(`GITHUB @${g.handle}${g.bio ? ' — ' + g.bio : ''}: ${g.repos.map((r) => `${r.name} (${r.lang || 'code'}${r.stars ? ', ' + r.stars + '★' : ''})${r.desc ? ': ' + r.desc : ''}`).join(' | ') || 'no public repos'}`);
  }
  if (m.chat.length) L.push(`THINGS THEY TOLD SCOUT: ${m.chat.slice(-10).join(' / ')}`);
  if (m.past.length) L.push(`THEIR OWN VOICE, from answers they already wrote: ${m.past.map((x) => x.a.slice(0, 220)).join(' /// ')}`);
  return L.join('\n');
}
async function autofillAll() {
  if (!AI_ENABLED) return soon();
  const a = S.apply, o = a.o, qs = qsFor(o);
  const btn = document.getElementById('auto-btn');
  if (btn) { btn.innerHTML = ic('zap', 14) + ' Writing all ' + qs.length + '…'; btn.disabled = true; }
  const prompt = `Fill in this application form. Return a JSON object with exactly these keys: ${qs.map((q) => `"${q[0]}"`).join(', ')}.
Each value is that field's real, submittable answer — not a summary of one.
Write to roughly 75-95% of each limit. A one-line answer to a 600-character question reads as low effort and gets rejected; use the space to be concrete (name the project, the number, the specific thing you did).
Fields, with the character limit you should nearly fill:
${qs.map((q) => `- ${q[0]}: "${q[1]}" — write ${Math.round(q[2] * 0.75)}-${q[2]} characters`).join('\n')}

APPLYING TO: ${o.title} — ${o.org} (${o.type}, ${o.location}, prize/stipend ${o.prize}). Listing says: ${(o.description || '').slice(0, 500)}

EVERYTHING KNOWN ABOUT THE APPLICANT:
${memoryBrief(o.id)}

Ground every claim in the facts above — especially real GitHub projects if present. Never invent an award, employer or credential that is not listed. If a field cannot be grounded, write something honest and general rather than fabricating. Respect every character limit. Return the JSON object only.`;
  try {
    const r = await fetch(API_BASE + '/compose', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, mode: 'json' }), signal: AbortSignal.timeout(45000) });
    const d = await r.json();
    if (!d.ok || !d.data) throw new Error(d.error || 'no data');
    const obj = d.data;
    let n = 0;
    for (const [f, , max] of qs) {
      const v = String(obj[f] || '').trim().slice(0, max);
      if (!v) continue;
      S.apply.answers[f] = v; n++;
      const ta = document.getElementById('an-' + f);
      if (ta) { ta.value = v; const c = ta.nextElementSibling; if (c) c.textContent = v.length + ' / ' + max; }
    }
    if (!n) throw new Error('empty');
    saveApply();
    // models treat limits as ceilings — anything that came back half-empty gets one focused retry
    const thin = qs.filter(([f, , max]) => max >= 280 && (S.apply.answers[f] || '').length < max * 0.5).slice(0, 3);
    if (thin.length) {
      if (btn) btn.innerHTML = ic('zap', 14) + ' Deepening ' + thin.length + '…';
      await Promise.all(thin.map(([f]) => draftAns(f, true)));
      saveApply();
    }
    renderApply();
    toast(`Autofilled ${n} answer${n === 1 ? '' : 's'} — read them, then make them yours`);
  } catch {
    toast('Autofill could not finish — try one field at a time');
    if (btn) { btn.innerHTML = ic('zap', 14) + ' Autofill everything'; btn.disabled = false; }
  }
}
async function draftAns(f, quiet) {
  if (!AI_ENABLED) return soon();
  const a = S.apply, o = a.o;
  const q = qsFor(o).find((x) => x[0] === f);
  const btn = quiet ? null : document.getElementById('dr-' + f);
  if (btn) { btn.innerHTML = ic('spark', 12) + ' Drafting…'; btn.disabled = true; }
  const prompt = `Write ONE application answer. Do not add commentary, headings or options — return only the answer text.
Question: "${q[1]}" — write ${Math.round(q[2] * 0.75)}-${q[2]} characters. Nearly fill the space: a thin answer to a long question reads as low effort. Be concrete — name the project, the number, the specific thing you did.
Applying to: ${o.title} — ${o.org} (${o.type}, ${o.location}, prize/stipend ${o.prize}). About it: ${(o.description || '').slice(0, 400)}
EVERYTHING KNOWN ABOUT THE APPLICANT:
${memoryBrief(o.id)}
Write in first person, specific and plain — no clichés, no "I am writing to express". Ground it in the facts above; never invent a credential. Under ${q[2]} characters.`;
  try {
    const r = await fetch(API_BASE + '/compose', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, mode: 'text', max_tokens: Math.ceil(q[2] / 2.5) + 90 }), signal: AbortSignal.timeout(30000) });
    const d = await r.json();
    const txt = (d.text || '').replace(/<[^>]+>/g, '').trim().slice(0, q[2]);
    if (!txt) throw new Error('empty');
    const ta = document.getElementById('an-' + f);
    if (ta) { ta.value = txt; ta.dispatchEvent(new Event('input')); }
    setAns(f, txt); saveApply();
    if (!quiet) toast('Drafted — edit it until it sounds like you');
  } catch { if (!quiet) toast('Scout could not draft that one — the copilot is busy. Try again.'); }
  if (btn) { btn.innerHTML = ic('spark', 12) + ' Redraft'; btn.disabled = false; }
}
/* how far Scout can actually take this one */
function applyLane(o) {
  const u = (o.source_url || '').toLowerCase();
  if (/connectfor|lu\.ma|luma/.test(u)) return { mode: 'demo', label: 'Scout Direct', note: 'Demo lane — this build is not wired to the organiser, so nothing is transmitted. It shows you the full submit flow end to end.' };
  return { mode: 'handoff', label: 'Open the real form', note: `${o.display_url || 'The organiser'} takes applications on their own portal — Scout cannot post to it for you. It opens the form and puts every answer one tap from your clipboard.` };
}
function apReview() {
  const a = S.apply, o = a.o, k = a.kit, lane = applyLane(o);
  const qs = qsFor(o);
  const missing = qs.filter((q) => !(a.answers[q[0]] || '').trim()).length;
  return `<div class="ap-sec">
    <div class="ap-lead"><h3>Review & send</h3><p>Your complete application. ${lane.note}</p></div>
    <div class="ap-pack">
      <div class="pack-h">${ic('file', 14)} The pack<button class="pill pill-ghost pill-sm" onclick="copyPack()">${ic('copy', 12)} Copy all</button></div>
      ${KIT_FIELDS.filter(([f]) => (k[f] || '').trim()).map(([f, lab]) =>
        `<div class="pack-row"><span class="pk">${lab}</span><span class="pv">${esc(k[f])}</span><button class="pack-c" onclick="copyField('${esc(k[f]).replace(/'/g, '&#39;')}')" aria-label="Copy">${ic('copy', 12)}</button></div>`).join('')}
      ${qs.map(([f, lab]) => (a.answers[f] || '').trim() ? `<div class="pack-row long"><span class="pk">${lab}</span><span class="pv">${esc(a.answers[f])}</span><button class="pack-c" onclick="copyField(document.getElementById('an-${f}')?.value||'')" aria-label="Copy">${ic('copy', 12)}</button></div>` : '').join('')}
    </div>
    ${missing ? `<div class="ap-warn">${ic('help', 13)} ${missing} answer${missing > 1 ? 's are' : ' is'} still blank — most organisers reject an incomplete form outright.</div>` : ''}
    <div class="ap-send">
      <div class="send-lane">
        <div class="sl-h">${lane.mode === 'demo' ? ic('spark', 14) + ' Scout Direct <span class="demo-tag">Demo</span>' : ic('arrow-up-right', 14) + ' ' + esc(o.display_url || 'the organiser')}</div>
        <div class="sl-d">${lane.mode === 'demo' ? 'Submit inside Scout and get a receipt. Nothing leaves this device in this build.' : 'Opens the real listing in a new tab with your pack copied, then logs it here.'}</div>
        <button class="pill pill-red pill-lg" onclick="sendApply()">${lane.mode === 'demo' ? 'Submit through Scout' : 'Copy pack & open form'} ${ic('arrow-right', 14)}</button>
      </div>
      <button class="pill pill-ghost" onclick="markApplied('${o.id}');goV('scouted')">${ic('check', 13)} I already applied elsewhere</button>
    </div>
  </div>`;
}
function packText() {
  const a = S.apply, k = a.kit;
  const lines = [`${a.o.title} — ${a.o.org}`, ''];
  for (const [f, lab] of KIT_FIELDS) if ((k[f] || '').trim()) lines.push(`${lab}: ${k[f]}`);
  lines.push('');
  for (const [f, lab] of qsFor(a.o)) if ((a.answers[f] || '').trim()) lines.push(`${lab}\n${a.answers[f]}\n`);
  return lines.join('\n');
}
function copyPack() { navigator.clipboard?.writeText(packText()); toast('Whole pack copied — paste it field by field'); }
function copyField(v) { navigator.clipboard?.writeText(String(v)); toast('Copied'); }
function sendApply() {
  const a = S.apply, o = a.o, lane = applyLane(o);
  saveApply();
  pipeSet(o.id, { stage: 'applied', appliedAt: Date.now(), method: lane.mode, answers: a.answers, pct: 100 }, o);
  if (lane.mode === 'handoff') { copyPack(); window.open(o.source_url, '_blank'); }
  goV('scouted'); setSc('applied');
  sheet(`<div class="sh-h">${lane.mode === 'demo' ? 'Submitted through Scout' : 'Your pack is on the clipboard'}</div>
    <div class="sh-s">${esc(o.title)}</div>
    <div class="sh-body">${lane.mode === 'demo'
      ? 'This is the demo lane — Scout is not connected to this organiser yet, so nothing was actually transmitted. Your application is saved and tracked here.'
      : `The real form is open in a new tab. Paste each answer, submit there, and Scout keeps tracking it. It is logged as applied ${esc(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))}.`}</div>
    <div class="sh-opts"><button class="sh-opt prime" onclick="closeSheet()">Got it</button></div>`);
}

/* ═══════════ AGENT ═══════════ */
function ensureAgentDOM() {
  const el = document.getElementById('vw-agent');
  if (!el.dataset.built) {
    el.innerHTML = `<div class="agent-shell">
      <aside class="agent-side">
        <div class="as-scroll">
          <button class="pill pill-dark as-new" onclick="newThread()">${ic('plus', 14)} New chat</button>
          <div class="as-sec"><div class="as-h">Conversations</div><div id="as-threads"></div></div>
          <div class="as-sec"><div class="as-h">Your pipeline</div><div id="as-pipe"></div></div>
          <div class="as-sec"><div class="as-h">Do things</div>
            <button class="as-it" onclick="askScout('Find my best matches right now')">${ic('compass', 15)}<span>Find my matches<i>ranked from the live feed</i></span></button>
            <button class="as-it" onclick="askScout('What closes this week that I qualify for?')">${ic('clock', 15)}<span>What closes soon<i>racing the deadline</i></span></button>
            <button class="as-it" onclick="askScout('Am I eligible for my top match?')">${ic('check', 15)}<span>Check eligibility<i>rule-by-rule verdict</i></span></button>
            <button class="as-it" onclick="askScout('Build a plan for everything closing in 14 days')">${ic('calendar', 15)}<span>Plan my deadlines<i>worked back, day by day</i></span></button>
            <button class="as-it" onclick="askScout('Compare my saved opportunities')">${ic('grid', 15)}<span>Compare saved<i>odds · ROI · effort</i></span></button>
          </div>
          <div class="as-sec"><div class="as-h">Scout knows</div><div class="as-know" id="as-know"></div>
            <button class="as-it" onclick="askScout('Update my profile')">${ic('gear', 15)}<span>Tune my profile<i>re-ranks everything</i></span></button>
          </div>
        </div>
        <button class="as-me" onclick="goV('profile')">
          <span class="as-av" id="as-av">S</span>
          <span class="as-mt"><b id="as-nm">Scout</b><i id="as-rl">Member</i></span>
          ${ic('chev-right', 14)}
        </button>
      </aside>
      <div class="agent-main">
        <div class="agent-hd">
          <div class="agent-av">${heartSVG()}<span class="onl"></span></div>
          <div><div class="nm">Scout</div><div class="sb" id="ag-grounded">Grounded in the live feed</div></div>
          <div class="ctx" id="ag-ctx">General help</div>
        </div>
        <div class="msgs" id="msgs"></div>
        <div class="agent-in">
          <div class="attach-pop" id="attach-pop" hidden></div>
          <div class="cmd-pop" id="cmd-pop" hidden></div>
          <form class="composer" id="composer" onsubmit="event.preventDefault();sendChat()">
            <div class="cmp-ctx" id="cmp-ctx" hidden></div>
            <input id="chat-input" class="cmp-input" placeholder="Ask anything · @ to tag · / for commands" autocomplete="off" oninput="composerType(this)" onkeydown="composerNav(event,this)">
            <div class="cmp-files" id="cmp-files" hidden></div>
            <div class="cmp-row">
              <label class="cmp-tool" aria-label="Attach files" title="Attach files or a folder">${ic('plus', 19)}<input type="file" multiple hidden onchange="attachChatFiles(this)"></label>
              <button type="button" class="cmp-tool" onclick="insertTrigger('@')" aria-label="Tag an opportunity" title="Tag an opportunity (@)">${ic('tag', 18)}</button>
              <button type="button" class="cmp-tool" onclick="insertTrigger('/')" aria-label="Run a command" title="Run a command (/)">${ic('command', 17)}</button>
              <button type="button" class="cmp-tool" onclick="attachViewing(this)" aria-label="Tag what you were viewing" title="Tag what you were viewing">${ic('scan', 17)}</button>
              <button type="button" class="cmp-tool" onclick="toggleScope(this)" id="scope-tool" aria-label="What Scout considers" title="What Scout considers">${ic('sliders', 17)}</button>
              <span class="cmp-grow"></span>
              <button type="submit" class="cmp-send" id="cmp-send" aria-label="Send">${heartFlat(21)}</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
    el.dataset.built = '1';
  }
  renderAgentSide();
}

/* ————— agent sidebar: threads + profile snapshot ————— */
function threadsLS() { return ls('scout-threads') || []; }
function persistThread() {
  if (!S.threadId || S.chat.length < 2) return;
  const all = threadsLS().filter((t) => t.id !== S.threadId);
  const firstMe = S.chat.find((m) => m.r === 'me');
  const title = firstMe ? firstMe.c.replace(/<[^>]+>/g, '').slice(0, 46) : 'New chat';
  all.unshift({ id: S.threadId, title, ts: Date.now(), ctx: S.ctx, msgs: S.chat.slice(-24) });
  ls('scout-threads', all.slice(0, 10));
  queueSync();
  renderAgentSide();
}
function newThread() { initChat('general', null); renderAgentSide(); }
function loadThread(id) {
  const t = threadsLS().find((x) => x.id === id);
  if (!t) return;
  ensureAgentDOM();
  S.threadId = t.id; S.chat = t.msgs.slice(); S.ctx = t.ctx || null;
  const m = document.getElementById('msgs');
  m.innerHTML = S.chat.map((msg) => msg.r === 'me'
    ? `<div class="mg me"><div class="bub">${esc(msg.c)}</div></div>`
    : `<div class="mg ai"><div class="bub">${msg.c}</div></div>`).join('');
  renderAgentSide();
  m.lastElementChild && m.lastElementChild.scrollIntoView({ block: 'end' });
}
function fitAgent() {
  const sh = document.querySelector('.agent-shell');
  const inDash = false;   // the chat shell no longer relocates into the dashboard
  if (!sh || (S.view !== 'agent' && !inDash) || innerWidth <= 900) { if (sh) sh.style.height = ''; return; }
  const top = sh.getBoundingClientRect().top + scrollY;
  sh.style.height = Math.max(520, innerHeight - top - 34) + 'px';
}
addEventListener('resize', fitAgent);
/* hover a carousel and use the wheel — it glides sideways (GSAP-smoothed) */
const _railTween = new WeakMap();
document.addEventListener('wheel', (e) => {
  const rail = e.target.closest && e.target.closest('.rail, .mpop-carousel, .mpop-filters, .depts, .exam-rail');
  if (!rail || rail.scrollWidth <= rail.clientWidth + 4) return;
  if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;   // trackpads already scroll sideways
  e.preventDefault();
  const max = rail.scrollWidth - rail.clientWidth;
  const cur = _railTween.get(rail);
  const target = Math.max(0, Math.min(max, (cur ? cur.target : rail.scrollLeft) + e.deltaY * 1.6));
  if (window.gsap && !REDUCED) {
    if (cur && cur.tween) cur.tween.kill();
    const tween = gsap.to(rail, { scrollLeft: target, duration: 0.55, ease: 'power3.out', overwrite: 'auto', onComplete: () => _railTween.delete(rail) });
    _railTween.set(rail, { target, tween });
  } else rail.scrollLeft = target;
}, { passive: false });
function renderAgentSide() {
  fitAgent();
  const g = document.getElementById('ag-grounded');
  if (g) g.textContent = DATA.length ? `Grounded in ${fmtIN(DATA.length)} live listings` : 'Loading the live feed…';
  const pipe = document.getElementById('as-pipe');
  if (pipe) {
    const c = pipeCounts();
    const total = c.saved + c.draft + c.applied + c.result;
    pipe.innerHTML = total
      ? STAGES.map((s) => `<button class="as-it thin" onclick="goV('scouted');setSc('${s.v}')">${ic(s.icn, 15)}<span>${s.t}</span>${c[s.v] ? `<em class="as-b">${c[s.v]}</em>` : ''}</button>`).join('')
        + `<button class="as-it thin" onclick="askScout('What should I work on next from my pipeline?')">${ic('spark', 15)}<span>What's next?</span></button>`
      : '<div class="as-empty">Nothing saved yet — anything you bookmark shows up here for Scout to work on.</div>';
  }
  const av = document.getElementById('as-av');
  if (av) {
    const nm = (S.user && S.user.name) || 'there';
    const ini = (nm[0] || 'S').toUpperCase();
    av.textContent = ini; av.style.background = PASTELS[ini.charCodeAt(0) % PASTELS.length];
    document.getElementById('as-nm').textContent = nm.split(' ')[0];
    document.getElementById('as-rl').textContent = ((ROLES.find((r) => r.v === (S.profile && S.profile.role)) || {}).t || 'Member').split(' or ')[0];
  }
  renderAttached();
  const scopeBtn = document.getElementById('scope-tool'); if (scopeBtn) scopeBtn.classList.toggle('on', S.scope === 'pipe');
  const th = document.getElementById('as-threads');
  if (th) {
    const all = threadsLS();
    th.innerHTML = all.length
      ? all.map((t) => `<button class="as-th ${t.id === S.threadId ? 'on' : ''}" onclick="loadThread('${t.id}')">${esc(t.title)}<i>${new Date(t.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</i></button>`).join('')
      : '<div class="as-empty">Your chats live here — on this device only.</div>';
  }
  const know = document.getElementById('as-know');
  if (know) {
    const p = S.profile || {};
    const rows = [
      [((ROLES.find((r) => r.v === p.role) || {}).t || 'Explorer').split(' or ')[0], 'level'],
      [(p.domains || []).slice(0, 2).join(' · ') || 'all fields', 'into'],
      [((GOALS.find((g) => g.v === p.goal) || {}).t || 'exploring').split(' ').slice(0, 3).join(' '), 'goal'],
      [p.city || 'India', 'base'],
    ];
    know.innerHTML = rows.map(([v, k]) => `<div class="as-kv"><b>${esc(v)}</b><span>${k}</span></div>`).join('');
  }
}

function renderAgent(opts) {
  ensureAgentDOM();
  if (S.chat.length === 0) initChat('general', null);
  if (opts && opts.ask) { const inp = document.getElementById('chat-input'); inp.value = opts.ask; sendChat(); }
}
/* ═══════════ TAG AN OPPORTUNITY INTO THE CHAT ═══════════
   Attach anything you've saved / drafted / applied to — or search the live feed —
   straight into the composer, re-tag its stage on the spot, then ask Scout to
   check, apply, draft or discuss it. Every state change lands with real spring
   physics on the actual element that changed (nothing decorative). */
const STAGE_BURST = { saved: ['♥', ROSE], draft: ['✎', '#FFA02E'], applied: ['➤', '#101010'], result: ['★', '#1E9E62'] };
function resolveOpp(id) {
  id = String(id);
  return DATA.find((o) => String(o.id) === id) || ADM_MAP[id] || (S.pipe[id] && S.pipe[id].snap) || null;
}
function stageOf(id) { const p = pipeGet(id); return p ? p.stage : null; }

function attachOpp(id, srcEl) {
  id = String(id);
  if (!resolveOpp(id)) return;
  if (!S.attached.includes(id)) {
    S.attached.push(id);
    renderAttached(id);
    try { navigator.vibrate && navigator.vibrate(6); } catch {}
  }
  closeMenus();
  const inp = document.getElementById('chat-input'); if (inp) inp.focus();
}
function detachOpp(id) {
  S.attached = S.attached.filter((x) => x !== String(id));
  renderAttached();
}
function renderAttached(springId) {
  const box = document.getElementById('cmp-ctx'); if (!box) return;
  if (!S.attached.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  const chips = S.attached.map((id) => {
    const o = resolveOpp(id); if (!o) return '';
    const st = stageOf(id) || 'saved';
    const stg = STAGES.find((s) => s.v === st) || STAGES[0];
    return `<div class="ctx-chip" data-id="${id}">
      <span class="cc-thumb">${o.imgThumb || o.img ? `<img src="${esc(o.imgThumb || o.img)}" alt="" onerror="this.style.display='none'">` : ''}</span>
      <span class="cc-txt"><b>${esc(shortTitle(o))}</b><i>${esc(o.org || o.type)}</i></span>
      <button class="cc-stage" style="--sc:${stg.col}" onclick="cycleStage('${id}',this)" title="Tap to change stage">${ic(stg.icn, 12)}<em>${stg.t}</em></button>
      <button class="cc-x" onclick="detachOpp('${id}')" aria-label="Remove">${ic('x', 13)}</button>
    </div>`;
  }).join('');
  const acts = S.attached.length === 1
    ? `<div class="ctx-acts">
        <button onclick="tagAsk('check')">${ic('check', 13)} Check eligibility</button>
        <button onclick="tagAsk('draft')">${ic('spark', 13)} Draft application</button>
        <button onclick="tagAsk('discuss')">${ic('users', 13)} Is it worth it?</button>
        <button class="ca-apply" onclick="tagApply()">${ic('send', 13)} Apply</button>
      </div>` : '';
  box.innerHTML = `<div class="ctx-chips">${chips}</div>${acts}`;
  hydrateIcons(box);
  if (springId) { const el = box.querySelector(`.ctx-chip[data-id="${springId}"]`); if (el) springPop(el, { from: 0.6, k: 380, damp: 19 }); }
}
/* tap the stage pill on a chip → advance saved → draft → applied → result, with a pop + burst */
function cycleStage(id, btn) {
  const order = ['saved', 'draft', 'applied', 'result'];
  const cur = stageOf(id) || 'saved';
  const next = order[(order.indexOf(cur) + 1) % order.length];
  setStage(id, next, btn);
}
function setStage(id, stage, el) {
  const o = resolveOpp(id);
  pipeSet(id, { stage }, o);
  if (stage !== 'saved') { S.saved.add(String(id)); ls('scout-saved', [...S.saved]); }
  const [glyph, color] = STAGE_BURST[stage] || STAGE_BURST.saved;
  if (el) { springPop(el.closest('.ctx-chip') || el.closest('.pick-row') || el, { from: 0.86, k: 300, damp: 14 }); burst(el, glyph, color, 12); }
  renderAttached();
  renderAgentSide();
  if (document.getElementById('attach-pop') && !document.getElementById('attach-pop').hidden) renderMention(true);
  const stg = STAGES.find((s) => s.v === stage);
  toast(`Tagged as ${stg ? stg.t.toLowerCase() : stage}`);
}
/* preset questions that ride the tagged opportunity as grounding */
function tagAsk(kind) {
  const id = S.attached[0]; const o = id && resolveOpp(id); if (!o) return;
  const t = shortTitle(o);
  const q = kind === 'check' ? `Am I eligible for ${t}? Check me against each requirement.`
    : kind === 'draft' ? `Draft an application for ${t} using what you know about me.`
    : `Is ${t} worth my time — what are my real odds and the opportunity cost?`;
  const inp = document.getElementById('chat-input'); if (inp) { inp.value = q; sendChat(); }
}
function tagApply() { const id = S.attached[0]; if (id) startApply(id); }

/* ═══════════ @ mention carousel + / command palette — both NLP-filtered ═══════════
   Type @ in the composer and an NLP carousel of your stored (and live-feed)
   opportunities slides up, filtered by stage pills; click one to tag it.
   Type / and a command palette lets you run the chatbar's actions inline. */
let _mentionQ = '', _cmdQ = '', _mIdx = 0, _cIdx = 0;
S.mfilter = 'all';

/* which token is the caret sitting in? → drives whichever menu is live */
function composerType(inp) {
  cmpReady(inp);
  const val = inp.value, pos = inp.selectionStart == null ? val.length : inp.selectionStart;
  // @ mentions allow a multi-word NLP query; / commands stay single-token
  const mm = val.slice(0, pos).match(/(?:^|\s)@([^@/]{0,60})$/);
  const cm = val.slice(0, pos).match(/(?:^|\s)\/([^\s@/]{0,32})$/);
  const m = mm ? ['@' + mm[1], '@', mm[1]] : cm ? ['/' + cm[1], '/', cm[1]] : null;
  if (m && m[1] === '@') { _mentionQ = m[2]; _mIdx = 0; closeCommand(); openMention(); }
  else if (m && m[1] === '/') { _cmdQ = m[2]; _cIdx = 0; closeMention(); openCommand(); }
  else { closeMention(); closeCommand(); }
}
/* keyboard: navigate an open menu; Enter selects instead of sending */
function composerNav(e, inp) {
  const mp = document.getElementById('attach-pop'), cp = document.getElementById('cmd-pop');
  const mOpen = mp && !mp.hidden, cOpen = cp && !cp.hidden;
  if (!mOpen && !cOpen) return;
  if (e.key === 'Escape') { e.preventDefault(); closeMention(); closeCommand(); return; }
  if (mOpen) {
    const cards = mentionList();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); _mIdx = Math.min(cards.length - 1, _mIdx + 1); renderMention(true); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); _mIdx = Math.max(0, _mIdx - 1); renderMention(true); }
    else if (e.key === 'Enter' && cards[_mIdx]) { e.preventDefault(); selectMention(cards[_mIdx].id); }
  } else if (cOpen) {
    const cmds = cmdMatches();
    if (e.key === 'ArrowDown') { e.preventDefault(); _cIdx = Math.min(cmds.length - 1, _cIdx + 1); renderCommand(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); _cIdx = Math.max(0, _cIdx - 1); renderCommand(); }
    else if (e.key === 'Enter' && cmds[_cIdx]) { e.preventDefault(); selectCommand(_cIdx); }
  }
}
/* the + and ⌘ tools just drop the trigger char in for you */
function insertTrigger(ch) {
  const inp = document.getElementById('chat-input'); if (!inp) return;
  const val = inp.value, pos = inp.selectionStart == null ? val.length : inp.selectionStart;
  const pre = val.slice(0, pos), needSp = pre && !/\s$/.test(pre);
  inp.value = pre + (needSp ? ' ' : '') + ch + val.slice(pos);
  const np = pos + (needSp ? 2 : 1);
  inp.focus(); inp.setSelectionRange(np, np);
  composerType(inp);
}
function stripActiveToken() {
  const inp = document.getElementById('chat-input'); if (!inp) return;
  const val = inp.value, pos = inp.selectionStart == null ? val.length : inp.selectionStart;
  const upto = val.slice(0, pos), after = val.slice(pos);
  const m = upto.match(/@[^@/]*$/) || upto.match(/\/[^\s@/]*$/);
  if (!m) return;
  const start = m.index;
  inp.value = (val.slice(0, start) + after).replace(/\s{2,}/g, ' ');
  inp.setSelectionRange(start, start); inp.focus(); cmpReady(inp);
}
function closeMenus() { closeMention(); closeCommand(); }

/* ————— @ mention: NLP carousel of stored + feed opportunities ————— */
function mentionList() {
  const q = _mentionQ.trim();
  let pool = (S.mfilter === 'all'
    ? Object.values(S.pipe).filter((p) => p.snap).map((p) => ({ id: String(p.id), o: pipeOpp(p), stage: p.stage }))
    : pipeIn(S.mfilter).map((p) => ({ id: String(p.id), o: pipeOpp(p), stage: p.stage }))).filter((x) => x.o);
  if (q) {
    const byId = {}; pool.forEach((x) => (byId[x.id] = x));
    pool = nlpSearch(q, pool.map((x) => x.o), parseQuery(q)).map((o) => byId[String(o.id)]).filter(Boolean);
  } else {
    pool.sort((a, b) => (a.o.deadline_ts || 9e9) - (b.o.deadline_ts || 9e9));
  }
  pool = pool.slice(0, 24);
  if (q && S.mfilter === 'all') {
    const have = new Set(pool.map((x) => x.id));
    nlpSearch(q, DATA, parseQuery(q)).filter((o) => !have.has(String(o.id))).slice(0, 12)
      .forEach((o) => pool.push({ id: String(o.id), o, stage: null, feed: true }));
  }
  return pool;
}
function openMention() {
  const pop = document.getElementById('attach-pop'); if (!pop) return;
  const wasHidden = pop.hidden; pop.hidden = false;
  renderMention();
  if (wasHidden) springPop(pop, { from: 0.92, k: 460, damp: 24, base: '' });
  clearTimeout(_menuOutT); _menuOutT = setTimeout(() => document.addEventListener('click', outsideMenus), 0);
}
function setMFilter(f) { S.mfilter = f; _mIdx = 0; renderMention(); const inp = document.getElementById('chat-input'); if (inp) inp.focus(); }
function renderMention(keepScroll) {
  const pop = document.getElementById('attach-pop'); if (!pop || pop.hidden) return;
  const list = mentionList();
  const c = pipeCounts(); const counts = { all: c.saved + c.draft + c.applied + c.result, saved: c.saved, draft: c.draft, applied: c.applied, result: c.result };
  const pills = [['all', 'All', 'layers'], ...STAGES.map((s) => [s.v, s.t, s.icn])];
  _mIdx = Math.max(0, Math.min(_mIdx, list.length - 1));
  const cards = list.length
    ? list.map((x, i) => {
      const o = x.o, st = x.feed ? null : (x.stage || stageOf(x.id));
      const stg = st ? STAGES.find((s) => s.v === st) : null;
      return `<button type="button" class="mcard ${i === _mIdx ? 'active' : ''}" data-id="${x.id}" onmouseenter="_mIdx=${i};markMActive()" onclick="selectMention('${x.id}')">
        <span class="mc-thumb">${o.imgThumb || o.img ? `<img src="${esc(o.imgThumb || o.img)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}${x.feed ? '<em class="mc-live">Live feed</em>' : ''}</span>
        <span class="mc-t">${esc(shortTitle(o))}</span>
        <span class="mc-m">${esc(o.org || o.type)}${o.days_left > 0 ? ' · ' + o.days_left + 'd' : ''}</span>
        ${stg ? `<span class="mc-stage" style="--sc:${stg.col}">${ic(stg.icn, 11)}${stg.t}</span>` : `<span class="mc-stage feed">${ic('plus', 11)}Tag it</span>`}
      </button>`;
    }).join('')
    : `<div class="mc-empty">${_mentionQ.trim() ? 'Nothing matches “' + esc(_mentionQ) + '”.' : (S.mfilter === 'all' ? 'Save or search opportunities to mention them here.' : 'Nothing ' + S.mfilter + ' yet.')}</div>`;
  pop.innerHTML = `<div class="mpop-head">
      <div class="mpop-lead">${ic('tag', 12)} Mention an opportunity${_mentionQ.trim() ? ` · <b>${esc(_mentionQ)}</b>` : ''}</div>
      <button class="mpop-x" onclick="closeMention()" aria-label="Close">${ic('x', 13)}</button>
    </div>
    <div class="mpop-filters">${pills.map(([v, t, icn]) => `<button class="mf ${S.mfilter === v ? 'on' : ''}" onclick="setMFilter('${v}')">${ic(icn, 12)}${t}${counts[v] ? `<em>${counts[v]}</em>` : ''}</button>`).join('')}</div>
    <div class="mpop-carousel" id="mpop-carousel">${cards}</div>`;
  hydrateIcons(pop);
  const active = pop.querySelector('.mcard.active'); if (active && !keepScroll) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (active && keepScroll) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function markMActive() {
  const pop = document.getElementById('attach-pop'); if (!pop) return;
  pop.querySelectorAll('.mcard').forEach((el, i) => el.classList.toggle('active', i === _mIdx));
}
function selectMention(id) {
  stripActiveToken();
  attachOpp(id);
  closeMention();
}
function closeMention() {
  const pop = document.getElementById('attach-pop'); if (pop && !pop.hidden) pop.hidden = true;
  maybeDropOutside();
}

/* ————— / commands: run the chatbar's actions inline ————— */
const CHAT_CMDS = [
  { icn: 'compass', t: 'Find my matches', d: 'ranked from the live feed', run: () => fireCmd('Find my strongest matches right now.') },
  { icn: 'clock', t: 'What closes soon', d: 'racing the deadline', run: () => fireCmd('What closes this week that I actually qualify for?') },
  { icn: 'spark', t: 'Draft an application', d: 'for a tagged opportunity', run: () => S.attached[0] ? tagAsk('draft') : fireCmd('Help me draft a strong application — what do you need from me?') },
  { icn: 'check', t: 'Check my eligibility', d: 'rule by rule', run: () => S.attached[0] ? tagAsk('check') : (toast('Tag an opportunity first — type @'), insertTrigger('@')) },
  { icn: 'calendar', t: 'Plan my deadlines', d: 'worked back, day by day', run: () => fireCmd('Build me a plan for everything closing in the next 14 days.') },
  { icn: 'grid', t: 'Compare my saved', d: 'odds · ROI · effort', run: () => fireCmd('Compare my saved opportunities on odds, ROI and effort.') },
  { icn: 'send', t: 'Apply now', d: 'open the guided composer', run: () => S.attached[0] ? tagApply() : (toast('Tag an opportunity first — type @'), insertTrigger('@')) },
  { icn: 'user', t: 'Tune my profile', d: 're-ranks everything', run: () => askScout('I want to update my profile.') },
];
function cmdMatches() {
  const q = _cmdQ.trim().toLowerCase();
  if (!q) return CHAT_CMDS;
  return CHAT_CMDS.filter((c) => (c.t + ' ' + c.d).toLowerCase().includes(q) || c.t.toLowerCase().split(' ').some((w) => w.startsWith(q)));
}
function openCommand() {
  const pop = document.getElementById('cmd-pop'); if (!pop) return;
  const wasHidden = pop.hidden; pop.hidden = false;
  renderCommand();
  if (wasHidden) springPop(pop, { from: 0.94, k: 460, damp: 24, base: '' });
  clearTimeout(_menuOutT); _menuOutT = setTimeout(() => document.addEventListener('click', outsideMenus), 0);
}
function renderCommand() {
  const pop = document.getElementById('cmd-pop'); if (!pop || pop.hidden) return;
  const cmds = cmdMatches();
  _cIdx = Math.max(0, Math.min(_cIdx, cmds.length - 1));
  pop.innerHTML = `<div class="mpop-lead">${ic('sliders', 12)} Run a command${_cmdQ.trim() ? ` · <b>${esc(_cmdQ)}</b>` : ''}</div>
    <div class="cmd-list">${cmds.length ? cmds.map((c, i) => `<button type="button" class="cmd-row ${i === _cIdx ? 'active' : ''}" onmouseenter="_cIdx=${i};markCActive()" onclick="selectCommand(${i})">
        <span class="cmd-ic">${ic(c.icn, 16)}</span><span class="cmd-tx"><b>${c.t}</b><i>${c.d}</i></span>
      </button>`).join('') : `<div class="mc-empty">No command matches “${esc(_cmdQ)}”.</div>`}</div>`;
  hydrateIcons(pop);
}
function markCActive() { const pop = document.getElementById('cmd-pop'); if (pop) pop.querySelectorAll('.cmd-row').forEach((el, i) => el.classList.toggle('active', i === _cIdx)); }
function selectCommand(idx) { const c = cmdMatches()[idx]; if (!c) return; stripActiveToken(); closeCommand(); c.run(); }
function closeCommand() { const pop = document.getElementById('cmd-pop'); if (pop && !pop.hidden) pop.hidden = true; maybeDropOutside(); }
function fireCmd(text) { const inp = document.getElementById('chat-input'); if (!inp) return; inp.value = text; cmpReady(inp); sendChat(); }

/* shared outside-click handling for both menus */
let _menuOutT = 0;
function outsideMenus(e) {
  if (e.target.closest('.composer') || e.target.closest('#attach-pop') || e.target.closest('#cmd-pop')) return;
  closeMention(); closeCommand();
}
function maybeDropOutside() {
  const mp = document.getElementById('attach-pop'), cp = document.getElementById('cmd-pop');
  if ((!mp || mp.hidden) && (!cp || cp.hidden)) document.removeEventListener('click', outsideMenus);
}
/* the scan tool → tag the listing you were last looking at */
function attachViewing(btn) {
  if (S.lastViewed && resolveOpp(S.lastViewed)) { attachOpp(S.lastViewed, btn); toast('Tagged the listing you were viewing'); }
  else { insertTrigger('@'); toast('Type to find an opportunity, or open a listing first'); }
}
/* the sliders tool → what Scout grounds its answers on */
function toggleScope(btn) {
  S.scope = S.scope === 'pipe' ? 'feed' : 'pipe';
  ls('scout-scope', S.scope);
  if (btn) { btn.classList.toggle('on', S.scope === 'pipe'); springPop(btn, { from: 0.8, k: 320, damp: 15 }); }
  toast(S.scope === 'pipe' ? 'Scout will focus on your pipeline' : 'Scout is considering the whole live feed');
}
function cmpReady(inp) { const b = document.getElementById('cmp-send'); if (b) b.classList.toggle('ready', !!inp.value.trim()); }

function initChat(intent, oppId) {
  S.ctx = { intent, oppId };
  S.chat = [];
  S.threadId = 't' + Date.now();
  ensureAgentDOM();
  const m = document.getElementById('msgs'); if (m) m.innerHTML = '';
  if (intent === 'apply') {
    const o = DATA.find((x) => String(x.id) === String(oppId));
    document.getElementById('ag-ctx').textContent = o ? shortTitle(o) : 'Applying';
    aiMsg(`Good pick. I'm ready to help you apply to <b>${esc(o ? o.title : 'this one')}</b>${o && o.days_left <= 10 ? ` — heads up, only <b>${o.days_left} days left</b>` : ''}. Want me to <b>draft your SoP</b>, <b>check eligibility</b>, or <b>build a checklist</b>?`, ['Draft my SoP', 'Check eligibility', 'Build a checklist']);
  } else {
    const ctx = document.getElementById('ag-ctx'); if (ctx) ctx.textContent = 'General help';
    aiMsg('Hi — I\'m Scout. I can find matches in the live feed, draft applications, or explain eligibility. What would you like to do?', ['Find me matches', 'Draft an application', 'What closes this week?']);
  }
}
function askScout(q) {
  if (!AI_ENABLED) return soon();
  const recent = (ls('scout-recent') || []).filter((x) => x !== q);
  recent.unshift(q);
  ls('scout-recent', recent.slice(0, 6));
  goV('agent', { ask: q });
}
function panelAsk(e) { e.preventDefault(); if (!AI_ENABLED) return soon(); const v = (document.getElementById('ai-panel-input') || {}).value; if (v && v.trim()) askScout(v.trim()); }
// the floating dock is now a REAL global search (NLP), not the AI copilot
function dockAsk(e) { e.preventDefault(); const inp = document.getElementById('ai-dock-input'); const v = inp.value.trim(); if (v) { inp.value = ''; runSearch(v); } }
function aiMsg(html, quick) {
  S.chat.push({ r: 'ai', c: html });
  const m = document.getElementById('msgs'); if (!m) return;
  const div = document.createElement('div'); div.className = 'mg ai';
  div.innerHTML = `<div class="bub">${html}</div><div class="mtime">${tstamp()}</div>` + (quick ? `<div class="qr">${quick.map((q) => `<button onclick="qReply('${q.replace(/'/g, "\\'")}')">${q}</button>`).join('')}</div>` : '');
  m.appendChild(div);
  persistThread();
  if (window.gsap && !REDUCED) gsap.fromTo(div, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .35, ease: 'power2.out' });
  div.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'end' });
}
function meMsg(t) {
  S.chat.push({ r: 'me', c: t });
  const m = document.getElementById('msgs'); if (!m) return;
  const div = document.createElement('div'); div.className = 'mg me';
  div.innerHTML = `<div class="bub">${esc(t)}</div><div class="mtime">${tstamp()}</div>`;
  m.appendChild(div);
  persistThread();
  div.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'end' });
}
function tstamp() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function typing(on) {
  const m = document.getElementById('msgs'); if (!m) return;
  const ex = m.querySelector('.typing');
  if (on && !ex) { const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; m.appendChild(t); t.scrollIntoView({ block: 'end' }); }
  else if (!on && ex) ex.remove();
}
function qReply(q) { const inp = document.getElementById('chat-input'); inp.value = q; sendChat(); }
async function sendChat() {
  const inp = document.getElementById('chat-input'); const t = inp.value.trim(); if (!t || S.busy) return;
  inp.value = ''; cmpReady(inp); meMsg(t); S.busy = true; typing(true);
  // fold any tagged opportunities + scope into the grounding sent to Scout
  const primary = S.attached[0] || (S.ctx && S.ctx.oppId) || null;
  const ctx = { ...(S.ctx || {}), oppId: primary, attached: S.attached.slice(), scope: S.scope };
  let msg = t;
  if (S.chatFiles.length) {
    const att = S.chatFiles.map((f) => `--- ${f.name} (${f.note}) ---\n${f.text || '(binary attachment, name/type only)'}`).join('\n');
    msg = `[The user attached ${S.chatFiles.length} file${S.chatFiles.length === 1 ? '' : 's'}:]\n${att.slice(0, 9000)}\n\n${msg}`;
    S.chatFiles = []; renderChatFiles();
  }
  if (S.attached.length) {
    const names = S.attached.map((id) => { const o = resolveOpp(id); return o ? `"${o.title}" [${o.org || o.type}, ${o.days_left > 0 ? o.days_left + 'd left' : 'closed'}, tagged: ${stageOf(id) || 'saved'}]` : null; }).filter(Boolean).join('; ');
    if (names) msg = `[The user has tagged these opportunities to work on right now: ${names}. Ground your answer in them.]\n\n${t}`;
  } else if (S.scope === 'pipe') {
    msg = `[Focus only on the user's own saved/applied pipeline, not the whole feed.]\n\n${t}`;
  }
  let reply = '';
  try {
    const r = await fetch(API_BASE + '/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ msg, ctx, history: S.chat.slice(-6), profile: S.profile, ui: true }), signal: AbortSignal.timeout(20000) });
    if (r.ok) {
      const j = await r.json();
      typing(false); S.busy = false;
      if (j.blocks && j.blocks.length) { aiBlocks(j.blocks); return; }
      reply = j.text || fallbackAgent(t);
    } else reply = fallbackAgent(t);
  } catch { reply = fallbackAgent(t); }
  typing(false); S.busy = false;
  aiMsg(reply);
}
function fallbackAgent(t) {
  const tl = t.toLowerCase();
  if (tl.includes('draft') || tl.includes('sop')) return 'Here\'s a strong SoP skeleton:<br><br><b>01 · Hook</b> — a specific moment that sparked your interest.<br><b>02 · Evidence</b> — one project that proves your fit.<br><b>03 · Why this</b> — why THIS opportunity, named.<br><b>04 · Trajectory</b> — where it takes you next.<br><br>Tell me which paragraph to expand.';
  if (tl.includes('eligib')) {
    const o = S.ctx && S.ctx.oppId ? DATA.find((x) => String(x.id) === String(S.ctx.oppId)) : null;
    return o ? `<b>${esc(o.title)}</b> eligibility:<br><br>${esc(o.eligibility)}<br><br>Tell me your year and field and I'll check you against each point.` : 'Tell me which opportunity to check.';
  }
  if (tl.includes('week') || tl.includes('closing') || tl.includes('deadline')) {
    const week = computeMatches().filter((o) => o.days_left > 0 && o.days_left <= 7).slice(0, 4);
    return week.length ? `Closing in 7 days:<br><br>${week.map((o, i) => `${i + 1}. <b>${esc(o.title)}</b> — ${o.days_left}d · ${o._score}% fit`).join('<br>')}` : 'Nothing closing this week in your matches — good window to draft ahead.';
  }
  if (tl.includes('find') || tl.includes('match')) {
    const top = computeMatches().slice(0, 3);
    return `Your top matches right now:<br><br>${top.map((o, i) => `${i + 1}. <b>${esc(o.title)}</b> — ${o._score}% · ${o.days_left} days left`).join('<br>')}<br><br>Want details on any of these?`;
  }
  return 'I can draft your SoP, check eligibility, find matches in the live feed, or build a deadline checklist. Which would help most?';
}

/* ————— parallel applications: draft many at once, edit each later ————— */
async function draftMany(ids) {
  if (!AI_ENABLED) return soon();
  ids = (ids || []).map(String).filter((id) => resolveOpp(id));
  if (!ids.length) return toast('Nothing to draft');
  toast(`Drafting ${ids.length} application${ids.length === 1 ? '' : 's'} in the background — keep browsing`);
  let done = 0;
  for (const id of ids) {
    const o = resolveOpp(id);
    const qs = qsFor(o);
    const cur = pipeGet(id);
    const answers = seedFromEssayBank(o, (cur && cur.answers) || {});
    const missing = qs.filter(([f]) => !(answers[f] || '').trim());
    const jobId = 'j' + Date.now() + '-' + id;
    logAgent(jobId, { kind: 'draft', oppId: id, label: 'Drafting — ' + shortTitle(o), status: 'running' });
    if (!missing.length) { done++; logAgent(jobId, { status: 'done', detail: 'already complete' }); continue; }
    const prompt = `Fill in this application form. Return a JSON object with exactly these keys: ${missing.map((q) => `"${q[0]}"`).join(', ')}.
Each value is that field's real, submittable answer. Write to roughly 75-95% of each limit.
Fields: ${missing.map((q) => `- ${q[0]}: "${q[1]}" — up to ${q[2]} chars`).join('\n')}
APPLYING TO: ${o.title} — ${o.org} (${o.type}). ${String(o.description || '').slice(0, 300)}
APPLICANT:\n${memoryBrief(id)}
Ground every claim in the facts. Never invent credentials. JSON only.`;
    try {
      const r = await fetch(API_BASE + '/compose', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ prompt, mode: 'json' }), signal: AbortSignal.timeout(50000) });
      const d = await r.json();
      if (d.ok && d.data) {
        for (const [f, , max] of missing) { const v = String(d.data[f] || '').trim().slice(0, max); if (v) answers[f] = v; }
        S.saved.add(id); ls('scout-saved', [...S.saved]);
        pipeSet(id, { stage: 'draft', answers, pct: 60, draftAt: Date.now() }, o);
        done++;
        logAgent(jobId, { status: 'done', detail: missing.length + ' answers written' });
        toast(`${done}/${ids.length} drafted — ${shortTitle(o)}`);
      } else {
        logAgent(jobId, { status: 'failed', label: 'Drafting stopped — ' + shortTitle(o), detail: 'The writing model did not answer. Your draft was not changed.' });
      }
    } catch (e) { logAgent(jobId, { status: 'failed', label: 'Drafting stopped — ' + shortTitle(o), detail: 'Lost the connection mid-draft. Your draft was not changed.' }); }
  }
  renderAgentSide();
  if (S.view === 'scouted') renderScouted();
  toast(`${done} of ${ids.length} applications drafted — review them in Scouted → Drafts`);
}
function draftTopMatches(n) {
  const picks = computeMatches().filter((o) => o.days_left > 0 && !(pipeGet(o.id) || {}).answers).slice(0, n || 3).map((o) => o.id);
  draftMany(picks);
}

/* ═══════════ ADMISSIONS — every gate worth walking through ═══════════
   Research-verified cycles (each labelled VERIFIED-OPEN / UPCOMING / ESTIMATED),
   matched to the stage of your career and everything in your master profile. */
let ADM = [], ADM_MAP = {};
/* imagery: a deterministic course-flavoured banner per cycle + the body's own logo.
   Banners are curated Unsplash scenes per field/stage; logos come keylessly from
   each portal's real domain via the favicon service. */
const ADM_IMGS = {
  Engineering: ['photo-1581092795360-fd1ca04f0952', 'photo-1517420704952-d9f39e95b43e', 'photo-1562774053-701939374585'],
  Medicine: ['photo-1576091160399-112ba8d25d1d', 'photo-1579154204601-01588f351e67'],
  Law: ['photo-1589829545856-d10d557cf95f', 'photo-1505664194779-8beaceb93744'],
  Business: ['photo-1454165804606-c3d57bc86b40', 'photo-1507679799987-c73779587ccf', 'photo-1556761175-b413da4baf72'],
  Management: ['photo-1552664730-d307ca884978', 'photo-1521737711867-e3b97375f902'],
  Design: ['photo-1561070791-2526d30994b5', 'photo-1586717791821-3f44a563fa4c'],
  Science: ['photo-1532094349884-543bc11b234d', 'photo-1628595351029-c2bf17511435'],
  'Data Science': ['photo-1551288049-bebda4e38f71', 'photo-1509228627152-72ae9ae6848d'],
  All: ['photo-1523050854058-8df90110c9f1', 'photo-1541339907198-e08756dedf3f', 'photo-1562774053-701939374585', 'photo-1607013251379-e6eecfffe234'],
  school: ['photo-1580582932707-520aed937b7b', 'photo-1509062522246-3755977927d7'],
  abroad: ['photo-1607237138185-eedd9c632b0b', 'photo-1498243691581-b145c3f54a5a', 'photo-1519452635265-7b1fbfd1e4e0'],
  online: ['photo-1587560699334-cc4ff634909a', 'photo-1610484826967-09c5720778c7'],
};
function admImg(c) {
  const key = c.region !== 'india' && c.region !== 'online' ? 'abroad'
    : c.region === 'online' || c.stage === 'online-degree' ? 'online'
    : c.stage === 'school' ? 'school'
    : (c.fields || []).find((f) => ADM_IMGS[f]) || 'All';
  const pool = ADM_IMGS[key] || ADM_IMGS.All;
  const pick = pool[hashCode(c.id || c.name) % pool.length];
  return `https://images.unsplash.com/${pick}?w=800&q=70&auto=format&fit=crop`;
}
function admLogo(c) {
  try { const host = new URL(c.url).hostname; return `https://www.google.com/s2/favicons?domain=${host}&sz=128`; }
  catch { return ''; }
}
const ADM_STAGES = [['all', 'All'], ['ug', 'Undergrad'], ['pg', 'Postgrad'], ['mba', 'MBA'], ['exec', 'Executive'], ['online-degree', 'Online degrees'], ['upskill', 'Upskilling'], ['school', 'School']];
const ADM_REGIONS = [['all', 'Everywhere'], ['india', 'India'], ['us', 'US'], ['uk', 'UK'], ['europe', 'Europe'], ['global', 'Global'], ['online', 'Online']];
const ADM_DEFAULT_STAGE = { school: 'ug', ug: 'pg', pg: 'mba', phd: 'all', work: 'exec' };
/* A researched date can read "expected 2026-10-31" or "2026-08-01 (confirmed…)" —
   pull the ISO date out of whatever prose surrounds it. */
function admDate(v) {
  const m = String(v || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? Date.parse(m[0] + 'T23:59:59Z') : null;
}
async function loadAdmissions() {
  if (ADM.length) return true;
  try {
    // Static, versioned with the app — no function invocation, works offline via the SW.
    const r = await fetch('/data/admissions.json', { signal: AbortSignal.timeout(15000) });
    const d = await r.json();
    if (d.ok) {
      // The file's open_now/days_* were computed the day it was written. Recompute
      // against today so a cycle never claims to be open a month after it closed.
      const now = Date.now(), DAY = 864e5;
      ADM = (d.cycles || []).map((c) => {
        const o = admDate(c.window_open), x = admDate(c.window_close);
        return {
          ...c,
          // both dates known → the window decides. Otherwise only the research
          // note may call it open; silence is never treated as "apply today".
          open_now: (o && x) ? (now >= o && now <= x) : /VERIFIED-OPEN/i.test(c.status_note || ''),
          days_to_close: x ? Math.ceil((x - now) / DAY) : null,
          days_to_open: o && now < o ? Math.ceil((o - now) / DAY) : null,
        };
      }).filter((c) => c.days_to_close === null || c.days_to_close > -14);
      ADM_MAP = {}; ADM.forEach((c) => { ADM_MAP[c.id] = admToOpp(c); });
      return true;
    }
  } catch { /* offline */ }
  return false;
}
/* an admission cycle in opportunity shape — so saving, tagging and applying all just work */
function admToOpp(c) {
  const closeTs = Date.parse(c.window_close || '') / 1000 || null;
  return {
    id: c.id, title: c.name, org: c.org, type: 'Admission',
    img: '', imgThumb: '', realImg: false,
    description: `${c.eligibility || ''} ${c.exam && c.exam !== 'none' ? '· Entrance: ' + c.exam : ''} · ${c.status_note || ''}`.trim(),
    deadline: c.window_close || '—', deadline_ts: closeTs,
    days_left: c.days_to_close != null ? c.days_to_close : 999,
    prize: c.fee || '', prize_cash: 0, team: '1', applied: 0, views: 0,
    skills: c.fields || [], dom: c.fields || [], roles: [], geo: c.region === 'india' ? 'india' : 'global',
    location: c.region === 'online' ? 'Online' : (c.region || '').toUpperCase(),
    source_url: c.url, display_url: (c.url || '').replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
    eligibility: c.eligibility || 'See the official site', score: 0.6, _adm: c,
  };
}
/* how hard is this door to open — a prominence/selectivity heuristic */
const SELECTIVITY_RE = [
  [/IIT|JEE Advanced|AIIMS|NEET|ISB|IIM (A|B|C)|IIMA|IIMB|IIMC|NLU|CLAT|Oxbridge|Ivy|MIT|Stanford|Common App/i, 92],
  [/NIT|BITS|JEE Main|XLRI|XAT|CAT\b|GATE|NID|NIFT|UCEED|IISc|IISER|Georgia Tech|UCAS|NUS|NTU/i, 82],
  [/CUET|VIT|SRM|Manipal|Symbiosis|Christ|MHT|KCET|WBJEE|state|GMAT|GRE/i, 62],
  [/IGNOU|NIOS|NPTEL|certificate|Coursera|edX|open|rolling|MAT\b/i, 30],
];
function admSelectivity(c) {
  const hay = c.name + ' ' + c.org + ' ' + (c.exam || '');
  // open-access formats first — "NPTEL (IITs)" must not read as IIT-selective
  if (/IGNOU|NIOS|NPTEL|certificat|Coursera|edX|rolling|always[- ]open/i.test(hay) || c.stage === 'upskill') return 30;
  let s = 50;
  for (const [re, v] of SELECTIVITY_RE) if (re.test(hay)) { s = v; break; }
  if (c.stage === 'online-degree') s = Math.min(s, 55);   // qualifier-based open admission
  return s;
}
/* what the user's record supports — grades, scores, proof of work */
function userStrength() {
  const m = S.master || {}, p = S.profile || {};
  let s = 0, signals = 0;
  const pct = parseFloat(m.pct12) || (parseFloat(m.cgpa) ? parseFloat(m.cgpa) * 9.5 : 0) || parseFloat(m.pct10) || 0;
  if (pct) { s += Math.min(pct, 99); signals++; }
  const scores = ['jee', 'cat', 'gate', 'sat', 'gre', 'gmat'].filter((t) => m[t]).length;
  if (scores) { s += 55 + scores * 12; signals++; }
  const proof = (m.certs || []).length + Object.values(S.pipe || {}).filter((x) => x.stage === 'result').length * 2;
  if (proof) { s += Math.min(45 + proof * 8, 90); signals++; }
  if (String(m.activities || '').length > 100 || String(m.personalStatement || '').length > 200) { s += 65; signals++; }
  if (!signals) return null;                       // nothing to go on — anonymous mode
  return Math.round(s / signals);
}
/* the ladder: moonshot first — slightly above what the record assures — then match, then safer */
function admReach(c, strength) {
  if (strength == null) return null;
  const gap = admSelectivity(c) - strength;
  if (gap > 26) return { band: 3, t: 'Far reach', cls: 'far' };
  if (gap > 6) return { band: 0, t: 'Moonshot', cls: 'moon' };
  if (gap > -14) return { band: 1, t: 'Match', cls: 'match' };
  return { band: 2, t: 'Safer bet', cls: 'safe' };
}
/* profile fit for an admission — stage, fields, region, and your actual record */
function admFit(c) {
  const p = S.profile || {}, m = S.master || {};
  let z = 0; const why = [];
  const want = S.admStage !== 'all' ? S.admStage : (ADM_DEFAULT_STAGE[p.role] || 'all');
  if (c.stage === want) { z += 2; }
  const f = c.fields || [];
  const hit = f.filter((x) => x === 'All' || (p.domains || []).some((d) => x.toLowerCase().includes(d.toLowerCase().split('/')[0]) || d.toLowerCase().includes(x.toLowerCase())));
  if (hit.length) { z += 1.2; why.push('your field'); }
  if (c.region === 'india' && (p.geo === 'india' || !p.geo)) z += 0.6;
  if ((c.region === 'us' || c.region === 'uk' || c.region === 'europe' || c.region === 'global') && p.geo === 'abroad') { z += 1; why.push('you want to go abroad'); }
  if (c.open_now) { z += 0.8; why.push('window open now'); }
  // record checks — marks make matches honest
  const pctReq = String(c.eligibility || '').match(/(\d{2})\s*%/);
  const myPct = parseFloat(m.pct12 || m.cgpa * 9.5 || 0);
  if (pctReq && myPct) {
    if (myPct >= parseInt(pctReq[1], 10)) { z += 0.5; why.push(`your ${myPct}% clears the ${pctReq[1]}% bar`); }
    else { z -= 1.4; why.push(`needs ${pctReq[1]}% — you have ${myPct}%`); }
  }
  if (/work[- ]?ex/i.test(c.eligibility || '') && !(m.workExYears > 0) && p.role !== 'work') z -= 1;
  const examKey = String(c.exam || '').toLowerCase().match(/jee|neet|cat|gate|sat|gre|gmat|ielts|toefl/);
  if (examKey && m[examKey[0]]) { z += 0.7; why.push(`${examKey[0].toUpperCase()} score on file`); }
  return { score: Math.round(35 + logistic(z * 0.8) * 62), why: why.slice(0, 2) };
}
const ADM_STATE_RE = [[/MHT|Maharashtra/i, 'Maharashtra'], [/KCET|Karnataka|Bengaluru|Bangalore/i, 'Karnataka'], [/WBJEE|West Bengal|Kolkata/i, 'West Bengal'], [/Delhi|DU\b|JNU|IIT Delhi/i, 'Delhi'], [/Tamil Nadu|Chennai|Vellore|VIT/i, 'Tamil Nadu'], [/Hyderabad|Telangana|ISB/i, 'Telangana'], [/Pilani|Rajasthan/i, 'Rajasthan'], [/Ahmedabad|Gujarat/i, 'Gujarat'], [/Madras|IIT Madras/i, 'Tamil Nadu'], [/Jamshedpur|XLRI/i, 'Jharkhand'], [/Pune/i, 'Maharashtra']];
function admState(c) {
  const hay = c.name + ' ' + c.org + ' ' + (c.eligibility || '');
  for (const [re, st] of ADM_STATE_RE) if (re.test(hay)) return st;
  return null;
}
function admFeeNum(c) { const m = String(c.fee || '').replace(/,/g, '').match(/₹\s*(\d+)/); return m ? parseInt(m[1], 10) : (/free/i.test(c.fee || '') ? 0 : null); }
const ADM_DUR = { upskill: '<1 yr', exec: '1-2 yrs', mba: '1-2 yrs', pg: '1-2 yrs', 'online-degree': '3-4 yrs', ug: '3-4 yrs', school: 'school', phd: '4+ yrs' };
function admScholarships(c) {
  const kws = (c.fields || []).filter((f) => f !== 'All');
  return computeMatches(DATA.filter((o) => o.type === 'Scholarship' && o.days_left > 0)).filter((o) =>
    !kws.length || (o.dom || []).some((d) => kws.some((k) => k.toLowerCase().includes(d.toLowerCase().split('/')[0]) || d.toLowerCase().includes(k.toLowerCase()))));
}
/* the exams strip — tests as their own connected object */
function examStrip() {
  const by = {};
  for (const c of ADM) {
    const ex = String(c.exam || '').split('(')[0].trim();
    if (!ex || /none|profile|optional/i.test(ex)) continue;
    const key = ex.toUpperCase().replace(/\s+2\d{3}.*/, '');
    if (!by[key]) by[key] = { exam: ex, cycles: [], date: c.exam_date || '', open: false };
    by[key].cycles.push(c.id);
    if (c.open_now) by[key].open = true;
    if (c.exam_date && (!by[key].date || String(c.exam_date) < String(by[key].date))) by[key].date = c.exam_date;
  }
  return Object.values(by).sort((a, b) => (b.open - a.open) || String(a.date).localeCompare(String(b.date))).slice(0, 16);
}
function setAdmStage(s) { S.admStage = s; }
function admStatusChip(c) {
  if (c.open_now) return `<span class="adm-st open">${ic('check', 11)} Open now${c.days_to_close != null && c.days_to_close < 400 ? ' · ' + c.days_to_close + 'd left' : ''}</span>`;
  if (c.days_to_open != null) return `<span class="adm-st soon2">${ic('clock', 11)} Opens in ${c.days_to_open}d</span>`;
  if (/ESTIMATED/i.test(c.status_note || '')) return `<span class="adm-st est">${ic('help', 11)} ${esc((c.window_open || 'dates TBC').replace('expected ', 'exp. '))}</span>`;
  return `<span class="adm-st">${ic('calendar', 11)} ${esc(c.window_open || 'TBC')}</span>`;
}
async function renderAdmissions(opts) {
  const el = document.getElementById('vw-admissions');
  if (!ADM.length) {
    el.innerHTML = `<h1 class="h-display">Admissions</h1><div class="count-line">Loading the cycles…</div>`;
    const ok = await loadAdmissions();
    if (!ok) { el.innerHTML = `<h1 class="h-display">Admissions</h1><div class="empty"><div class="h">Could not load the catalog</div><div class="s">Check your connection and try again.</div></div>`; return; }
    if (S.view !== 'admissions') return;
  }
  if (opts && opts.open) return openAdmission(opts.open);
  const p = S.profile || {};
  if (S.admStage === 'all' && !S._admTouched) S.admStage = ADM_DEFAULT_STAGE[p.role] || 'all';
  let list = ADM.slice();
  if (S.admStage !== 'all') list = list.filter((c) => c.stage === S.admStage);
  if (S.admRegion !== 'all') list = list.filter((c) => c.region === S.admRegion);
  if (S.admField !== 'all') list = list.filter((c) => (c.fields || []).some((f) => f === S.admField || f === 'All'));
  if (S.admState !== 'all' && S.admRegion === 'india') list = list.filter((c) => { const st = admState(c); return !st || st === S.admState; });
  if (S.admDur !== 'all') list = list.filter((c) => ADM_DUR[c.stage] === S.admDur);
  if (S.admFee !== 'all') list = list.filter((c) => { const f = admFeeNum(c); if (f === null) return S.admFee === 'any'; return S.admFee === 'free' ? f === 0 : S.admFee === 'low' ? f > 0 && f <= 1500 : f > 1500; });
  if (S.admSchol) list = list.filter((c) => admScholarships(c).length > 0);
  if (S.admExam) list = list.filter((c) => String(c.exam || '').toUpperCase().includes(S.admExam));
  const strength = userStrength();
  list = list.map((c) => ({ ...c, _fit: admFit(c), _reach: admReach(c, strength), _sel: admSelectivity(c) }));
  if (strength != null) {
    // moonshot → match → safer → far reach; within a band, open windows and fit first
    list.sort((a, b) => (a._reach.band - b._reach.band) || (b.open_now - a.open_now) || (b._fit.score - a._fit.score));
  } else {
    // no record to rank against — most prominent in their part of the world first
    const home = (S.profile && S.profile.geo) === 'abroad' ? ['us', 'uk', 'europe', 'global'] : ['india', 'online'];
    list.sort((a, b) => (home.includes(b.region) - home.includes(a.region)) || (b._sel - a._sel) || (b.open_now - a.open_now));
  }
  const openNow = ADM.filter((c) => c.open_now).length;
  const mc = masterCompleteness();
  el.innerHTML = `
    <h1 class="h-display">Admissions</h1>
    <p class="lede">Entrance exams, university intakes, executive programs and online degrees — <b>${ADM.length} cycles</b> tracked, <b>${openNow} accepting applications right now</b>. Matched against your stage, marks and scores${mc.pct < 40 ? ` — <b style="cursor:pointer" onclick="openDash('details')">complete your profile</b> and the matching gets sharper` : ''}.</p>
    <div class="exam-rail-wrap"><div class="exam-rail-h">${ic('clock', 13)} Test calendar — the exams that open these doors</div>
      <div class="exam-rail">${examStrip().map((e) => `<button class="exam-chip ${e.open ? 'open' : ''} ${S.admExam === e.exam.toUpperCase().replace(/\s+2\d{3}.*/, '') ? 'on' : ''}" onclick="S.admStage='all';S._admTouched=1;S.admExam=S.admExam==='${e.exam.toUpperCase().replace(/\s+2\d{3}.*/, '').replace(/'/g, '')}'?null:'${e.exam.toUpperCase().replace(/\s+2\d{3}.*/, '').replace(/'/g, '')}';renderAdmissions()">
        <b>${esc(e.exam.replace(/\s+2\d{3}.*/, ''))}</b><i>${esc(String(e.date).replace('expected ', 'exp. ').slice(0, 26) || 'date TBC')}</i>${e.open ? '<em>window open</em>' : ''}
      </button>`).join('')}</div></div>
    <div class="filters">${ADM_STAGES.map(([v, t]) => `<button class="${S.admStage === v ? 'on' : ''}" onclick="S.admStage='${v}';S._admTouched=1;renderAdmissions()">${t}</button>`).join('')}</div>
    <div class="filters adm-f2">
      <span class="sortsel">${ic('grid', 13)}&nbsp;<select onchange="S.admField=this.value;renderAdmissions()"><option value="all">Any field</option>${[...new Set(ADM.flatMap((c) => c.fields || []))].filter((f) => f !== 'All').sort().map((f) => `<option value="${esc(f)}" ${S.admField === f ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select></span>
      <span class="sortsel">${ic('globe', 13)}&nbsp;<select onchange="S.admRegion=this.value;S.admState='all';renderAdmissions()">${ADM_REGIONS.map(([v, t]) => `<option value="${v}" ${S.admRegion === v ? 'selected' : ''}>${t}</option>`).join('')}</select></span>
      ${S.admRegion === 'india' ? `<span class="sortsel">${ic('pin', 13)}&nbsp;<select onchange="S.admState=this.value;renderAdmissions()"><option value="all">All states</option>${[...new Set(ADM.map(admState).filter(Boolean))].sort().map((st) => `<option value="${st}" ${S.admState === st ? 'selected' : ''}>${st}</option>`).join('')}</select></span>` : ''}
      <span class="sortsel">${ic('clock', 13)}&nbsp;<select onchange="S.admDur=this.value;renderAdmissions()"><option value="all">Any duration</option><option value="<1 yr" ${S.admDur === '<1 yr' ? 'selected' : ''}>Under 1 yr</option><option value="1-2 yrs" ${S.admDur === '1-2 yrs' ? 'selected' : ''}>1–2 yrs</option><option value="3-4 yrs" ${S.admDur === '3-4 yrs' ? 'selected' : ''}>3–4 yrs</option></select></span>
      <span class="sortsel">₹&nbsp;<select onchange="S.admFee=this.value;renderAdmissions()"><option value="all">Any fee</option><option value="free" ${S.admFee === 'free' ? 'selected' : ''}>Free to apply</option><option value="low" ${S.admFee === 'low' ? 'selected' : ''}>≤ ₹1,500</option><option value="high" ${S.admFee === 'high' ? 'selected' : ''}>₹1,500+</option></select></span>
      <button class="${S.admSchol ? 'on' : ''}" onclick="S.admSchol=!S.admSchol;renderAdmissions()">${ic('trophy', 13)} Has matching scholarships</button>
    </div>
    <div class="count-line" id="adm-open">${list.length} cycles · ${userStrength() != null ? 'laddered for you — moonshots first, then matches, then safer bets' : 'most prominent first — add your marks in Profile and Scout ladders these to your record'}</div>
    <div class="adm-grid">${list.map((c) => `
      <article class="adm-card ${c.open_now ? 'live' : ''}" onclick="openAdmission('${c.id}')">
        <div class="ac-img"><img src="${admImg(c)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'"><span class="ac-logo"><img src="${admLogo(c)}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'"></span>${admStatusChip(c)}</div>
        <div class="ac-org">${esc(c.org)}</div>
        <div class="ac-name">${esc(shortTitle({ title: c.name }))}</div>
        <div class="ac-line">${esc((ADM_STAGES.find(([v]) => v === c.stage) || ['', c.stage])[1])}${(c.fields || []).filter((f) => f !== 'All').length ? ' · ' + esc((c.fields || []).filter((f) => f !== 'All')[0]) : ''}${(() => { const f = admFeeNum(c); return f === 0 ? ' · Free to apply' : f ? ' · ₹' + fmtIN(f) + ' to apply' : ''; })()}</div>
        <div class="ac-foot">
          ${c._reach ? `<span class="reach-chip ${c._reach.cls}">${c._reach.t}</span>` : `<span class="ac-fit" style="--fc:var(--ink2)">${c._fit.score}% fit</span>`}
          <span class="ac-more">Details ${ic('arrow-right', 12)}</span>
        </div>
      </article>`).join('')}</div>
    <div class="adm-note">${ic('help', 13)} Dates marked "exp." follow each body's usual pattern and are verified against official sites where announced — always confirm on the linked portal before paying a fee. Scout prepares everything up to the payment step; that part stays yours.</div>`;
  hydrateIcons(el); animateIn(el);
}
/* the admission path — where you are, what comes next, and how to boost your odds */
function openAdmission(id) {
  const c = ADM.find((x) => x.id === id); if (!c) return renderAdmissions();
  const el = document.getElementById('vw-admissions');
  const o = ADM_MAP[id]; S.lastViewed = id;
  const fit = admFit(c);
  const m = S.master || {};
  const steps = [];
  steps.push({ t: 'Application window', d: `${c.window_open || 'TBC'} → ${c.window_close || 'TBC'}`, state: c.open_now ? 'now' : (c.days_to_open != null ? 'next' : 'done') });
  if (c.exam && c.exam !== 'none' && !/profile/i.test(c.exam)) steps.push({ t: c.exam.split('(')[0].trim(), d: c.exam_date || 'date TBC', state: 'next' });
  if (/interview|pi\b/i.test((c.eligibility || '') + (c.exam || '')) || ['mba', 'exec'].includes(c.stage)) steps.push({ t: 'Shortlist & interview', d: 'Prepare your story — Scout drafts it with you', state: 'later' });
  steps.push({ t: 'Result & enrolment', d: 'Fees and registration stay in your hands', state: 'later' });
  const sv = S.saved.has(id);
  // boost rail: live opportunities that strengthen THIS application
  const kws = (c.fields || []).filter((f) => f !== 'All');
  let boost = computeMatches(DATA.filter((x) => x.days_left > 0)).filter((x) =>
    kws.length ? (x.dom || []).some((d) => kws.some((k) => k.toLowerCase().includes(d.toLowerCase().split('/')[0]) || d.toLowerCase().includes(k.toLowerCase()))) : true);
  if (['mba', 'exec'].includes(c.stage)) boost = boost.filter((x) => ['Competition', 'Conference', 'Talk', 'Networking', 'Workshop'].includes(x.type) || (x.dom || []).includes('Business'));
  if (c.stage === 'ug' || c.stage === 'school') boost = boost.filter((x) => ['Hackathon', 'Competition', 'Quiz', 'Academic', 'Volunteering', 'Workshop'].includes(x.type));
  boost = boost.slice(0, 8);
  const docsNeeded = ['photo', 'signature', 'marksheet10', 'marksheet12', ...(['pg', 'mba', 'exec', 'phd'].includes(c.stage) ? ['degree'] : []), 'idproof'];
  el.innerHTML = `
    <button class="backlink" onclick="renderAdmissions()">${ic('arrow-left', 14)} All admissions</button>
    <div class="adm-banner"><img src="${admImg(c)}" alt="" onerror="this.parentElement.style.display='none'"><span class="ac-logo lg"><img src="${admLogo(c)}" alt="" onerror="this.parentElement.style.display='none'"></span></div>
    <div class="adm-hero">
      <div>
        <div class="ac-org" style="font-size:13px">${esc(c.org)} ${admStatusChip(c)}</div>
        <h1 class="adm-h1">${esc(c.name)}</h1>
        <div class="ac-meta" style="margin-top:10px">${(c.fields || []).map((f) => `<span>${esc(f)}</span>`).join('')}<span>${esc(c.mode || '')}</span><span>${esc(c.fee || '')}</span></div>
      </div>
      <div class="adm-fit-card">${(() => { const r = admReach(c, userStrength()); return r ? `<span class="reach-chip ${r.cls}" style="margin-bottom:8px">${r.t}</span>` : ''; })()}<b style="color:${fit.score >= 75 ? 'var(--green-deep)' : fit.score >= 55 ? 'var(--orange)' : 'var(--ink2)'}">${fit.score}%</b><span>fit</span>${fit.why.map((w) => `<i>${esc(w)}</i>`).join('')}</div>
    </div>
    <div class="det-cta" style="max-width:660px">
      <button class="pill pill-red pill-lg" onclick="startApply('${id}')">${ic('send', 15)} Prepare my application</button>
      ${c.days_to_open != null ? remindBtnHTML(id, 'opens') : remindBtnHTML(id, 'deadline')}
      <div class="rowx">
        <button class="pill pill-dark" onclick="window.open('${esc(c.url)}','_blank')">Official portal ${ic('arrow-up-right', 14)}</button>
        <button class="icbtn ink" style="width:46px;height:46px" onclick="toggleSave('${id}',this)" aria-label="Save">${ic(sv ? 'bookmark-filled' : 'bookmark', 17)}</button>
        <button class="icbtn ink" style="width:46px;height:46px" onclick="attachOpp('${id}');goV('agent')" aria-label="Ask Scout about this">${ic('orb', 17)}</button>
      </div>
    </div>
    <div class="dsec"><h3>Your path</h3>
      <div class="adm-path">${steps.map((s, i) => `<div class="ap-step2 ${s.state}"><span class="ap-dot">${i + 1}</span><div><b>${esc(s.t)}</b><i>${esc(s.d)}</i></div></div>`).join('')}</div>
    </div>
    <div class="dsec"><h3>Eligibility — you vs the bar</h3>
      <div class="adm-elig-row"><span class="k">They ask</span><span class="v">${esc(c.eligibility || 'See portal')}</span></div>
      <div class="adm-elig-row"><span class="k">Your record</span><span class="v">${[m.pct10 ? 'Class 10: ' + m.pct10 + '%' : '', m.pct12 ? 'Class 12: ' + m.pct12 + '%' : '', m.cgpa ? 'CGPA ' + m.cgpa : '', m.workExYears ? m.workExYears + ' yrs work-ex' : ''].filter(Boolean).join(' · ') || `<b style="cursor:pointer" onclick="openDash('details')">Add your marks</b> and Scout checks you against every cycle`}</span></div>
      <div class="adm-elig-row"><span class="k">Documents</span><span class="v">${docsNeeded.map((s) => `<span class="doc-pill ${(S.docsIdx || {})[s] ? 'ok' : ''}">${(S.docsIdx || {})[s] ? '✓ ' : ''}${DOC_LABELS[s]}</span>`).join('')}</span></div>
    </div>
    ${(() => { const sch = admScholarships(c).slice(0, 6); return sch.length ? `<div class="dsec"><h3>Scholarships that fit this course</h3>
      <p class="psec-sub">Live money for ${esc((c.fields || []).filter((f) => f !== 'All').join(' / ') || 'this path')} — fund the seat before you win it.</p>
      <div class="rail">${sch.map((x) => scardHTML(x)).join('')}</div></div>` : ''; })()}
    ${boost.length ? `<div class="dsec"><h3>Boost your odds before the window closes</h3>
      <p class="psec-sub">Live opportunities that make THIS application stronger — wins and lines the ${esc(c.stage === 'mba' || c.stage === 'exec' ? 'adcom' : 'admissions panel')} actually reads.</p>
      <div class="rail">${boost.map((x) => scardHTML(x)).join('')}</div></div>` : ''}`;
  hydrateIcons(el); animateIn(el);
  window.scrollTo({ top: 0 });
}

/* ————— chat attachments: drop files in, Scout reads what it can ————— */
async function attachChatFiles(input) {
  const files = [...(input.files || [])].slice(0, 8);
  input.value = '';
  for (const f of files) {
    if (S.chatFiles.length >= 8) { toast('8 attachments max per message'); break; }
    const entry = { name: f.name, kind: f.type || 'file', text: '', note: '' };
    try {
      if (/^text\/|json|csv|markdown/.test(f.type) || /\.(txt|md|csv|json|tex)$/i.test(f.name)) {
        entry.text = (await f.text()).slice(0, 6000);
        entry.note = Math.round(f.size / 1024) + 'KB text';
      } else if (/^image\//.test(f.type)) {
        entry.note = 'reading…';
        S.chatFiles.push(entry); renderChatFiles();
        const fit = await fitImage(f, { maxW: 1400, maxKB: 400, mime: 'image/jpeg' });
        const r = await fetch(API_BASE + '/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: fit.blobB64, mime: fit.mime }), signal: AbortSignal.timeout(60000) });
        const d = await r.json();
        entry.text = d.ok ? JSON.stringify(d.fields).slice(0, 2500) : '';
        entry.note = d.ok ? 'read by Scout' : 'image (unreadable)';
        renderChatFiles(); continue;
      } else if (/^image\//.test(f.type)) {
        entry.note = 'image — sign in and Scout can read it';
      } else {
        entry.note = 'attached — Scout uses the name & type';
      }
    } catch { entry.note = 'could not read'; }
    S.chatFiles.push(entry);
  }
  renderChatFiles();
}
function renderChatFiles() {
  const box = document.getElementById('cmp-files'); if (!box) return;
  if (!S.chatFiles.length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = S.chatFiles.map((f, i) => `<span class="cf-chip">${ic(f.text ? 'doc' : 'file', 12)}${esc(f.name.slice(0, 22))}<i>${esc(f.note)}</i><button onclick="S.chatFiles.splice(${i},1);renderChatFiles()" aria-label="Remove">${ic('x', 11)}</button></span>`).join('');
  hydrateIcons(box);
}

/* ————— connected links: any public URL becomes application context ————— */
const PLATFORMS = [
  ['github', 'GitHub', 'https://github.com/', ['Engineering', 'AI/ML']],
  ['behance', 'Behance', 'https://www.behance.net/', ['Design', 'Arts']],
  ['dribbble', 'Dribbble', 'https://dribbble.com/', ['Design']],
  ['youtube', 'YouTube channel', 'https://youtube.com/@', ['Arts', 'Design', 'All']],
  ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/', ['All']],
  ['drive', 'Google Drive file', 'https://drive.google.com/', ['All']],
  ['portfolio', 'Portfolio site', 'https://', ['All']],
];
/* field-aware ordering: a designer sees Behance first, an engineer GitHub */
function platformsForUser() {
  const doms = (S.profile && S.profile.domains) || [];
  return PLATFORMS.slice().sort((a, b) => {
    const hit = (p) => p[3].some((f) => f === 'All' ? 0 : doms.includes(f)) ? 0 : 1;
    return hit(a) - hit(b);
  });
}
async function connectLink(platform, url) {
  url = String(url || '').trim();
  if (!url) return toast('Paste the link first');
  if (!/^https?:\/\//.test(url)) url = 'https://' + url;
  if (platform === 'github' || /github\.com\/[^/]+\/?$/.test(url)) return connectGitHub(url);
  toast('Scout is reading it…');
  try {
    const r = await fetch(API_BASE + '/enrich', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url, platform }), signal: AbortSignal.timeout(45000),
    });
    const d = await r.json();
    if (!r.ok || !d.ok) throw new Error(d.error || 'could not read that link');
    const links = (S.master.links || []).filter((l) => l.url !== url);
    links.push({ url, platform: d.platform || platform, title: d.title, kind: d.kind, summary: d.summary, highlights: d.highlights || [], ts: Date.now() });
    S.master.links = links.slice(-20);
    ls('scout-master', S.master); queueSync(); invalidateUV();
    refreshCurrent();
    toast(`Connected — “${(d.title || url).slice(0, 40)}” now feeds your applications`);
  } catch (e) { toast(String(e.message || e)); }
}
function removeLink(url) {
  S.master.links = (S.master.links || []).filter((l) => l.url !== url);
  ls('scout-master', S.master); queueSync(); refreshCurrent();
}
function linksPanelHTML() {
  const links = S.master.links || [];
  return `<div class="psec" id="ps-links"><h3>Links & portfolios</h3>
    <p class="psec-sub">Paste anything public — Scout reads it, works out what it proves, and cites it in applications. The more you connect, the sharper every draft.</p>
        <div class="lk-add">
      <select id="lk-platform">${platformsForUser().map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>
      <input id="lk-url" placeholder="Paste the link…" onkeydown="if(event.key==='Enter')connectLink(document.getElementById('lk-platform').value,this.value)">
      <button class="pill pill-dark" onclick="connectLink(document.getElementById('lk-platform').value,document.getElementById('lk-url').value)">${ic('link', 14)} Connect</button>
    </div>
    ${links.length ? `<div class="lk-list">${links.map((l) => `
      <div class="lk-row">
        <span class="aps-i">${ic(l.platform === 'youtube' ? 'send' : l.platform === 'drive' ? 'doc' : 'link', 14)}</span>
        <div class="lk-m"><b>${esc(l.title || l.url)}</b><i>${esc(l.kind || l.platform)}${l.summary ? ' — ' + esc(l.summary.slice(0, 90)) : ''}</i></div>
        <button class="aps-x" onclick="removeLink('${esc(l.url)}')" aria-label="Remove">${ic('x', 13)}</button>
      </div>`).join('')}</div>` : ''}
  </div>`;
}

/* the Scout Autofill extension — download + sync */
function downloadExtension() {
  const a = document.createElement('a');
  a.href = '/scout-extension.zip'; a.download = 'scout-autofill.zip'; a.click();
  toast('Downloaded — unzip, then chrome://extensions → Load unpacked');
}
function syncExtension() {
  // the extension's content script reads this page's localStorage on every visit
  ls('scout-master', S.master); ls('scout-kit', S.kit); ls('scout-profile', S.profile);
  toast('Profile staged — any Scout tab syncs the extension automatically');
}

/* ═══════════ MASTER PROFILE — answer everything once, apply everywhere ═══════════
   Common-App-informed: the union of what Indian + international forms actually ask.
   Lives in S.master, synced with the account, and feeds autofill + the extension. */
const MASTER_SECTIONS = [
  { id: 'personal', t: 'Personal details', icn: 'user', fields: [
    ['firstName', 'First name', 'text'], ['lastName', 'Last name', 'text'], ['dob', 'Date of birth', 'date'],
    ['gender', 'Gender', 'select', ['', 'Female', 'Male', 'Non-binary', 'Prefer not to say']],
    ['phone', 'Phone', 'tel'], ['fatherName', "Father's name", 'text'], ['motherName', "Mother's name", 'text'],
    ['address1', 'Address', 'text'], ['city', 'City', 'text'], ['state', 'State', 'text'], ['pincode', 'PIN code', 'text'],
    ['nationality', 'Nationality', 'text'], ['category', 'Category', 'select', ['', 'General', 'General-EWS', 'OBC-NCL', 'SC', 'ST', 'Other']],
  ]},
  { id: 'academics', t: 'Academics', icn: 'cap', fields: [
    ['board10', 'Class 10 board', 'select', ['', 'CBSE', 'ICSE', 'State board', 'IB', 'IGCSE', 'Other']], ['school10', 'Class 10 school', 'text'], ['year10', 'Class 10 year', 'text'], ['pct10', 'Class 10 %', 'text'],
    ['board12', 'Class 12 board', 'select', ['', 'CBSE', 'ISC', 'State board', 'IB', 'A-levels', 'Other']], ['school12', 'Class 12 school', 'text'], ['year12', 'Class 12 year', 'text'], ['pct12', 'Class 12 %', 'text'],
    ['stream12', 'Class 12 stream', 'select', ['', 'Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts/Humanities']],
    ['degree', 'Degree', 'text'], ['branch', 'Branch / major', 'text'], ['college', 'College / university', 'text'], ['cgpa', 'CGPA / %', 'text'], ['gradYear', 'Graduation year', 'text'], ['workExYears', 'Work experience (years)', 'text'],
  ]},
  { id: 'scores', t: 'Test scores', icn: 'trophy', fields: [
    ['jee', 'JEE Main percentile', 'text'], ['neet', 'NEET score', 'text'], ['cat', 'CAT percentile', 'text'], ['gate', 'GATE score', 'text'],
    ['sat', 'SAT', 'text'], ['gre', 'GRE', 'text'], ['gmat', 'GMAT', 'text'], ['ielts', 'IELTS', 'text'], ['toefl', 'TOEFL', 'text'], ['duolingo', 'Duolingo English', 'text'],
  ]},
  { id: 'links', t: 'Links', icn: 'link', fields: [
    ['linkedin', 'LinkedIn', 'url'], ['github', 'GitHub', 'url'], ['portfolio', 'Portfolio / website', 'url'], ['other', 'Anything else', 'url'],
  ]},
];
const ESSAY_BANK = [
  ['personalStatement', 'Personal statement', 1500, 'The Common-App-style essay — who you are, what shaped you, where you are going.'],
  ['whyProgram', 'Why this program / college', 650, 'The adaptable core — Scout tailors it per application.'],
  ['leadership', 'A time you led', 650, 'One concrete story with your role, the tension, and the outcome.'],
  ['challenge', 'A challenge you overcame', 650, 'Honest beats heroic. What changed in how you work?'],
  ['goals', 'Goals — 5 years out', 650, 'What you want to build or become, and why this step gets you there.'],
  ['activities', 'Activities & achievements', 900, 'The Common-App activities list as prose — clubs, projects, wins, hours.'],
];
function setMaster(f, v) { S.master[f] = v; ls('scout-master', S.master); queueSync(); invalidateUV(); }
function masterCompleteness() {
  const need = MASTER_SECTIONS.flatMap((s) => s.fields.map((f) => f[0]));
  const filled = need.filter((f) => String(S.master[f] || '').trim()).length;
  const essays = ESSAY_BANK.filter(([k]) => String(S.master[k] || '').trim().length > 80).length;
  const docs = Object.keys(S.docsIdx || {}).length;
  return { pct: Math.round((filled / need.length) * 60 + (essays / ESSAY_BANK.length) * 25 + Math.min(docs / 5, 1) * 15), filled, need: need.length, essays, docs };
}
/* what's missing that unlocks the most — the nudge engine */
function masterNudge() {
  const m = S.master || {};
  if (!Object.keys(S.docsIdx || {}).length) return ['Upload your Class 10 marksheet', 'Scout reads it and fills your academics for you', "openDash('details')"];
  if (!m.pct12 && !m.cgpa) return ['Add your Class 12 % or CGPA', 'Unlocks eligibility checks on admissions with cutoffs', "openDash('details')"];
  if (!String(m.personalStatement || '').trim()) return ['Start your personal statement', 'One essay, reused across every application — Scout drafts the first pass', "openDash('details')"];
  if (!m.phone) return ['Add your phone number', 'Nearly every Indian form requires it', "openDash('details')"];
  return null;
}

/* ————— image compressor / reformatter — fits any form's requirement ————— */
const DOC_SPECS = {
  photo: { w: 200, h: 230, maxKB: 50, mime: 'image/jpeg', label: 'Passport photo · 200×230 · ≤50KB JPEG' },
  signature: { w: 140, h: 60, maxKB: 20, mime: 'image/jpeg', label: 'Signature · 140×60 · ≤20KB JPEG' },
  marksheet10: { maxW: 1600, maxKB: 300, mime: 'image/jpeg', label: 'Marksheet · ≤300KB JPEG' },
  marksheet12: { maxW: 1600, maxKB: 300, mime: 'image/jpeg', label: 'Marksheet · ≤300KB JPEG' },
  degree: { maxW: 1600, maxKB: 300, mime: 'image/jpeg', label: 'Certificate · ≤300KB JPEG' },
  idproof: { maxW: 1400, maxKB: 250, mime: 'image/jpeg', label: 'ID proof · ≤250KB JPEG' },
  category: { maxW: 1600, maxKB: 300, mime: 'image/jpeg', label: 'Certificate · ≤300KB JPEG' },
  resume: { raw: true, maxKB: 1800, label: 'Resume · PDF ≤1.8MB' },
  other1: { maxW: 1600, maxKB: 400, mime: 'image/jpeg', label: 'Document · ≤400KB' },
  other2: { maxW: 1600, maxKB: 400, mime: 'image/jpeg', label: 'Document · ≤400KB' },
};
/* binary-search JPEG quality until the file fits the target size */
async function fitImage(file, spec) {
  if (spec.raw || !/^image\//.test(file.type)) {
    const buf = await file.arrayBuffer();
    return { blobB64: bufToB64(buf), mime: file.type, bytes: buf.byteLength, note: 'stored as-is' };
  }
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const cv = document.createElement('canvas');
  const w = img.naturalWidth, h = img.naturalHeight;
  if (spec.w && spec.h) {
    // exact-frame specs (photo/signature): cover-crop to the required ratio
    cv.width = spec.w; cv.height = spec.h;
    const scale = Math.max(spec.w / w, spec.h / h);
    const sw = spec.w / scale, sh = spec.h / scale;
    cv.getContext('2d').drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, spec.w, spec.h);
  } else {
    const maxW = spec.maxW || 1600;
    const scale = Math.min(1, maxW / w);
    cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
  }
  URL.revokeObjectURL(img.src);
  const mime = spec.mime || 'image/jpeg';
  let lo = 0.35, hi = 0.95, best = null;
  for (let i = 0; i < 7; i++) {
    const q = (lo + hi) / 2;
    const blob = await new Promise((res) => cv.toBlob(res, mime, q));
    if (blob.size / 1024 <= (spec.maxKB || 400)) { best = blob; lo = q; } else hi = q;
  }
  if (!best) best = await new Promise((res) => cv.toBlob(res, mime, 0.3));
  const buf = await best.arrayBuffer();
  return { blobB64: bufToB64(buf), mime, bytes: buf.byteLength, note: `${Math.round(file.size / 1024)}KB → ${Math.round(buf.byteLength / 1024)}KB · ${cv.width}×${cv.height}` };
}
function bufToB64(buf) {
  const bytes = new Uint8Array(buf); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/* ————— documents vault: upload → auto-fit → encrypted store → AI extraction ————— */
const DOC_LABELS = { photo: 'Passport photo', signature: 'Signature', marksheet10: 'Class 10 marksheet', marksheet12: 'Class 12 marksheet', degree: 'Degree / diploma', resume: 'Resume / CV', idproof: 'ID proof', category: 'Category certificate', other1: 'Other document', other2: 'Other document' };
function docLabel(slot) { if (DOC_LABELS[slot]) return DOC_LABELS[slot]; const m = (S.docsIdx || {})[slot]; return (m && (m.kind || m.name)) || 'Certificate'; }
function docSpec(slot) { return DOC_SPECS[slot] || { maxW: 1600, maxKB: 400, mime: 'image/jpeg', label: 'Certificate · ≤400KB' }; }
function addCert(input) { uploadDoc('cert-' + Date.now(), input); }
async function uploadDoc(slot, input) {
  const file = input.files && input.files[0]; if (!file) return;
  const cell = document.getElementById('doc-' + slot);
  if (cell) cell.classList.add('busy');
  try {
    const spec = docSpec(slot);
    toast('Preparing ' + docLabel(slot).toLowerCase() + '…');
    const fit = await fitImage(file, spec);
    await idbPut('doc:' + slot, { name: file.name, mime: fit.mime, data: fit.blobB64, ts: Date.now() });
    S.docsIdx[slot] = { name: String(file.name).slice(0, 80), mime: fit.mime, bytes: fit.bytes, ts: Date.now() };
    ls('scout-docsidx', S.docsIdx);
    toast(`Saved on this device — ${fit.note}`);
    // every readable document gets read: marksheets fill your academics,
    // certificates get classified and become ammunition for applications
    if (/^image\//.test(fit.mime) && !/^(photo|signature)$/.test(slot)) extractDoc(slot, fit);
    refreshDossier();
  } catch (e) { toast(String(e.message || e)); }
  finally { if (cell) cell.classList.remove('busy'); }
}
async function extractDoc(slot, fit) {
  toast('Scout is reading it…');
  try {
    const r = await fetch(API_BASE + '/extract', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: fit.blobB64, mime: fit.mime }), signal: AbortSignal.timeout(60000),
    });
    const d = await r.json();
    if (!r.ok || !d.ok || !d.fields) throw new Error(d.error || 'unreadable');
    const f = d.fields, m = S.master, applied = [];
    const put = (key, val) => { if (val != null && String(val).trim() && !String(m[key] || '').trim()) { m[key] = String(val); applied.push(key); } };
    if (slot === 'marksheet10') { put('board10', f.board); put('school10', f.school); put('year10', f.examYear); put('pct10', f.percentage || f.cgpa); }
    if (slot === 'marksheet12') { put('board12', f.board); put('school12', f.school); put('year12', f.examYear); put('pct12', f.percentage || f.cgpa); put('stream12', f.stream); }
    if (slot === 'degree') { put('degree', f.degree); put('college', f.university); put('cgpa', f.cgpa || f.percentage); }
    put('fatherName', f.fatherName); put('motherName', f.motherName); put('dob', f.dob);
    if (f.name && !m.firstName) { const parts = String(f.name).trim().split(/\s+/); put('firstName', parts[0]); put('lastName', parts.slice(1).join(' ')); }
    // classification: what this document IS and what it proves
    if (f.kind || f.summary) {
      S.docsIdx[slot] = { ...(S.docsIdx[slot] || {}), kind: f.kind || '', summary: f.summary || '' };
      ls('scout-docsidx', S.docsIdx);
      const certs = (S.master.certs || []).filter((x) => x.slot !== slot);
      certs.push({ slot, kind: f.kind || 'certificate', summary: f.summary || '' });
      S.master.certs = certs.slice(-40); ls('scout-master', S.master); invalidateUV();
    }
    if (applied.length) { ls('scout-master', m); refreshDossier(); toast(`Read it — filled ${applied.length} field${applied.length === 1 ? '' : 's'} from the document`); if (!dashLive()) springPop(document.getElementById('ps-master')); }
    else if (f.kind || f.summary) { refreshDossier(); toast(`Read it — filed as “${f.kind || 'certificate'}”`); }
    else toast('Read it — nothing new to fill');
  } catch (e) { toast('Could not read the document: ' + String(e.message || e)); }
}
async function deleteDoc(slot) {
  await idbDel('doc:' + slot);
  delete S.docsIdx[slot]; ls('scout-docsidx', S.docsIdx);
  refreshDossier(); toast('Removed');
}
async function downloadDoc(slot) {
  const doc = await idbGet('doc:' + slot);
  if (!doc) return toast('That document is no longer on this device');
  const a = document.createElement('a');
  a.href = `data:${doc.mime};base64,${doc.data}`;
  a.download = doc.name || slot;
  a.click();
}
async function refreshDocs() { /* documents are local — the index in localStorage is the truth */ }
/* essay drafting straight from everything Scout knows */
async function draftEssay(key, max) {
  if (!AI_ENABLED) return soon();
  const btn = document.getElementById('es-' + key);
  if (btn) { btn.textContent = 'Drafting…'; btn.disabled = true; }
  const found = ESSAY_BANK.find(([k]) => k === key);
  const label = found ? found[1] : key;
  try {
    const r = await fetch(API_BASE + '/compose', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: `Write the "${label}" essay for this person's application bank. Write ${Math.round(max * 0.75)}-${max} characters, first person, specific, grounded ONLY in these facts:\n${memoryBrief()}\nMaster profile: ${JSON.stringify(S.master).slice(0, 1500)}\nNo clichés. Concrete stories over adjectives.`, mode: 'text', max_tokens: Math.ceil(max / 2.2) + 120 }),
      signal: AbortSignal.timeout(45000),
    });
    const d = await r.json();
    if (!d.ok || !d.text) throw new Error(d.error || 'busy');
    const ta = document.getElementById('ma-' + key);
    if (ta) { ta.value = d.text.slice(0, max); setMaster(key, ta.value); const c = ta.nextElementSibling; if (c) c.textContent = ta.value.length + ' / ' + max; }
    toast('Drafted — now make it sound like you');
  } catch (e) { toast('Could not draft: ' + String(e.message || e)); }
  finally { if (btn) { btn.textContent = 'Draft with Scout'; btn.disabled = false; } }
}

/* ═══════════ PROFILE ═══════════ */
/* "Your record" — past tense, no deadline, nothing needs you. Built from
   scout-acts (logAct, every stage change) plus S.pipe outcomes. The retention
   moment is LOGGING an outcome, which stays on the Tracking row; reading the
   record belongs here. */
const ACT_VERB = { saved: 'Saved', draft: 'Started drafting', applied: 'Sent', result: 'Heard back' };
function historyEvents() {
  const acts = (ls('scout-acts') || []).filter((a) => a && a.t && ACT_VERB[a.k]);
  const out = acts.map((a) => {
    const p = S.pipe[String(a.id)];
    return { t: a.t, kind: a.k, title: (p && p.snap && p.snap.title) || 'An opportunity',
      org: (p && p.snap && p.snap.org) || '', outcome: a.k === 'result' ? (p && p.outcome) : null };
  });
  return out.sort((a, b) => b.t - a.t);
}
function historyStats() {
  const all = Object.values(S.pipe || {}).filter((p) => p.snap && !p._demo);
  const results = all.filter((p) => p.stage === 'result');
  const sent = all.filter((p) => ['applied', 'result'].includes(p.stage)).length;
  const won = results.filter((p) => p.outcome === 'won').length;
  const shortlisted = results.filter((p) => p.outcome === 'shortlist').length;
  return { tracked: all.length, sent, heard: results.length, won, shortlisted };
}
function historyHTML() {
  const ev = historyEvents(), st = historyStats();
  if (!ev.length) return `<div class="psec" id="ps-record"><h3>Your record</h3>
    <p class="psec-sub">Everything you save, draft, send and hear back about is kept here — so you can see what you actually did this year, not just what is open right now.</p>
    <div class="empty e-rich"><span class="e-ic">${ic('clock', 20)}</span><div class="h">Nothing here yet</div>
      <div class="s">Save your first opportunity and the record starts.</div>
      <div class="e-acts"><button class="pill pill-dark" onclick="goV('discover')">Find something</button></div></div></div>`;
  const lim = S.histLim || 20;
  const byYear = {};
  for (const e of ev) { const y = new Date(e.t).getFullYear(); (byYear[y] = byYear[y] || []).push(e); }
  return `<div class="psec" id="ps-record"><h3>Your record</h3>
    <p class="psec-sub">What you actually did — kept on this device, never uploaded.</p>
    <div class="hist-stats">
      ${[[st.tracked, 'tracked'], [st.sent, 'sent'], [st.heard, 'heard back'], [st.won + st.shortlisted, 'won or shortlisted']]
        .map(([n, l]) => `<div class="hs"><b>${n}</b><span>${l}</span></div>`).join('')}
    </div>
    ${Object.keys(byYear).sort((a, b) => b - a).map((y) => `
      <div class="hist-year">${y}</div>
      ${byYear[y].slice(0, lim).map((e) => `<div class="hist-row ${e.kind}">
        <span class="hr-d">${new Date(e.t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        <span class="hr-v">${ACT_VERB[e.kind]}</span>
        <span class="hr-t">${esc(e.title)}${e.org ? `<i> · ${esc(e.org)}</i>` : ''}</span>
        ${e.outcome ? `<span class="hr-o ${e.outcome}">${esc((OUTCOMES.find(([v]) => v === e.outcome) || [, e.outcome])[1])}</span>` : ''}
      </div>`).join('')}`).join('')}
    ${ev.length > lim ? `<button class="pill pill-ghost" style="margin-top:14px" onclick="S.histLim=${lim + 40};renderProfile()">Show more</button>` : ''}
  </div>`;
}
function renderProfile() {
  const el = document.getElementById('vw-profile');
  const matches = computeMatches();
  const p = S.profile || {};
  const nm = (S.user && S.user.name) || 'You';
  const roleLabel = ((ROLES.find((r) => r.v === p.role) || {}).t) || '—';
  const initial = (nm[0] || 'S').toUpperCase();
  const streak = (ls('scout-streak') || {}).count || 1;
  el.innerHTML = `<div class="prof">
    <div class="prof-hd">
      <div class="prof-av" style="background:${PASTELS[initial.charCodeAt(0) % PASTELS.length]};color:var(--ink)">${initial}</div>
      <div><div class="prof-nm">${esc(nm)}</div><div class="prof-sb">${esc(roleLabel)}${p.institution ? ' · ' + esc(p.institution) : ''}${S.user && S.user.verified ? ' · ✓ verified student' : ''}</div></div>
    </div>
    <div class="prof-stats">
      <div class="ps"><div class="v" data-count="${pipeCounts().saved}">0</div><div class="l">Saved</div></div>
      <div class="ps"><div class="v" data-count="${pipeCounts().applied + pipeCounts().result}">0</div><div class="l">Applied</div></div>
      <div class="ps"><div class="v">${matches[0] ? matches[0]._score + '%' : '—'}</div><div class="l">Top match</div></div>
      <div class="ps"><div class="v" data-count="${masterCompleteness().pct}">0</div><div class="l">% ready</div></div>
    </div>
    <p class="prof-hint">${ic('arrow-right', 13)} Your details, essays and documents live in the dashboard — <b onclick="openDash('details')">open it</b>.</p>

    <div class="psec" id="ps-you"><h3>Who you are</h3>
      ${[['Role', roleLabel], ['Institution', p.institution || '—'], ['Year', p.gradYear || '—'], ['CGPA', p.cgpa || '—'], ['City', p.city || '—'], ['Open to', ({ india: 'India only', abroad: 'Abroad', remote: 'Remote', any: 'Anywhere' })[p.geo] || '—'], ['Goal', ((GOALS.find((g) => g.v === p.goal) || {}).t) || '—']].map(([k, v]) => `<div class="prow"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}
      <div class="prow"><span class="k">Interests</span><span class="v"><span class="kw inline">${(p.domains || []).concat(p.looking || []).map((k) => `<span>${esc(k)}</span>`).join('') || '—'}</span></span></div>
    </div>

    ${historyHTML()}

    <div class="psec" id="ps-settings"><h3>Settings</h3>
      <div id="ps-prefs">
        <div class="prow"><span class="k">Deadline reminders — 3 days before</span><div class="tog ${p.reminders ? 'on' : ''}" role="switch" aria-checked="${!!p.reminders}" tabindex="0" onclick="S.profile.reminders=!S.profile.reminders;ls('scout-profile',S.profile);renderProfile()"><i></i></div></div>
        <div class="prow"><span class="k">Daily match digest</span><div class="tog ${p.digest ? 'on' : ''}" role="switch" aria-checked="${!!p.digest}" tabindex="0" onclick="S.profile.digest=!S.profile.digest;ls('scout-profile',S.profile);renderProfile()"><i></i></div></div>
        <div class="prow"><span class="k">WhatsApp nudges</span><span class="v">${ls('scout-whatsapp') ? 'On · ' + esc((ls('scout-whatsapp') || {}).phone || '') : '<b style="cursor:pointer" onclick="enableWhatsApp()">Enable</b>'}</span></div>
      </div>
      <div class="prow"><span class="k">GitHub</span><span class="v">${S.accounts.github
        ? `@${esc(S.accounts.github.handle)} · ${S.accounts.github.publicRepos} repos <b style="cursor:pointer;color:var(--ink3)" onclick="disconnectAcct('github')">Disconnect</b>`
        : `<span class="conn-in"><input id="gh-p" placeholder="username" style="width:130px" aria-label="GitHub username"><b style="cursor:pointer" onclick="connectGitHub(document.getElementById('gh-p').value)">Connect</b></span>`}</span></div>
      <div class="prow"><span class="k">What Scout has learned</span><span class="v">${memorySources().length} source${memorySources().length === 1 ? '' : 's'} feeding autofill</span></div>
      <details class="psec-fold" id="ps-ext"><summary>Scout Autofill — browser extension</summary>
        <p class="psec-sub">Install once and any application form on the web fills itself from your details with one click. It never auto-submits, and never touches passwords or payment fields.</p>
        <div class="ext-row">
          <button class="pill pill-dark" onclick="downloadExtension()">${ic('download', 14)} Download the extension</button>
          <button class="pill pill-ghost" onclick="syncExtension()">${ic('refresh', 14)} Sync my data to it</button>
        </div>
        <ol class="ext-steps"><li>Download and unzip</li><li>chrome://extensions → Developer mode → Load unpacked → pick the folder</li><li>On any form: click the Scout heart → Fill</li></ol>
      </details>
    </div>

    <div class="psec" id="ps-acct"><h3>Your data</h3>
      <div class="acct-row"><span class="acct-ic">${ic('shield', 16)}</span>
        <span class="acct-tx"><b>Everything lives in this browser</b><i>Profile, documents, ${pipeCounts().saved + pipeCounts().draft + pipeCounts().applied + pipeCounts().result} tracked ${pipeCounts().saved + pipeCounts().draft + pipeCounts().applied + pipeCounts().result === 1 ? 'opportunity' : 'opportunities'}, drafts and chats — on this device, never uploaded, no account needed.</i></span>
      </div>
      <p class="psec-sub">Clearing your browsing data clears Scout too. Export a backup file and you can carry everything to another device — or bring it back.</p>
      <div class="ext-row">
        <button class="pill pill-dark" onclick="exportData()">${ic('download', 14)} Export a backup</button>
        <label class="pill pill-ghost" style="cursor:pointer">${ic('upload', 14)} Import a backup<input type="file" accept="application/json,.json" hidden onchange="importData(this)"></label>
      </div>
      <details class="danger-zone"><summary>Danger zone</summary>
        <p class="psec-sub">Deletes your profile, every tracked opportunity, every draft and every document on this device. Export a backup first — this cannot be undone.</p>
        <button class="signout" onclick="resetDevice()">Reset this device</button>
      </details>
    </div>
  </div>`;
  hydrateIcons(el);
  animateIn(el);
}

/* ═══════════ SAVE / SHARE / STREAK / WHATSAPP ═══════════ */
function toggleSave(id, btn) {
  const on = S.saved.has(id);
  const o = DATA.find((x) => String(x.id) === String(id));
  const prev = pipeGet(id);
  if (on) {
    S.saved.delete(id);
    // only drop it from the pipeline if no real work has happened on it yet
    const hadWork = prev && (prev.stage === 'draft' || prev.stage === 'applied' || prev.stage === 'result');
    if (!hadWork) pipeDel(id);
    toastUndo(hadWork ? 'Unsaved — your draft is still in Scouted' : 'Removed from saved', 'Undo', () => {
      S.saved.add(id); ls('scout-saved', [...S.saved]); if (!hadWork) pipeSet(id, { stage: 'saved' }, o); refreshCurrent();
    });
  } else {
    S.saved.add(id);
    if (!prev) pipeSet(id, { stage: 'saved' }, o);
    try { navigator.vibrate && navigator.vibrate(8); } catch {}
    toast('Saved to Scouted');
  }
  ls('scout-saved', [...S.saved]);
  invalidateUV(); queueSync();
  if (btn) { btn.classList.toggle('on', !on); btn.innerHTML = ic(!on ? 'bookmark-filled' : 'bookmark', 15); }
}
/* Four call sites used to repaint views sitting hidden behind the #dash screen. */
function dashLive() { const d = document.getElementById('dash'); return !!(d && d.classList.contains('on')); }
function refreshCurrent() { renderView(S.view); }
function shareOpp(id) {
  const o = DATA.find((x) => String(x.id) === String(id)); if (!o) return;
  if (navigator.share) navigator.share({ title: o.title, text: o.title + ' — ' + o.org, url: o.source_url }).catch(() => {});
  else { navigator.clipboard && navigator.clipboard.writeText(o.source_url); toast('Link copied'); }
}
function bumpStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const data = ls('scout-streak') || {};
  if (data.last === today) return data.count || 1;
  const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const count = data.last === y ? (data.count || 0) + 1 : 1;
  ls('scout-streak', { last: today, count });
  return count;
}
function renderStreakStrip() {
  const c = (ls('scout-streak') || {}).count || 1;
  const t = document.getElementById('streak-t'); const d = document.getElementById('streak-d');
  if (!t) return;
  const titles = ["Day 1 — you're starting strong", 'Day 2 in a row', '3 days · keep going', '4 days · momentum', '5 days · streak is hot', '6 days · almost a week', '🔥 1-week streak — free Plus week unlocked'];
  t.textContent = titles[Math.min(c - 1, 6)] || c + ' days · keep going';
  d.textContent = c >= 7 ? 'Plus unlocked for 7 days · hit 30 for a free month' : 'Check in daily · 7 days unlocks a free Plus week';
}
function enableWhatsApp() {
  const phone = prompt('Your WhatsApp number (with country code, e.g. +91 98765 43210):');
  if (!phone) return;
  if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) { toast('Invalid number — try again'); return; }
  ls('scout-whatsapp', { phone, enabledAt: Date.now() });
  const w = document.getElementById('wa-strip'); if (w) w.style.display = 'none';
  toast('WhatsApp reminders on — you\'re set');
}

/* ═══════════ TOAST ═══════════ */
let _toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  clearTimeout(_toastTimer); t.classList.remove('show');
  setTimeout(() => { t.innerHTML = `<span>${msg}</span>`; t.classList.add('show'); _toastTimer = setTimeout(() => t.classList.remove('show'), 2600); }, 20);
}
function toastUndo(msg, label, onUndo) {
  const t = document.getElementById('toast');
  clearTimeout(_toastTimer); t.classList.remove('show');
  setTimeout(() => {
    t.innerHTML = `<span>${msg}</span><button class="undo">${label}</button>`;
    t.classList.add('show');
    t.querySelector('.undo').onclick = () => { onUndo(); t.classList.remove('show'); };
    _toastTimer = setTimeout(() => t.classList.remove('show'), 4500);
  }, 20);
}

/* ═══════════ ROTATION ═══════════ */
async function rotateFeed() {
  toast('Re-dealing the feed…');
  const ok = await loadFeed(true);
  if (ok) { refreshCurrent(); toast('Feed re-dealt — fresh rotation'); }
  else toast('Could not refresh right now');
}
/* gentle auto-rotation, news-app style (backend re-shuffles every 20 min) */
setInterval(async () => {
  if (document.hidden || S.view !== 'home') return;
  const before = FEED_META.bucket;
  await loadFeed(true);
  if (FEED_META.bucket !== before) { refreshCurrent(); toast('Feed rotated — new picks up top'); }
}, 10 * 60 * 1000);

/* ═══════════ MOTION ═══════════ */
const _io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
  es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); _io.unobserve(e.target); } });
}, { threshold: 0.08 }) : null;

/* left/right arrows on every carousel — appear when there is more to see */
function railGlide(rail, dir) {
  const max = rail.scrollWidth - rail.clientWidth;
  const cur = _railTween.get(rail);
  const target = Math.max(0, Math.min(max, (cur ? cur.target : rail.scrollLeft) + dir * rail.clientWidth * 0.7));
  if (window.gsap && !REDUCED) {
    if (cur && cur.tween) cur.tween.kill();
    const tween = gsap.to(rail, { scrollLeft: target, duration: 0.7, ease: 'power3.out', onComplete: () => _railTween.delete(rail) });
    _railTween.set(rail, { target, tween });
  } else rail.scrollTo({ left: target, behavior: 'smooth' });
}
function enhanceRails(root) {
  (root || document).querySelectorAll('.rail').forEach((rail) => {
    const host = rail.parentElement;
    if (!host || host.dataset.arrows) return;
    if (rail.scrollWidth <= rail.clientWidth + 30) return;
    host.dataset.arrows = '1';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const mk = (dir) => {
      const b = document.createElement('button');
      b.className = 'rail-arr ' + (dir < 0 ? 'l' : 'r');
      b.setAttribute('aria-label', dir < 0 ? 'Scroll back' : 'Scroll ahead');
      b.innerHTML = ic(dir < 0 ? 'chev-left' : 'chev-right', 17);
      b.onclick = (e) => { e.stopPropagation(); railGlide(rail, dir); };
      host.appendChild(b);
    };
    mk(-1); mk(1);
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      host.querySelector('.rail-arr.l')?.classList.toggle('off', rail.scrollLeft < 24);
      host.querySelector('.rail-arr.r')?.classList.toggle('off', rail.scrollLeft > max - 24);
    };
    rail.addEventListener('scroll', sync, { passive: true }); sync();
  });
}
let _barWatch = 0;
/* guarantee chart bars end up visible, whatever happened to the animation */
function showBars(root) {
  (root || document).querySelectorAll('svg .pbar').forEach((b) => {
    const m = getComputedStyle(b).transform;
    const collapsed = m && m !== 'none' && Math.abs(parseFloat(m.split(',')[3] || '1')) < 0.9;
    if (!collapsed) return;
    if (window.gsap) gsap.killTweensOf(b);
    b.style.transform = '';
    b.removeAttribute('transform');
  });
}
function animateIn(root) {
  enhanceRails(root);
  // hidden tabs throttle rAF + starve IO — render final state instantly there
  const still = REDUCED || document.hidden || !window.gsap;
  (root || document).querySelectorAll('.rv:not(.in)').forEach((el) => {
    if (still || !_io) el.classList.add('in'); else _io.observe(el);
  });
  (root || document).querySelectorAll('[data-count]').forEach((el) => {
    if (el.dataset.done) return; el.dataset.done = '1';
    const target = parseFloat(el.dataset.count);
    if (still) { el.textContent = fmtIN(target); return; }
    const obj = { v: 0 };
    gsap.to(obj, { v: target, duration: 1.4, ease: 'power3.out', onUpdate: () => { el.textContent = fmtIN(Math.round(obj.v)); } });
  });
  const bars = (root || document).querySelectorAll('svg .pbar');
  if (!still) {
    bars.forEach((b, i) => {
      gsap.fromTo(b, { scaleY: 0 }, { scaleY: 1, duration: .7, delay: Math.min(i * 0.012, .6), ease: 'power3.out' });
    });
    // watchdog: if the tab is throttled mid-tween the bars freeze at scaleY≈0 and the
    // chart reads as empty. Force the end state if anything is still collapsed.
    clearTimeout(_barWatch);
    _barWatch = setTimeout(() => showBars(root), 1800);
  } else {
    showBars(root);          // never leave a chart stuck at its "from" state
  }
  const t = (root || document).querySelector('.h-display:not([data-split])');
  if (t && !still) {
    t.dataset.split = '1';
    const words = t.textContent.split(' ');
    t.innerHTML = words.map((w) => `<span class="lt" style="display:inline-block">${esc(w)}&nbsp;</span>`).join('');
    gsap.fromTo(t.querySelectorAll('.lt'), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .8, stagger: .05, ease: 'power3.out' });
  }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) animateIn(document); });

/* ═══════════ INIT ═══════════ */
/* ═══════════ DASHBOARD — the tracking & applying half of the product ═══════════
   Signed-in only. State model borrowed from Project Vanilla:
   · every application has a status pill, and an AT-RISK overlay with its reason
   · a global state dot (never a number): dark = clear, amber = waiting on you, red = agent problem
   · agent work is a receipt log — queued/running/done/failed — and failures are
     never silently stale: they name what stopped, what was NOT sent, and offer Retry. */

/* ————— notifications ————— */
function notifs() { return ls('scout-notifs') || []; }
function pushNotif(kind, title, body, oppId) {
  const all = notifs();
  all.unshift({ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 6), kind, title: String(title).slice(0, 90), body: String(body || '').slice(0, 220), oppId: oppId || null, ts: Date.now(), read: false });
  ls('scout-notifs', all.slice(0, 60));
  paintStateDot();
  try { if (kind !== 'system' && 'Notification' in window && Notification.permission === 'granted') new Notification('Scout — ' + title, { body: String(body || '').slice(0, 120), icon: '/icon-192.png' }); } catch {}
}
function markNotifsRead() { ls('scout-notifs', notifs().map((n) => ({ ...n, read: true }))); paintStateDot(); }
/* the state dot — Vanilla rule: a colour, never a count */
function stateDotColor() {
  const un = notifs().filter((n) => !n.read);
  if (un.some((n) => n.kind === 'agent')) return 'var(--red)';
  if (un.length || atRiskItems().length) return 'var(--orange)';
  return null;
}
function paintStateDot() {
  const c = stateDotColor();
  document.querySelectorAll('.icbtn[data-ic="bell"] .reddot').forEach((d) => {
    d.style.background = c || 'transparent'; d.style.opacity = c ? 1 : 0;
  });
  const nd = document.getElementById('dn-dot');
  if (nd) { nd.style.background = c || 'var(--ink)'; }
}

/* ————— reminders: "notify me when it opens / before it closes" ————— */
function reminders() { return ls('scout-reminders') || []; }
function hasReminder(oppId) { return reminders().some((r) => r.oppId === String(oppId) && !r.done); }
async function setReminder(oppId, kind) {
  const o = resolveOpp(oppId); if (!o) return;
  let due = null, label = '';
  if (kind === 'opens') {
    const c = o._adm; const t = Date.parse((c && c.window_open) || '');
    due = Number.isNaN(t) ? Date.now() + 7 * 864e5 : t;
    label = 'when the window opens';
  } else {
    due = o.deadline_ts ? o.deadline_ts * 1000 - 3 * 864e5 : Date.now() + 864e5;
    label = '3 days before it closes';
  }
  const all = reminders().filter((r) => !(r.oppId === String(oppId) && r.kind === kind));
  all.push({ id: 'r' + Date.now(), oppId: String(oppId), title: shortTitle(o), kind, due, done: false });
  ls('scout-reminders', all.slice(-80));
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch {}
  toast(`Scout will nudge you ${label}`);
  refreshCurrent();
}
function clearReminder(oppId) { ls('scout-reminders', reminders().filter((r) => r.oppId !== String(oppId))); if (dashLive()) renderDash(S.dashSec); else refreshCurrent(); toast('Reminder removed'); }
function checkReminders() {
  const now = Date.now(); let fired = 0;
  const all = reminders().map((r) => {
    if (!r.done && r.due <= now) {
      pushNotif('reminder', r.title, r.kind === 'opens' ? 'The application window should be open now — go claim it.' : 'Closes in about 3 days. Your draft is waiting.', r.oppId);
      fired++; return { ...r, done: true };
    }
    return r;
  });
  if (fired) ls('scout-reminders', all);
}
function remindBtnHTML(oppId, kind) {
  if (!signedIn()) return '';
  const on = hasReminder(oppId);
  return `<button class="tool ${on ? 'tool-on' : ''}" onclick="event.stopPropagation();${on ? `clearReminder('${oppId}')` : `setReminder('${oppId}','${kind}')`}">${ic('bell', 14)} ${on ? 'Reminder set ✓' : (kind === 'opens' ? 'Notify me when it opens' : 'Remind me before it closes')}</button>`;
}

/* ————— agent receipt log (Vanilla: pending/running/done/failed, never silent) ————— */
function agentLog() { return ls('scout-agentlog') || []; }
function logAgent(id, patch) {
  let all = agentLog();
  const i = all.findIndex((x) => x.id === id);
  if (i >= 0) all[i] = { ...all[i], ...patch, updatedAt: Date.now() };
  else all.unshift({ id, status: 'queued', ts: Date.now(), updatedAt: Date.now(), ...patch });
  ls('scout-agentlog', all.slice(0, 40));
  if (patch.status === 'failed') pushNotif('agent', patch.label || 'Scout hit a snag', (patch.detail || 'The draft was not changed.') + ' Nothing was sent anywhere. Retry from the dashboard.', patch.oppId);
  const el = document.getElementById('dash-body');
  // Today and Tracking both surface failed jobs now, so they repaint too
  if (el && dashLive() && ['today', 'tracking'].includes(S.dashSec)) renderDash(S.dashSec);
}
function retryAgentJob(id) {
  const job = agentLog().find((x) => x.id === id);
  if (!job || !job.oppId) return;
  toast('Retrying…');
  draftMany([job.oppId]);
}

/* ————— at-risk: deadline near + no meaningful draft (with the reason attached) ————— */
function atRiskItems() { return riskItems().filter((r) => r._sev <= 1); }

/* ————— the screen ————— */
/* Three sections, not six. Paths iterated the same S.pipe as Tracking and read
   o.days_left, which snapOf never stores — it silently dropped the deadline for
   exactly the rotated-out items most likely to be at risk. Notifications was a
   second view of inputs todayAgenda already ingests. Scout AI is a dock on every
   other view; being a tab was the only reason .agent-shell had to be relocated
   between #vw-agent and #dash-body. All three redirect via DASH_ALIAS. */
const DASH_SECTIONS = [
  ['today', 'Today', 'spark'],
  ['board', 'Board', 'grid'],
  ['tracking', 'Tracking', 'view'],
  ['details', 'Your details', 'doc'],
];
/* A returning user's S.dashSec may name a section we merged away. */
const DASH_ALIAS = { queue: 'tracking', saved: 'tracking', progress: 'today', dossier: 'details', paths: 'tracking', notifications: 'today', chat: 'today' };
const DASH_ALIAS_FILTER = { queue: 'live', saved: 'saved' };
const TRACK_FILTERS = [
  ['live', 'Live', (p, d) => ['saved', 'draft'].includes(p.stage) && (d == null || d >= 0)],
  ['ready', 'Ready to send', (p) => ['saved', 'draft'].includes(p.stage) && (p.pct || 0) >= 75],
  ['drafting', 'Drafting', (p) => p.stage === 'draft'],
  ['saved', 'Saved', (p) => p.stage === 'saved'],
  ['applied', 'Sent', (p) => p.stage === 'applied' || p.stage === 'result'],
  ['closed', 'Closed / missed', (p, d) => d != null && d < 0 && !['applied', 'result'].includes(p.stage)],
  ['all', 'Everything', () => true],
];
function openDash(sec) {
  const want = sec || S.dashSec || 'today';
  S.dashSec = DASH_ALIAS[want] || want;
  show('dash');
  renderDash(S.dashSec, DASH_ALIAS_FILTER[want]);
}
/* Leave the dashboard for the real Profile route in one paint — closeDash()
   sends you via Home, which flashes the feed on the way. */
function goProfile(anchor) {
  const shell = document.querySelector('#dash-body .agent-shell');
  if (shell) document.getElementById('vw-agent').appendChild(shell);
  show('main');
  goV('profile', anchor ? { scrollTo: anchor } : undefined);
}
function closeDash() {
  // put the chat shell back where the main app expects it
  const shell = document.querySelector('#dash-body .agent-shell');
  if (shell) document.getElementById('vw-agent').appendChild(shell);
  show('main');
  goV('home');
}
function dashBadge(v) {
  if (v === 'today') { const n = todayAgenda().length; return n ? { n, hot: riskItems().some((r) => r._sev <= 1) } : null; }
  if (v === 'tracking') { const n = riskItems().length; return n ? { n, hot: true } : null; }
  if (v === 'details') { const mc = masterCompleteness(); return mc.pct < 60 ? { n: mc.pct + '%', hot: false } : null; }
  return null;
}
function renderDashNav() {
  const nav = document.getElementById('dash-nav');
  const nm = (S.user && S.user.name) || 'You';
  const ini = (nm[0] || 'S').toUpperCase();
  const mc = masterCompleteness();
  const chip = (cls) => DASH_SECTIONS.map(([v, t, icn]) => {
    const b = dashBadge(v);
    return `<button class="${cls} ${S.dashSec === v ? 'on' : ''}" onclick="renderDash('${v}')">${ic(icn, cls === 'dn-it' ? 16 : 14)}<span>${t}</span>${b ? `<em class="${b.hot ? 'hot' : ''}">${b.n}</em>` : ''}</button>`;
  }).join('');
  nav.innerHTML = `
    <div class="dn-brand" onclick="closeDash()">${heartSVG()}<b>Scout</b><span class="dn-dot" id="dn-dot"></span></div>
    <div class="dn-secs">${chip('dn-it')}</div>
    <button class="dn-me" onclick="goProfile()">
      <span class="as-av" style="background:${PASTELS[ini.charCodeAt(0) % PASTELS.length]}">${ini}</span>
      <span class="as-mt"><b>${esc(nm.split(' ')[0])}</b><i id="dn-ready">${mc.pct}% ready</i></span>
    </button>`;
  // the rail is display:none under 900px — mobile gets the same sections as a chip strip
  const sw = document.getElementById('dash-switch');
  if (sw) {
    sw.innerHTML = chip('dsw-it');
    hydrateIcons(sw);
    const on = sw.querySelector('.dsw-it.on');
    if (on) on.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
  }
  hydrateIcons(nav);
  paintStateDot();
}
function renderDash(sec, filter) {
  const want = sec || 'today';
  sec = DASH_ALIAS[want] || want;
  if (filter) S.trackFilter = filter;
  else if (DASH_ALIAS_FILTER[want]) S.trackFilter = DASH_ALIAS_FILTER[want];
  S.dashSec = sec;
  renderDashNav();
  const el = document.getElementById('dash-body');
  const boardEl = document.getElementById('vw-board');
  const meta = DASH_SECTIONS.find(([v]) => v === sec) || [];
  document.getElementById('dash-crumb').innerHTML = `<span>Dashboard</span><em>/</em><b>${meta[1] || sec}</b>`;
  // The board is a persistent React island — shown/hidden, never regenerated,
  // so its camera/selection/undo survive section switches.
  if (sec === 'board') {
    el.style.display = 'none'; boardEl.style.display = 'block'; ensureBoard(boardEl); renderDashNav();
    // the board mounted (or was hidden) while display:none — tell it to re-measure
    // its nodes now that the pane is visible, so persisted edges route correctly.
    requestAnimationFrame(() => window.dispatchEvent(new CustomEvent('scout:board-shown')));
    return;
  }
  el.style.display = ''; if (boardEl) boardEl.style.display = 'none';
  // The chat shell lives in #vw-agent permanently now. Nothing relocates it.
  const stray = document.querySelector('#dash-body .agent-shell');
  if (stray) document.getElementById('vw-agent').appendChild(stray);
  if (sec === 'today') el.innerHTML = demoBanner() + dashToday();
  else if (sec === 'tracking') el.innerHTML = demoBanner() + dashTracking();
  else if (sec === 'details') el.innerHTML = demoBanner() + dashDetails();
  else el.innerHTML = demoBanner() + dashToday();
  hydrateIcons(el);
  animateIn(el);
  el.scrollTop = 0;
}

/* ————— empty states —————
   Name what will appear, say why it matters, give exactly one action. Every CTA
   routes somewhere real: an empty section that only apologises is a dead end. */
function emptyState(o) {
  return `<div class="empty e-rich">
    ${o.icon ? `<span class="e-ic">${ic(o.icon, 20)}</span>` : ''}
    <div class="h">${o.title}</div>
    <div class="s">${o.body}</div>
    ${o.cta ? `<div class="e-acts">
      <button class="pill pill-dark" onclick="${o.onclick}">${o.cta}</button>
      ${o.secondary ? `<button class="pill pill-ghost" onclick="${o.secondaryClick}">${o.secondary}</button>` : ''}
    </div>` : ''}
    ${o.ghost ? `<div class="e-ghost" aria-hidden="true">${ghostRows(o.ghost, 3)}</div>` : ''}
  </div>`;
}
/* Dimmed skeletons in the REAL row classes — the shape of what will appear.
   Markup only: never touches S.pipe, so nothing can reach pipeCounts() or riskItems(). */
function ghostRows(kind, n) {
  let out = '';
  for (let i = 0; i < (n || 3); i++) {
    if (kind === 'path') out += `<div class="path-row"><span class="pr-img sm"></span><div class="pr-m"><b class="gh gh-t"></b><i class="gh gh-s"></i></div><div class="pr-steps"><span class="gh gh-p"></span><span class="gh gh-p"></span><span class="gh gh-p"></span></div></div>`;
    else if (kind === 'tt') out += `<div class="tt-row"><span class="gh gh-pill"></span><span class="gh gh-t"></span><span class="gh gh-s"></span><span></span><span class="gh gh-s"></span><span></span></div>`;
    else out += `<div class="nf-row"><span class="nf-ic gh gh-c"></span><div class="nf-m"><b class="gh gh-t"></b><i class="gh gh-s"></i></div></div>`;
  }
  return out;
}
const DASH_EMPTY = {
  today: { icon: 'spark', title: 'Nothing tracked yet',
    body: 'Save an opportunity or an admission and this becomes your daily to-do — what closes when, what is half-drafted, and what needs you next.',
    cta: 'Show me what fits me', onclick: "closeDash();goV('home')",
    secondary: 'Browse admissions', secondaryClick: "closeDash();goV('admissions')" },
  paths: { icon: 'compass', title: 'No paths yet', ghost: 'path',
    body: 'Save an opportunity or an admission and it becomes a tracked path here — every milestone from first draft to result.',
    cta: 'Find something worth pursuing', onclick: "closeDash();goV('discover')",
    secondary: 'Browse admissions', secondaryClick: "closeDash();goV('admissions')" },
  tracking: { icon: 'grid', title: 'Nothing tracked yet', ghost: 'tt',
    body: 'Every opportunity you save lands here with its stage, deadline and how far the draft has got. It is the ledger Scout keeps so you never lose one.',
    cta: 'Go find your first', onclick: "closeDash();goV('discover')",
    secondary: 'See what closes this week', secondaryClick: "closeDash();goV('discover',{sort:'closing'})" },
  details: { icon: 'doc', title: 'Nothing filled in yet',
    body: 'Answer these once and Scout fills them into every application — and into the browser extension. Start with your name and Class 12 marks; a marksheet upload fills most of the rest for you.',
    cta: 'Start with personal details', onclick: "S.dosOpen='personal';renderDash('details')",
    secondary: 'Upload a marksheet instead', secondaryClick: "renderDash('details')" },
  notifications: { icon: 'check', title: 'All quiet', ghost: 'nf',
    body: 'Deadline reminders, Scout\'s receipts and anything that needs you will land here. Interruptions stay rare on purpose.',
    cta: 'Set a reminder on something', onclick: "closeDash();goV('discover')" },
};
function dashEmpty(k) { return emptyState(DASH_EMPTY[k]); }

/* ————— demo mode —————
   Real listings from the live feed, staged into a pipeline so the dashboard can be
   SEEN populated. Deliberately in-memory only: never written to scout-pipe, so a
   reload wipes it and it can't reach the recommender, real counts, or a backup. */
function seedDemo() {
  if (!DATA.length) return toast('Feed still loading — try again in a moment');
  S._realPipe = S.pipe;
  const pick = DATA.filter((o) => o.deadline_ts).sort((a, b) => (a.deadline_ts || 0) - (b.deadline_ts || 0));
  const near = pick.filter((o) => { const d = Math.ceil((o.deadline_ts * 1000 - Date.now()) / 864e5); return d >= 0 && d <= 30; });
  const use = (near.length >= 6 ? near : pick).slice(0, 8);
  if (!use.length) return toast('No dated listings in the feed right now');
  const DAY = 864e5, plan = [
    { stage: 'draft', pct: 82 }, { stage: 'draft', pct: 15 }, { stage: 'saved', pct: 0 },
    { stage: 'applied', pct: 100, ts: Date.now() - 26 * DAY }, { stage: 'saved', pct: 0 },
    { stage: 'result', pct: 100, outcome: 'won', ts: Date.now() - 40 * DAY },
    { stage: 'draft', pct: 55 }, { stage: 'applied', pct: 100, ts: Date.now() - 5 * DAY },
  ];
  const pipe = {};
  use.forEach((o, i) => {
    const q = plan[i % plan.length];
    pipe[String(o.id)] = { id: String(o.id), snap: snapOf(o), ts: q.ts || Date.now() - i * 2 * DAY, _demo: true, ...q };
  });
  S.pipe = pipe;
  S.demo = true;
  invalidateUV();
  toast('Demo data loaded — nothing was saved to this device');
  openDash('today');
}
function clearDemo() {
  if (S._realPipe) S.pipe = S._realPipe;
  ls('scout-pipe', S.pipe);           // rewrite disk in case a save landed while demo was on
  S._realPipe = null; S.demo = false;
  invalidateUV();
  toast('Demo data cleared');
  renderDash(S.dashSec);
}
function demoBanner() {
  return S.demo ? `<div class="demo-bar">${ic('spark', 14)}
    <div><b>Demo data</b><i>Sample pipeline built from real live listings. Nothing is saved — reload and it is gone.</i></div>
    <button class="pill pill-ghost pill-sm" onclick="clearDemo()">Clear demo data</button></div>` : '';
}

/* ————— Today: the one section that answers "what do I do next" —————
   NOTE ON ESCAPING: titles and reasons are escaped HERE, at source, and
   interpolated raw below — because masterNudge()[2] is an onclick string that
   must NOT be escaped. Any new agenda source must call esc() itself. */
/* The agenda, ranked by CONSEQUENCE — not by source order.
   The old version pushed failed agent jobs first simply because that loop ran
   first, so two scraper failures outranked a draft closing tonight. Every item
   now carries an explicit urgency, everything is sorted once, then sliced.

   Agent failures sit at 4: the user believes work happened that did not, which
   is worse than a soft deadline and not worse than an irreversible one.

   ESCAPING: titles and reasons are escaped HERE, at source, and interpolated raw
   below — because masterNudge()[2] is an onclick string that must NOT be escaped.
   Any new agenda source must call esc() itself. */
const AGENDA_BUCKETS = [
  [0, 'Closing now'], [1, 'Closing now'], [2, 'Closing now'],
  [3, 'Needs a decision'], [4, 'Needs a decision'], [5, 'Needs a decision'],
  [6, 'Waiting on them'],
  [7, 'When you have a minute'], [8, 'When you have a minute'],
];
function todayAgenda() {
  const out = [];
  const push = (u, o) => out.push({ u, ...o });

  for (const r of riskItems()) {
    const t = esc(shortTitle(r.snap)), why = esc(r._risk);
    if (r._sev === 3) continue;                       // shown separately, never at the top
    if (r._sev === 0 && r._d === 0) push(0, { kind: 'risk', icon: 'clock', title: t, why, cta: (r.pct || 0) >= 75 ? 'Review & send' : 'Work on it', onclick: `closeDash();startApply('${r.id}')` });
    else if (r._sev === 0) push(2, { kind: 'risk', icon: 'clock', title: t, why, cta: (r.pct || 0) >= 75 ? 'Review & send' : 'Work on it', onclick: `closeDash();startApply('${r.id}')` });
    else if (r._sev === 1) push(5, { kind: 'risk', icon: 'clock', title: t, why, cta: 'Work on it', onclick: `closeDash();startApply('${r.id}')` });
    else if (r._sev === 2) push(7, { kind: 'risk', icon: 'clock', title: t, why, cta: 'Start it', onclick: `closeDash();startApply('${r.id}')` });
  }
  for (const r of reminders().filter((x) => !x.done && x.due <= Date.now() + 2 * 864e5).slice(0, 3))
    push(3, { kind: 'remind', icon: 'bell', title: esc(r.title || 'Reminder'),
      why: r.kind === 'opens' ? 'the window opens' : 'deadline nudge',
      cta: 'Open', onclick: `closeDash();openDetail('${r.oppId}')` });
  for (const j of agentLog().filter((x) => x.status === 'failed').slice(0, 2))
    push(4, { kind: 'fail', icon: 'zap', title: esc(j.label || 'A Scout job failed'),
      why: esc((j.detail || '') + ' Nothing was sent.'),
      cta: j.oppId ? 'Retry' : null, onclick: j.oppId ? `retryAgentJob('${j.id}')` : '' });
  for (const p of Object.values(S.pipe || {}).filter((x) => x.snap && x.stage === 'applied' && (Date.now() - (x.appliedAt || x.ts || 0)) > 21 * 864e5).slice(0, 3)) {
    const sentAt = p.appliedAt || p.ts, n = sentAt ? Math.floor((Date.now() - sentAt) / 864e5) : null;
    push(6, { kind: 'stale', icon: 'check', title: esc(shortTitle(p.snap)),
      why: n ? `sent ${n} days ago — did you hear back?` : 'sent a while ago — did you hear back?',
      cta: 'Log the result', onclick: `askOutcome('${p.id}')` });
  }
  const nudge = masterNudge();
  if (nudge) push(8, { kind: 'details', icon: 'user', title: esc(nudge[0]), why: esc(nudge[1]), cta: 'Do it', onclick: nudge[2] });

  out.sort((a, b) => a.u - b.u);
  return out.slice(0, 5);
}
/* Severity 3 is unrecoverable, so it is never urgent — but it is the exact
   failure Scout exists to prevent, so burying it teaches nothing. One row,
   dismissible, at the bottom. */
function missedItem() {
  const dismissed = ls('scout-missed-seen') || [];
  return riskItems().find((r) => r._sev === 3 && !dismissed.includes(r.id)) || null;
}
function dismissMissed(id) {
  const d = ls('scout-missed-seen') || []; d.push(id);
  ls('scout-missed-seen', d.slice(-50));
  renderDash('today');
}
function dashToday() {
  const nm = ((S.user && S.user.name) || 'there').split(' ')[0];
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const agenda = todayAgenda();
  const missed = missedItem();
  const c = pipeCounts();
  const all = Object.values(S.pipe).filter((p) => p.snap);
  const sent = c.applied + c.result;
  const tracked = c.saved + c.draft + sent;
  const upcoming = reminders().filter((r) => !r.done && r.due > Date.now() + 2 * 864e5).sort((a, b) => a.due - b.due);

  // No statistic renders below n=3. "0% follow-through" over one save is noise.
  const STATS_FLOOR = 3;
  const showStats = tracked >= STATS_FLOOR;
  const slipped = all.filter((p) => ['saved', 'draft'].includes(p.stage) && pipeDays(p) != null && pipeDays(p) < 0).length;
  const hours = all.filter((p) => p.stage !== 'saved').reduce((n, p) => n + (EFFORT_HOURS[p.snap.type] || 8), 0);
  const stake = all.filter((p) => ['applied', 'result'].includes(p.stage)).reduce((n, p) => n + (p.snap.prize_cash || 0), 0);

  const tile = (v, l, sub, f) => `<button class="td-tile" onclick="renderDash('tracking','${f}')"><b>${v}</b><span>${l}</span><i>${sub}</i></button>`;
  // Only severity 0 gets --red. Colour is never the only channel — each row also
  // carries its bucket heading and a rule weight.
  const sevCls = (a) => a.u === 0 ? 'sev-hot' : a.u <= 2 ? 'sev-warm' : a.kind === 'fail' ? 'sev-fail' : '';

  let agendaHTML = '';
  if (agenda.length) {
    let lastBucket = null;
    agendaHTML = '<div class="td-list">' + agenda.map((a) => {
      const bucket = (AGENDA_BUCKETS.find(([u]) => u === a.u) || [, ''])[1];
      const head = bucket !== lastBucket ? `<div class="td-bucket">${bucket}</div>` : '';
      lastBucket = bucket;
      return `${head}<div class="td-row ${sevCls(a)}">
        <span class="td-ic">${ic(a.icon, 15)}</span>
        <div class="td-m"><b>${a.title}</b><i>${a.why}</i></div>
        ${a.cta ? `<button class="pill pill-dark pill-sm" onclick="${a.onclick}">${a.cta}</button>` : ''}
      </div>`;
    }).join('') + '</div>';
  }

  return `<h2 class="dash-h">${greet}, ${esc(nm)}.</h2>
    <p class="dash-sub">${agenda.length
      ? `${agenda.length} ${agenda.length === 1 ? 'thing needs' : 'things need'} you today.`
      : tracked ? 'Nothing is at risk. This is what on-top-of-it looks like.' : 'Everything you track will show up here.'}</p>
    ${agendaHTML}
    ${!agenda.length && tracked ? `<div class="td-clear">${ic('check', 22)}<div><b>You are clear.</b><i>Nothing closing, nothing stalled, nothing waiting on you.</i></div>
      <button class="pill pill-ghost" onclick="closeDash();goV('discover')">Find something new</button></div>` : ''}
    ${!tracked ? dashEmpty('today') : ''}
    ${showStats ? `<div class="td-tiles">
      ${tile(sent, 'actually sent', `${Math.round(sent / tracked * 100)}% follow-through`, 'applied')}
      ${tile(c.draft, 'in draft', c.draft ? 'pick one up' : 'nothing half-finished', 'drafting')}
      ${tile(slipped, 'slipped past', slipped ? 'closed before you sent' : 'none missed', 'closed')}
      ${tile('₹' + shortIN(stake), 'riding on it', `${hours} hrs invested`, 'applied')}
    </div>
    <div class="td-heat"><div class="q-grp">Next 21 days</div>
      <div class="heat-strip" role="img" aria-label="${(() => {
        const n = all.filter((p) => { const d = pipeDays(p); return d != null && d >= 0 && d <= 21; }).length;
        return n ? `${n} ${n === 1 ? 'deadline' : 'deadlines'} in the next 21 days` : 'No deadlines in the next 21 days';
      })()}">${(() => {
        const days = [];
        for (let i = 0; i < 21; i++) {
          const n = all.filter((p) => pipeDays(p) === i).length;
          days.push(`<span class="hd ${n ? 'has' : ''} ${n > 1 ? 'many' : ''}" title="${i === 0 ? 'today' : 'in ' + i + ' days'}: ${n} closing"></span>`);
        }
        return days.join('');
      })()}</div></div>` : ''}
    ${upcoming.length ? `<details class="td-later"><summary>Coming up <em>${upcoming.length}</em></summary>
      ${upcoming.slice(0, 8).map((r) => `<div class="nf-row up"><span class="nf-ic">${ic('bell', 14)}</span>
        <div class="nf-m"><b>${esc(r.title)}</b><i>${r.kind === 'opens' ? 'window opens' : 'deadline nudge'} · ${new Date(r.due).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</i></div>
        <button class="icbtn" data-ic="x" onclick="clearReminder('${r.oppId}')" aria-label="Remove reminder"></button></div>`).join('')}</details>` : ''}
    ${missed ? `<div class="td-missed"><span>${ic('x', 14)}</span>
      <div><b>${esc(shortTitle(missed.snap))}</b><i>${esc(missed._risk)}</i></div>
      <button class="pill pill-ghost pill-sm" onclick="closeDash();goV('discover')">Find the next cycle</button>
      <button class="icbtn" data-ic="x" onclick="dismissMissed('${missed.id}')" aria-label="Dismiss"></button></div>` : ''}
    ${!tracked && !S.demo ? `<div class="td-demo">${ic('spark', 15)}
      <div><b>Want to see this full?</b><i>Load a sample pipeline built from real live listings — nothing is saved to this device.</i></div>
      <button class="pill pill-ghost pill-sm" onclick="seedDemo()">Preview with sample data</button></div>` : ''}`;
}

/* Paths — every live pursuit as a milestone journey (admissions get their real path) */
function pathSteps(p) {
  const o = pipeOpp(p);
  if (o && o.type === 'Admission' && o._adm) {
    const c = o._adm;
    return [
      { t: 'Window', done: true, now: c.open_now },
      { t: (c.exam || 'Review').split('(')[0].trim().slice(0, 14), done: false, now: false },
      { t: 'Result', done: false },
    ];
  }
  const order = ['saved', 'draft', 'applied', 'result'];
  const i = order.indexOf(p.stage);
  return [
    { t: 'Draft', done: i >= 1, now: i === 1 },
    { t: 'Apply', done: i >= 2, now: i === 2 },
    { t: 'Result', done: i >= 3, now: i === 3 },
  ];
}
/* Tracking — the full ledger with Vanilla status discipline */
function dashTracking() {
  const all = Object.values(S.pipe).filter((p) => p.snap);
  const log = agentLog().slice(0, 6);
  const logHTML = log.length ? `<div class="dt-log"><div class="dtl-h">${ic('zap', 13)} Scout's recent work</div>${log.map((j) => `
      <div class="dtl-row"><span class="dtl-st ${j.status}">${j.status === 'running' ? '<i class="spin2"></i>' : j.status === 'failed' ? '✕' : j.status === 'done' ? '✓' : '·'}</span>
      <span class="dtl-t">${esc(j.label || j.kind || 'job')}</span><i>${new Date(j.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</i>
      ${j.status === 'failed' && j.oppId ? `<button class="pill pill-ghost pill-sm" onclick="retryAgentJob('${j.id}')">Retry</button>` : ''}</div>`).join('')}</div>` : '';
  // the agent log can be non-empty while the pipeline is empty, so it sits outside the guard
  if (!all.length) return `<h2 class="dash-h">Tracking</h2>${logHTML}${dashEmpty('tracking')}`;

  const f = TRACK_FILTERS.find(([k]) => k === S.trackFilter) || TRACK_FILTERS[0];
  const rows = all.filter((p) => f[2](p, pipeDays(p))).sort((a, b) => {
    const da = pipeDays(a), db = pipeDays(b);
    return (da == null ? 9e9 : da) - (db == null ? 9e9 : db);
  });
  const risks = new Map(riskItems().map((r) => [r.id, r._risk]));
  const GROUPS = [['This week', (d) => d != null && d >= 0 && d <= 7], ['Next three weeks', (d) => d != null && d > 7 && d <= 21],
    ['Later', (d) => d == null || d > 21], ['Closed', (d) => d != null && d < 0]];

  const row = (p) => {
    const o = pipeOpp(p); if (!o) return '';
    const stg = STAGES.find((x) => x.v === p.stage) || STAGES[0];
    const d = pipeDays(p), heat = deadlineHeat(d), risk = risks.get(p.id);
    const kept = DATA.length && !DATA.some((x) => String(x.id) === p.id);   // listing rotated out of the live feed
    return `<div class="tt-row" onclick="closeDash();${o.type === 'Admission' ? `goV('admissions',{open:'${p.id}'})` : `openDetail('${p.id}')`}">
      <span class="stage-pill" style="--sc:${stg.col}">${stg.t}</span>
      <span class="tt-t">${esc(shortTitle(o))}${kept ? '<em class="tt-kept" title="No longer in the live feed — Scout kept your copy">kept</em>' : ''}</span>
      <span class="tt-pct">${p.pct ? `<i class="ttp-bar"><b style="width:${p.pct}%"></b></i>${p.pct}%` : ''}</span>
      <span class="tt-risk">${risk ? `<em>${esc(risk)}</em>` : `<span class="tt-heat ${heat.cls}">${heat.t}</span>`}</span>
      <span class="tt-ts">${new Date(p.ts || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      <span class="tt-act" onclick="event.stopPropagation()">${p.stage === 'applied'
        ? `<button class="pill pill-dark pill-sm" onclick="askOutcome('${p.id}')">Log result</button>`
        : `<button class="pill pill-ghost pill-sm" onclick="closeDash();startApply('${p.id}')">${p.stage === 'saved' ? 'Start' : p.stage === 'draft' ? 'Continue' : 'Open'}</button>`}</span>
    </div>`;
  };
  const ready = rows.filter((p) => ['saved', 'draft'].includes(p.stage) && (p.pct || 0) < 75);
  return `<h2 class="dash-h">Tracking</h2>
    <p class="dash-sub">${all.length} tracked · ${risks.size ? `<b style="color:var(--red)">${risks.size} need${risks.size === 1 ? 's' : ''} you</b>` : 'nothing at risk'} · every state change is kept</p>
    <div class="tk-chips">${TRACK_FILTERS.map(([k, t, fn]) => {
      const n = all.filter((p) => fn(p, pipeDays(p))).length;
      return `<button class="chip ${S.trackFilter === k ? 'on' : ''}" onclick="renderDash('tracking','${k}')">${t}${n ? ` <em>${n}</em>` : ''}</button>`;
    }).join('')}</div>
    ${logHTML}
    ${AI_ENABLED && ready.length > 1 ? `<button class="pill pill-dark" style="margin:0 0 16px" onclick="draftMany([${ready.slice(0, 5).map((p) => `'${p.id}'`).join(',')}])">${ic('zap', 14)} Draft the next ${Math.min(ready.length, 5)} in the background</button>` : ''}
    ${rows.length ? GROUPS.map(([t, test]) => {
      const g = rows.filter((p) => test(pipeDays(p)));
      return g.length ? `<div class="q-grp">${t} <em>${g.length}</em></div><div class="track-table">${g.map(row).join('')}</div>` : '';
    }).join('') : `<div class="empty"><div class="h">Nothing in “${esc(f[1])}”</div><div class="s">Try another filter — everything you track is still here.</div></div>`}`;
}
/* pct is a weighted blend and rounds to 0 while fields are genuinely filled,
   so "is it empty" must ask the underlying data, never masterCompleteness(). */
function dossierBlank() {
  return !MASTER_SECTIONS.some((sec) => sec.fields.some((f) => String(S.master[f[0]] || '').trim()))
      && !ESSAY_BANK.some(([k]) => String(S.master[k] || '').trim())
      && !Object.keys(S.docsIdx || {}).length;
}
/* Value changes PATCH in place. Never re-render from a keystroke — repainting
   #dash-body while a field is focused drops the caret mid-sentence. */
function setMasterInline(el, f) {
  setMaster(f, el.value);
  const w = el.closest('.dosf');
  if (w) { w.classList.add('saved'); clearTimeout(w._sv); w._sv = setTimeout(() => w.classList.remove('saved'), 1200); }
  const mc = masterCompleteness();
  const bar = document.querySelector('#dos-mc i'); if (bar) bar.style.width = mc.pct + '%';
  const lbl = document.getElementById('dos-mc-l'); if (lbl) lbl.textContent = mc.pct + '% complete';
  const rdy = document.getElementById('dn-ready'); if (rdy) rdy.textContent = mc.pct + '% ready';
  const cnt = document.querySelector(`.dos-chip[data-sec="${S.dosOpen}"] em`);
  const sec = MASTER_SECTIONS.find((x) => x.id === S.dosOpen);
  if (cnt && sec) cnt.textContent = sec.fields.filter((x) => String(S.master[x[0]] || '').trim()).length + '/' + sec.fields.length;
}
/* Uploads and AI extraction land wherever the user is actually looking. */
function refreshDossier() {
  if (dashLive()) { if (S.dashSec === 'details') renderDash('details'); else renderDashNav(); return; }
  if (S.view === 'profile') renderProfile();
}
function dashDetails() {
  const mc = masterCompleteness();
  const nudge = masterNudge();
  const docs = Object.entries(S.docsIdx || {});
  if (dossierBlank()) return `<h2 class="dash-h">Your details</h2>${dashEmpty('details')}`;
  const open = MASTER_SECTIONS.find((x) => x.id === S.dosOpen) || MASTER_SECTIONS[0];
  return `<h2 class="dash-h">Your details</h2>
    <p class="dash-sub">Everything Scout knows and files on your behalf. Edit anything here — it saves as you go.</p>
    <div class="dos-mc"><div class="mc-bar" id="dos-mc"><i style="width:${mc.pct}%"></i></div>
      <span id="dos-mc-l">${mc.pct}% complete</span></div>
    ${nudge ? `<div class="dos-nudge"><span>${ic('spark', 15)}</span><div><b>${esc(nudge[0])}</b><i>${esc(nudge[1])}</i></div>
      <button class="pill pill-dark pill-sm" onclick="closeDash();${nudge[2]}">Do it</button></div>` : ''}
    <div class="dos-chips">${MASTER_SECTIONS.map((sec) => {
      const filled = sec.fields.filter((f) => String(S.master[f[0]] || '').trim()).length;
      return `<button class="dos-chip ${S.dosOpen === sec.id ? 'on' : ''}" data-sec="${sec.id}" onclick="S.dosOpen='${sec.id}';renderDash('details')">${ic(sec.icn, 14)}${sec.t}<em>${filled}/${sec.fields.length}</em></button>`;
    }).join('')}</div>
    <div class="dos-fields">${open.fields.map(([f, lab, type, opts]) => `
      <label class="dosf ${String(S.master[f] || '').trim() ? 'has' : ''}"><span>${lab}</span>
        ${type === 'select'
          ? `<select onchange="setMasterInline(this,'${f}')">${(opts || []).map((o) => `<option value="${esc(o)}" ${S.master[f] === o ? 'selected' : ''}>${esc(o) || '—'}</option>`).join('')}</select>`
          : `<input type="${type}" value="${esc(S.master[f] || '')}" onchange="setMasterInline(this,'${f}')">`}
        <i class="dosf-ok">${ic('check', 12)}</i>
      </label>`).join('')}</div>
    <div class="psec" id="ps-essays"><h3>Essay bank</h3>
      <p class="psec-sub">Write (or draft) each once — Scout adapts them per application instead of starting from zero.</p>
      ${ESSAY_BANK.map(([k, lab, max, hint]) => `<div class="ap-q">
        <div class="ap-qh"><span class="ap-ql">${lab}</span>
          ${AI_ENABLED ? `<button class="pill pill-ghost pill-sm" id="es-${k}" onclick="draftEssay('${k}',${max})">${ic('spark', 12)} Draft with Scout</button>` : ''}
        </div>
        <div class="ap-hint">${hint}</div>
        <textarea id="ma-${k}" maxlength="${max}" placeholder="Your words beat perfect words…" onchange="setMaster('${k}',this.value)" oninput="this.nextElementSibling.textContent=this.value.length+' / ${max}'">${esc(S.master[k] || '')}</textarea>
        <div class="ap-count">${String(S.master[k] || '').length} / ${max}</div>
      </div>`).join('')}
    </div>

    <div class="psec" id="ps-docs"><h3>Documents</h3>
      <p class="psec-sub">Uploaded once, auto-fitted to what each form demands (size, format, dimensions), and kept in this browser only — nothing is uploaded anywhere. Marksheets are read by Scout to fill your academics.</p>
      <div class="doc-grid">${[...Object.keys(DOC_LABELS), ...Object.keys(S.docsIdx || {}).filter((s) => /^cert-/.test(s))].map((slot) => { const have = (S.docsIdx || {})[slot]; return `
        <div class="doc-cell ${have ? 'have' : ''}" id="doc-${slot}">
          <div class="dc-top">${ic(have ? 'check' : 'upload', 16)}<b>${esc(docLabel(slot))}</b></div>
          <i class="dc-spec">${have && have.summary ? esc(have.summary.slice(0, 80)) : docSpec(slot).label}</i>
          ${have ? `<i class="dc-meta">${esc(have.name).slice(0, 26)} · ${Math.round((have.bytes || 0) / 1024)}KB</i>
            <div class="dc-acts"><button onclick="downloadDoc('${slot}')">${ic('download', 13)}</button><label class="dc-re">${ic('refresh', 13)}<input type="file" accept="image/*,.pdf" hidden onchange="uploadDoc('${slot}',this)"></label><button onclick="deleteDoc('${slot}')">${ic('x', 13)}</button></div>`
          : `<label class="dc-up">${ic('plus', 14)} Upload<input type="file" accept="image/*,.pdf" hidden onchange="uploadDoc('${slot}',this)"></label>`}
        </div>`; }).join('')}
        <label class="doc-cell add-cert">
          <div class="dc-top">${ic('plus', 16)}<b>Add a certificate</b></div>
          <i class="dc-spec">Awards, NCC/NSS, sports, languages, anything — Scout reads, classifies and uses it</i>
          <input type="file" accept="image/*,.pdf" hidden onchange="addCert(this)">
        </label></div>
    </div>

    ${linksPanelHTML()}
    <button class="dos-card solo" onclick="goProfile('#ps-acct')">${ic('shield', 16)}<b>Your data</b><i>Everything here lives in this browser · back up or restore</i><span class="dos-go">${ic('arrow-right', 13)}</span></button>
    ${docs.length ? `<div class="q-grp" style="margin-top:26px">What your documents prove</div>
      <div class="dos-docs">${docs.filter(([, d]) => d.summary).map(([slot, d]) => `<div class="dosd"><b>${esc(d.kind || docLabel(slot))}</b><i>${esc(d.summary)}</i></div>`).join('') || '<div class="dash-sub">Upload marksheets &amp; certificates — Scout reads them and files what they prove.</div>'}</div>` : ''}`;
}
/* Scout AI — the Claude-suite layout, powered by the existing agent (moved, not cloned) */

function show(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id)); }
function migrate() {
  // carry over timshel-era localStorage
  const map = { 'opp-user': 'scout-user', 'opp-profile': 'scout-profile', 'opp-saved': 'scout-saved', 'opp-streak': 'scout-streak', 'opp-whatsapp': 'scout-whatsapp' };
  for (const [oldK, newK] of Object.entries(map)) {
    try { const v = localStorage.getItem(oldK); if (v && !localStorage.getItem(newK)) localStorage.setItem(newK, v); } catch {}
  }
}
function init() {
  migrate();
  const saved = ls('scout-saved'); if (Array.isArray(saved)) S.saved = new Set(saved);
  S.pipe = ls('scout-pipe') || {};
  S.scope = ls('scout-scope') || 'feed';
  S.kit = ls('scout-kit') || {};
  S.accounts = ls('scout-accounts') || {};
  S.master = ls('scout-master') || {};
  S.docsIdx = ls('scout-docsidx') || {};
  // anything saved before the pipeline existed gets an entry once the feed lands
  for (const id of S.saved) if (!S.pipe[String(id)]) S.pipe[String(id)] = { id: String(id), stage: 'saved', ts: Date.now() };
  const profile = ls('scout-profile'); if (profile) S.profile = profile;
  const user = ls('scout-user');
  document.querySelectorAll('.brand-heart').forEach((h) => { h.innerHTML = heartSVG(); });
  hydrateIcons();
  if (user) { S.user = user; enterApp(); }
  else { show('onb'); renderOnb(); }
  initShaderBG();
  initCursor();
  initDockPop();
}

/* ═══════════════════════════════════════════════════════════
   v3 — shader aurora · verlet physics · glass menu · mobile
   ═══════════════════════════════════════════════════════════ */

/* ————— WebGL shader-gradient aurora (no deps — same look as ShaderGradient) ————— */
function initShaderBG() {
  const cv = document.getElementById('shader-bg');
  if (!cv) return;
  let gl;
  // premultipliedAlpha:false → straight-alpha output composites correctly over the page
  try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, powerPreference: 'low-power' }); } catch {}
  if (!gl) return; // CSS aurora fallback stays
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;uniform vec2 R;uniform float T;uniform vec2 M;
    vec3 A=vec3(1.,.27,.15);vec3 B=vec3(1.,.62,.16);vec3 C=vec3(.80,.97,.27);vec3 D=vec3(.42,.75,1.);vec3 E=vec3(.79,.60,1.);vec3 BG=vec3(.949,.945,.925);
    float h(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 v){vec2 i=floor(v),f=fract(v);f=f*f*(3.-2.*f);
      return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
    float fbm(vec2 v){float s=0.,a=.55;for(int i=0;i<4;i++){s+=a*n(v);v=v*2.03+vec2(1.7,9.2);a*=.5;}return s;}
    void main(){vec2 uv=gl_FragCoord.xy/R;vec2 q=uv*vec2(1.8,1.05);  // bigger blobs
      float t=T*.05;
      // warp the field toward the cursor — a swell that follows the pointer
      vec2 mp=vec2(M.x,1.-M.y)*vec2(1.8,1.05);
      float md=distance(q,mp);
      float pull=exp(-md*1.7);
      q+=(mp-q)*pull*.26;
      float f1=fbm(q+vec2(t,-t*.6));
      float f2=fbm(q*1.5+vec2(-t*.8,t*.4)+4.7);
      float f3=fbm(q*.75+vec2(t*.5,t*.9)+9.1);
      vec3 col=BG;
      col=mix(col,A,smoothstep(.34,.82,f1)*.95);
      col=mix(col,B,smoothstep(.38,.86,f2)*.9);
      col=mix(col,C,smoothstep(.42,.9,f3)*.85);
      col=mix(col,D,smoothstep(.44,.92,fbm(q*1.1+vec2(t*.7,-t*.5)+14.3))*.82);
      col=mix(col,E,smoothstep(.46,.94,fbm(q*.85+vec2(-t*.4,t*.7)+21.9))*.78);
      // brighten a hotspot right under the cursor
      col=mix(col,B,pull*.4);
      // film grain — animated per-frame noise, subtle
      float g=h(gl_FragCoord.xy+fract(T)*vec2(53.7,91.3));
      col+=(g-.5)*.09;
      // straight alpha (premultipliedAlpha:false); mask fades it vertically in CSS
      float fade=.5+.4*uv.y;  // gl_FragCoord is bottom-up: uv.y=1 is the top of the canvas
      gl_FragColor=vec4(col,fade);}`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'R'), uT = gl.getUniformLocation(prog, 'T'), uM = gl.getUniformLocation(prog, 'M');
  const size = () => {
    const dpr = 0.5; // low-res render + CSS blur = free performance
    cv.width = Math.max(2, innerWidth * dpr);
    cv.height = Math.max(2, 460 * dpr);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(uR, cv.width, cv.height);
  };
  size();
  addEventListener('resize', size);
  document.body.classList.add('gl');
  // cursor position drives the warm swell — the aurora only spans the top band, so
  // map against that band and let the pull fade smoothly as the pointer drops away
  let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
  addEventListener('pointermove', (e) => {
    tmx = e.clientX / innerWidth;
    tmy = Math.max(0, Math.min(1.4, e.clientY / 280));
  }, { passive: true });
  let t0 = performance.now();
  const draw = (now) => {
    mx += (tmx - mx) * 0.08; my += (tmy - my) * 0.08; // eased follow
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.uniform2f(uM, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  draw(t0); // paint an initial frame even if the tab starts hidden (RAF may be paused)
  const frame = (now) => {
    if (!document.hidden) draw(now);
    if (!REDUCED) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ————— verlet spring core (real integration, shared RAF) ————— */
const Phys = {
  jobs: new Set(),
  running: false,
  _last: 0, _raf: 0, _to: 0,
  add(fn) { this.jobs.add(fn); this.start(); },
  remove(fn) { this.jobs.delete(fn); },
  start() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    const step = (now) => {
      clearTimeout(this._to);
      cancelAnimationFrame(this._raf);
      if (!this.jobs.size) { this.running = false; return; }
      const dt = Math.min(0.032, Math.max(0.001, (now - this._last) / 1000));
      this._last = now;
      this.jobs.forEach((fn) => { try { fn(dt); } catch { this.jobs.delete(fn); } });
      if (!this.jobs.size) { this.running = false; return; }
      // hybrid driver: rAF when healthy, timer fallback when rAF is throttled
      this._raf = requestAnimationFrame(step);
      this._to = setTimeout(() => step(performance.now()), 60);
    };
    step(this._last);
  },
};

/* ————— liquid-glass cursor — verlet follow, velocity squash ————— */
function initCursor() { /* native cursor — custom cursor retired */ }

/* ————— liquid-glass menubar dropdowns (hover intent) ————— */
let _menuOpen = null, _menuT = null;
function menuContent(v) {
  if (v === 'admissions') {
    const stages = [['ug', 'Undergraduate', 'cap'], ['pg', 'Postgraduate', 'cap'], ['mba', 'MBA & exec', 'building'], ['online-degree', 'Online degrees', 'globe'], ['upskill', 'Upskilling', 'zap'], ['international', 'Study abroad', 'send']];
    return `<div class="menu-col"><div class="menu-h">Admissions</div>
      ${stages.map(([s, t, i]) => `<button class="menu-it" onclick="setAdmStage('${s}');goV('admissions')"><span class="mic">${ic(i, 15)}</span>${t}</button>`).join('')}
      <button class="menu-it" onclick="goV('admissions',{scrollTo:'#adm-open'})"><span class="mic">${ic('clock', 15)}</span>Windows open right now</button></div>`;
  }
  if (v === 'agentmenu') {
    const th = (ls('scout-threads') || []).slice(0, 3);
    return `<div class="menu-col"><div class="menu-h">Scout copilot</div>
      <button class="menu-it" onclick="newThread();goV('agent')"><span class="mic">${ic('plus', 15)}</span>New chat</button>
      ${th.map((t) => `<button class="menu-it" onclick="goV('agent');loadThread('${t.id}')"><span class="mic">${ic('orb', 15)}</span>${esc(t.title.slice(0, 30))}</button>`).join('')}
      <button class="menu-it" onclick="askScout('What should I work on next from my pipeline?')"><span class="mic">${ic('zap', 15)}</span>What's next for me?</button>
      <button class="menu-it" onclick="askScout('Draft an application for my top match')"><span class="mic">${ic('send', 15)}</span>Draft an application</button></div>`;
  }
  if (v === 'alerts') {
    const risky = Object.values(S.pipe).filter((x) => x.snap && x.stage === 'saved' && x.snap.deadline_ts && (x.snap.deadline_ts * 1000 - Date.now()) / 864e5 <= 7).slice(0, 4);
    return `<div class="menu-col"><div class="menu-h">Needs your attention</div>
      ${risky.length ? risky.map((x) => `<button class="menu-it" onclick="openDetail('${x.id}')"><span class="mic">${ic('clock', 15)}</span>${esc(shortTitle(x.snap).slice(0, 28))} — closing</button>`).join('') : '<div class="menu-empty">Nothing urgent. Saved deadlines will surface here.</div>'}
      <button class="menu-it" onclick="openDash('tracking')"><span class="mic">${ic('bookmark', 15)}</span>Open my pipeline</button></div>`;
  }
  if (v === 'settings') {
    return `<div class="menu-col"><div class="menu-h">Settings</div>
      <button class="menu-it" onclick="openDash('details')"><span class="mic">${ic('doc', 15)}</span>Application profile</button>
      <button class="menu-it" onclick="openDash('details')"><span class="mic">${ic('upload', 15)}</span>Documents</button>
      <button class="menu-it" onclick="goV('profile',{scrollTo:'#ps-settings'})"><span class="mic">${ic('gear', 15)}</span>Preferences</button>
      <button class="menu-it" onclick="goV('profile',{scrollTo:'#ps-acct'})"><span class="mic">${ic('shield', 15)}</span>Account & sync</button></div>`;
  }
  if (v === 'account') {
    const nm = (S.user && S.user.name) || 'You';
    return `<div class="menu-col"><div class="menu-h">${esc(nm.split(' ')[0])}</div>
      <button class="menu-it" onclick="openDash()"><span class="mic">${ic('grid', 15)}</span>Dashboard</button>
      <button class="menu-it" onclick="goV('profile')"><span class="mic">${ic('user', 15)}</span>My profile</button>
      <button class="menu-it" onclick="goV('scouted')"><span class="mic">${ic('bookmark', 15)}</span>My pipeline</button>
      <button class="menu-it" onclick="goV('profile',{scrollTo:'#ps-ext'})"><span class="mic">${ic('download', 15)}</span>Autofill extension</button>
      <button class="menu-it" onclick="resetDevice()"><span class="mic">${ic('x', 15)}</span>Reset device</button></div>`;
  }
  if (v === 'scouted') return scoutedMenuHTML();
  const cnt = (t) => DATA.filter((o) => o.type === t && o.days_left > 0).length;
  if (v === 'discover') {
    const cats = [['Hackathons', 'zap'], ['Competitions', 'trophy'], ['Scholarships', 'cap'], ['Internships', 'users'], ['Fellowships', 'globe'], ['Grants', 'heart']];
    return `<div class="menu-cols">
      <div class="menu-sec"><div class="mh">Categories</div>${cats.map(([t, i]) =>
        `<button class="menu-it" onclick="setDisType('${t.replace(/s$/, '')}');goV('discover')"><span class="mic">${ic(i, 15)}</span>${t}<span class="cnt">${cnt(t.replace(/s$/, ''))}</span></button>`).join('')}</div>
      <div class="menu-sec"><div class="mh">Rankings</div>
        <button class="menu-it" onclick="setDisType('All','closing');goV('discover')"><span class="mic">${ic('calendar', 15)}</span><span>Closing soon<span class="sub">deadline order</span></span></button>
        <button class="menu-it" onclick="setDisType('All','viral');goV('discover')"><span class="mic">${ic('eye', 15)}</span><span>Most popular<span class="sub">by registrations</span></span></button>
        <button class="menu-it" onclick="setDisType('All','prize');goV('discover')"><span class="mic">${ic('trophy', 15)}</span><span>Biggest prizes<span class="sub">₹ value</span></span></button>
        <button class="menu-it" onclick="rotateFeed()"><span class="mic">${ic('shuffle', 15)}</span><span>Re-deal the feed<span class="sub">new rotation</span></span></button>
      </div></div>`;
  }
  if (v === 'agent') {
    return `<div class="menu-sec"><div class="mh">Ask Scout</div>
      <button class="menu-it" onclick="askScout('Draft an SoP for my strongest match')"><span class="mic">${ic('spark', 15)}</span><span>Draft an SoP<span class="sub">tailored to your profile</span></span></button>
      <button class="menu-it" onclick="askScout('Which of my matches am I actually eligible for?')"><span class="mic">${ic('check', 15)}</span><span>Check eligibility<span class="sub">against live listings</span></span></button>
      <button class="menu-it" onclick="askScout('Build a checklist for everything closing in 14 days')"><span class="mic">${ic('calendar', 15)}</span><span>Deadline checklist<span class="sub">next 14 days</span></span></button></div>`;
  }
  if (v === 'saved') {
    const saved = DATA.filter((o) => S.saved.has(o.id)).slice(0, 3);
    return `<div class="menu-sec"><div class="mh">Saved</div>
      ${saved.length ? saved.map((o) => `<button class="menu-mini" onclick="openDetail('${o.id}')"><img src="${esc(o.imgThumb || o.img)}" alt=""><span><span class="t">${esc(shortTitle(o))}</span><span class="d">${o.days_left}d left</span></span></button>`).join('')
      : '<div style="padding:10px;font-size:12.5px;color:var(--ink2)">Nothing saved yet — bookmark anything to get deadline reminders.</div>'}
      <button class="menu-it" onclick="goV('scouted')"><span class="mic">${ic('bookmark', 15)}</span>View all saved</button></div>`;
  }
  return '';
}
/* Scouted mega-menu — the pipeline at a glance, one hover from anywhere */
function scoutedMenuHTML() {
  const c = pipeCounts();
  const total = c.saved + c.draft + c.applied + c.result;
  const risk = pipeIn('saved').filter((p) => { const d = p.snap && p.snap.deadline_ts ? Math.ceil((p.snap.deadline_ts * 1000 - Date.now()) / 86400000) : 99; return d > 0 && d <= 7; }).length;
  const next = pipeIn('draft').concat(pipeIn('saved')).slice(0, 2);
  return `<div class="menu-grid sc-menu">
    <div class="menu-col">
      <div class="menu-h">Your pipeline</div>
      ${STAGES.map((s) => `<button class="menu-it" onclick="goV('scouted');setSc('${s.v}')"><span class="mic">${ic(s.icn, 15)}</span>${s.t}<span class="menu-n">${c[s.v]}</span></button>`).join('')}
      <button class="menu-it" onclick="goV('scouted');setSc('overview')"><span class="mic">${ic('layers', 15)}</span>Progress overview</button>
    </div>
    <div class="menu-col">
      <div class="menu-h">Where you stand</div>
      ${total ? `<div class="sc-mm">
        <div class="mm-row"><b>${c.applied + c.result}</b> of <b>${total}</b> saved actually sent</div>
        ${risk ? `<div class="mm-row hot">${ic('clock', 12)} ${risk} closing this week, untouched</div>` : '<div class="mm-row ok">Nothing urgent slipping</div>'}
      </div>
      ${next.map((p) => `<button class="menu-mini" onclick="openDetail('${p.id}')"><img src="${esc(p.snap.imgThumb || p.snap.img)}" alt=""><span><span class="t">${esc(shortTitle(p.snap))}</span><span class="d">${p.stage === 'draft' ? (p.pct || 0) + '% drafted' : 'not started'}</span></span></button>`).join('')}`
      : '<div style="padding:10px;font-size:12.5px;color:var(--ink2);line-height:1.6">Save anything and it lands here — Scout tracks the deadline, your draft, and whether you actually sent it.</div>'}
    </div>
  </div>`;
}
function wireMenubar() {
  const drop = document.getElementById('menu-drop');
  if (!drop) return;
  document.querySelectorAll('.topbar [data-menu]').forEach((it) => {
    const v = it.dataset.menu;
    if (!v) return;
    it.addEventListener('mouseenter', () => {
      clearTimeout(_menuT);
      _menuT = setTimeout(() => openMenu(v, it), _menuOpen ? 0 : 130);
    });
    it.addEventListener('mouseleave', scheduleMenuClose);
    it.addEventListener('focus', () => openMenu(v, it));
  });
  drop.addEventListener('mouseenter', () => clearTimeout(_menuT));
  drop.addEventListener('mouseleave', scheduleMenuClose);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(true); });
}
function openMenu(v, item) {
  const drop = document.getElementById('menu-drop');
  const html = menuContent(v);
  if (!html) return;
  drop.innerHTML = html;
  hydrateIcons(drop);
  // center under the hovered item, clamped to the bar
  const bar = item.closest('.topbar').getBoundingClientRect();
  const r = item.getBoundingClientRect();
  drop.style.left = Math.round(r.left - bar.left + r.width / 2) + 'px';
  document.querySelectorAll('.nav-it').forEach((n) => n.classList.toggle('open', n === item));
  if (_menuOpen !== v && window.gsap && !REDUCED) {
    gsap.fromTo(drop, { y: 8, scale: 0.97 }, { y: 0, scale: 1, duration: 0.45, ease: 'elastic.out(1,0.75)' });
  }
  drop.classList.add('open');
  drop.style.transform = 'translateX(-50%)';
  _menuOpen = v;
}
function scheduleMenuClose() {
  clearTimeout(_menuT);
  _menuT = setTimeout(() => closeMenu(), 220);
}
function closeMenu(instant) {
  clearTimeout(_menuT);
  const drop = document.getElementById('menu-drop');
  if (!drop || !_menuOpen) return;
  drop.classList.remove('open');
  document.querySelectorAll('.nav-it.open').forEach((n) => n.classList.remove('open'));
  _menuOpen = null;
}

/* ————— AI dock popup — spring open (verlet), drag-flick to dismiss ————— */
let _dockPop = { v: 0, pv: 0, target: 0, live: false, drag: null };
function dockPopHTML() {
  const closing = DATA.filter((o) => o.days_left > 0).sort((a, b) => a.days_left - b.days_left).slice(0, 3);
  const recent = ls('scout-recent') || [];
  return `
    <div class="ph">Try a search</div>
    <div class="prow">
      <button class="pit" onclick="runSearch('remote hackathons this week')">${ic('search', 13)} remote hackathons this week</button>
      <button class="pit" onclick="runSearch('paid internships in AI/ML')">${ic('search', 13)} paid AI/ML internships</button>
      <button class="pit" onclick="runSearch('volunteering in Mumbai')">${ic('search', 13)} volunteering in Mumbai</button>
    </div>
    ${closing.length ? `<div class="ph">Racing the clock</div><div class="prow">${closing.map((o) =>
      `<button class="pit" onclick="openDetail('${o.id}')"><img src="${esc(o.imgThumb || o.img)}" alt="" onerror="this.style.display='none'">${esc(shortTitle(o)).slice(0, 26)}<span class="d">${o.days_left}d</span></button>`).join('')}</div>` : ''}
    ${recent.length ? `<div class="ph">Recent searches</div><div class="prow">${recent.slice(0, 3).map((q) =>
      `<button class="pit" onclick="runSearch('${q.replace(/'/g, "\\'")}')">${ic('search', 13)} ${esc(q.slice(0, 34))}</button>`).join('')}</div>` : ''}`;
}
function initDockPop() {
  const input = document.getElementById('ai-dock-input');
  const pop = document.getElementById('dock-pop');
  if (!input || !pop) return;
  input.addEventListener('focus', openDockPop);
  input.addEventListener('blur', () => setTimeout(() => { if (!pop.matches(':hover')) closeDockPop(); }, 140));
  pop.addEventListener('pointerdown', (e) => { if (e.target.id !== 'dock-pop-grab') e.preventDefault(); }); // keep input focused
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDockPop(); });
  // drag-flick on the grab handle — real verlet drag with release momentum
  const grab = document.getElementById('dock-pop-grab');
  grab.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    grab.setPointerCapture(e.pointerId);
    _dockPop.drag = { y0: e.clientY, last: e.clientY, vel: 0, t: performance.now() };
  });
  grab.addEventListener('pointermove', (e) => {
    const d = _dockPop.drag; if (!d) return;
    const now = performance.now();
    d.vel = (e.clientY - d.last) / Math.max(1, now - d.t) * 16;
    d.last = e.clientY; d.t = now;
    const dy = Math.max(0, e.clientY - d.y0);
    _dockPop.v = Math.max(0, 1 - dy / 220);
    paintDockPop();
  });
  grab.addEventListener('pointerup', () => {
    const d = _dockPop.drag; _dockPop.drag = null;
    if (!d) return;
    if (d.vel > 2.2 || _dockPop.v < 0.55) closeDockPop(); else openDockPop();
  });
}
function springDockPop() {
  Phys.add(function job(dt) {
    const p = _dockPop;
    if (p.drag) return; // user has the handle
    // verlet spring toward target with slight overshoot
    const K = 240, FR = 0.78;
    const acc = (p.target - p.v) * K;
    const nv = p.v + (p.v - p.pv) * FR + acc * dt * dt;
    p.pv = p.v; p.v = nv;
    paintDockPop();
    if (Math.abs(p.v - p.target) < 0.001 && Math.abs(p.v - p.pv) < 0.001) {
      p.v = p.target; paintDockPop(); Phys.remove(job);
      if (p.target === 0) document.getElementById('dock-pop').classList.remove('live');
    }
  });
}
function paintDockPop() {
  const pop = document.getElementById('dock-pop');
  const v = Math.max(0, _dockPop.v);
  pop.style.opacity = Math.min(1, v * 1.25);
  pop.style.transform = `translateX(-50%) translateY(${(1 - v) * 26}px) scale(${0.94 + v * 0.06})`;
  pop.setAttribute('aria-hidden', v < 0.5);
}
function openDockPop() {
  const pop = document.getElementById('dock-pop');
  if (S.view === 'agent') return;
  pop.classList.add('live');
  document.getElementById('dock-pop-body').innerHTML = dockPopHTML();
  hydrateIcons(pop);
  _dockPop.target = 1;
  if (REDUCED) { _dockPop.v = 1; paintDockPop(); return; }
  springDockPop();
}
function closeDockPop(instant) {
  _dockPop.target = 0;
  if (instant || REDUCED) { _dockPop.v = 0; _dockPop.pv = 0; paintDockPop(); const p = document.getElementById('dock-pop'); if (p) p.classList.remove('live'); return; }
  springDockPop();
}

/* ————— mobile tab bar (Orb-style, center Ask) ————— */
function renderTabbar() {
  const el = document.getElementById('tabbar-m');
  if (!el) return;
  const items = [['home', 'home', 'Home'], ['discover', 'compass', 'Discover'], ['agent', 'spark', ''], ['scouted', 'bookmark', 'Scouted'], ['profile', 'user', 'Profile']];
  el.innerHTML = items.map(([v, icn, lab]) => v === 'agent'
    ? `<button class="tb ask ${AI_ENABLED ? '' : 'soon'}" onclick="${AI_ENABLED ? "goV('agent')" : 'soon()'}" aria-label="Ask Scout — coming soon">${ic('spark', 20)}</button>`
    : `<button class="tb ${S.view === v ? 'on' : ''}" onclick="goV('${v}')">${ic(icn, 19)}<span>${lab}</span></button>`).join('');
}

/* ═══════════════════════════════════════════════════════════
   v4 — personalization workflows · departments · week plan · pipeline
   ═══════════════════════════════════════════════════════════ */

/* merch badges — e-commerce style signals, all from real data */
function badge2(o) {
  if (o.days_left > 0 && o.days_left <= 3) return `<span class="badge2 urg">Almost closed</span>`;
  if (o.applied > 2000) return `<span class="badge2 hot">Trending</span>`;
  if (o.views > 300 && o.applied / Math.max(1, o.views) < 0.03) return `<span class="badge2 gem">Low competition</span>`;
  if (o.updated_at && Date.now() - new Date(o.updated_at) < 48 * 3600000) return `<span class="badge2 new">Just added</span>`;
  return '';
}

/* card-level navigation that ignores clicks on inner controls */
function cardGo(e, fn) {
  if (e.target.closest('button,a,input,form,select,.sugg,.legend b')) return;
  fn();
}

/* ————— departments row (e-commerce category strip) ————— */
const TYPE_ICON = { Hackathon: 'zap', Competition: 'trophy', Scholarship: 'cap', Internship: 'users', Fellowship: 'globe', Grant: 'heart', Conference: 'chat', Talk: 'send', Workshop: 'view', Quiz: 'check', Meetup: 'users', Job: 'grid', Volunteering: 'heart', Exhibition: 'eye', Networking: 'users', Cultural: 'globe', Academic: 'cap' };
function deptRowHTML() {
  const counts = {};
  DATA.forEach((o) => { if (o.days_left > 0) counts[o.type] = (counts[o.type] || 0) + 1; });
  const order = ['Hackathon', 'Competition', 'Internship', 'Job', 'Scholarship', 'Fellowship', 'Grant', 'Conference', 'Talk', 'Workshop', 'Quiz', 'Volunteering', 'Meetup', 'Networking', 'Cultural', 'Exhibition', 'Academic'].filter((t) => counts[t]);
  if (!order.length) return '';
  return `<div class="depts rv">${order.map((t) =>
    `<button class="dept" onclick="setDisType('${t}');goV('discover')"><span class="di" style="--tc:${TYPE_COLOR[t] || '#111'}">${ic(TYPE_ICON[t] || 'zap', 16)}</span><span class="dl">${t}s</span><span class="dc">${counts[t]}</span></button>`).join('')}</div>`;
}

/* markApplied — the one-tap "I did this elsewhere" path into the pipeline */
function markApplied(id, btn) {
  const cur = pipeGet(id);
  const done = cur && cur.stage === 'applied';
  const o = DATA.find((x) => String(x.id) === String(id));
  pipeSet(id, { stage: done ? 'saved' : 'applied', appliedAt: done ? null : Date.now(), method: done ? null : 'external' }, o);
  if (!done) S.saved.add(id), ls('scout-saved', [...S.saved]);
  toast(done ? 'Moved back to saved' : 'Marked as applied — tracked in Scouted');
  if (btn) btn.innerHTML = `${ic('check', 14)} ${done ? 'Mark as applied' : 'Applied ✓'}`;
}

/* ————— "Your week, planned" — auto workflow from saved + strong matches ————— */
function weekPlanHTML(matches) {
  const pool = matches
    .filter((o) => o.days_left > 0 && o.days_left <= 10 && (S.saved.has(o.id) || o._score >= 82))
    .sort((a, b) => a.days_left - b.days_left)
    .slice(0, 5);
  if (!pool.length) return '';
  const pc = pipeCounts();
  const day = (dl) => new Date(Date.now() + dl * 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  const ids = pool.map((o) => o.id).join(',');
  return `<section class="weekplan rv">
    <div class="wp-head">
      <div><span class="eyebrow">Your week, planned</span><div class="wp-sub">${pool.length} deadlines within 10 days — worked back from each closing date</div></div>
      <div class="wp-pipe" onclick="goV('scouted')" title="Your pipeline">
        <span><b>${pc.saved}</b> saved</span><i>${ic('arrow-right', 12)}</i><span><b>${pc.draft}</b> drafting</span><i>${ic('arrow-right', 12)}</i><span><b>${pc.applied}</b> applied</span>
      </div>
    </div>
    ${pool.map((o) => `<div class="planrow" onclick="openDetail('${o.id}')">
      <span class="pr-day ${o.days_left <= 3 ? 'urgent' : ''}"><b>${day(o.days_left)}</b><i>${o.days_left}d left</i></span>
      <img class="pr-th" src="${esc(o.imgThumb || o.img)}" alt="" loading="lazy" onerror="this.style.display='none'">
      <span class="pr-t"><b>${esc(shortTitle(o))}</b><i>${esc(o.org)} · ${o.type} · ${esc(o.prize)}</i></span>
      ${AI_ENABLED
        ? `<button class="pill pill-ghost pr-act" onclick="event.stopPropagation();askScout('Help me apply to ${esc(shortTitle(o)).replace(/'/g, '')} — build a plan working back from the deadline in ${o.days_left} days')">${ic('spark', 13)} Draft with Scout</button>`
        : `<button class="pill pill-ghost pr-act soon" onclick="event.stopPropagation();soon()">${ic('spark', 13)} Draft with Scout<span class="soon-tag">Soon</span></button>`}
    </div>`).join('')}
    <div class="wp-foot">
      <button class="tool" onclick="calendarAll('${ids}')">${ic('calendar', 14)} Add all ${pool.length} deadlines to calendar</button>
      ${AI_ENABLED ? `<button class="tool" onclick="draftMany('${ids}'.split(','))">${ic('zap', 14)} Draft all ${pool.length} applications</button>` : ''}
      ${AI_ENABLED
        ? `<button class="tool" onclick="askScout('Plan my week around my saved opportunities and strongest matches closing in 10 days')">${ic('spark', 14)} Refine with Scout</button>`
        : `<button class="tool soon" onclick="soon()">${ic('spark', 14)} Refine with Scout<span class="soon-tag">Soon</span></button>`}
    </div>
  </section>`;
}
function calendarAll(idsCsv) {
  const ids = idsCsv.split(',');
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const events = ids.map((id) => {
    const o = DATA.find((x) => String(x.id) === String(id));
    if (!o) return '';
    const dt = o.deadline_ts ? new Date(o.deadline_ts * 1000) : new Date(Date.now() + o.days_left * 86400000);
    return ['BEGIN:VEVENT', 'UID:' + o.id + '@scout', 'DTSTAMP:' + stamp(new Date()), 'DTSTART:' + stamp(new Date(dt.getTime() - 3600000)), 'DTEND:' + stamp(dt),
      'SUMMARY:' + o.title.replace(/[,;]/g, ' ') + ' — deadline', 'DESCRIPTION:Apply: ' + o.source_url,
      'BEGIN:VALARM', 'TRIGGER:-P3D', 'ACTION:DISPLAY', 'DESCRIPTION:3 days left', 'END:VALARM', 'END:VEVENT'].join('\r\n');
  }).filter(Boolean).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Scout//EN\r\n' + events + '\r\nEND:VCALENDAR'], { type: 'text/calendar' }));
  a.download = 'scout-week.ics';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Week exported — every deadline has a 3-day-before alarm');
}

/* ————— personal rails ————— */
const GOAL_RAIL = {
  fund: ['Money on the table', 'Grants, fellowships & scholarships — because your goal is funding', ['Grant', 'Fellowship', 'Scholarship']],
  experience: ['Build your CV', 'Wins you can put on paper — competitions & hackathons', ['Competition', 'Hackathon', 'Quiz']],
  intern: ['Internships first', 'Real desks, real stipends — matched to your profile', ['Internship']],
  abroad: ['Abroad & funded', 'International money and mobility', ['Fellowship', 'Scholarship', 'Conference']],
  network: ['Rooms to be in', 'Conferences, meetups and stages — because your goal is people', ['Conference', 'Meetup', 'Workshop', 'Talk']],
};
function goalRailHTML(matches) {
  const g = GOAL_RAIL[(S.profile || {}).goal];
  if (!g) return '';
  const items = matches.filter((o) => g[2].includes(o.type)).slice(0, 10);
  return items.length >= 3 ? railHTML(g[0], items, 'scard', g[1]) : '';
}
function domainRailHTML(matches) {
  const d = ((S.profile || {}).domains || [])[0];
  if (!d) return '';
  const items = matches.filter((o) => (o.dom || []).includes(d)).slice(0, 10);
  return items.length >= 3 ? railHTML(`Because you're into ${d}`, items, 'scard', 'Straight from your onboarding — tune it in your profile') : '';
}
function gems() {
  return computeMatches(DATA.filter((o) => o.views > 300 && o.days_left > 0 && o.applied / o.views < 0.03)).slice(0, 10);
}

/* ————— per-listing plan flow (popular items get a worked-back schedule) ————— */
function planSteps(o) {
  const dl = o.days_left;
  if (dl <= 0) return [];
  const at = (f) => Math.max(0, Math.round(dl * f));
  const dayLbl = (d) => d === 0 ? 'Today' : new Date(Date.now() + d * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (o.type === 'Hackathon' || o.type === 'Competition') {
    const team = o.team && o.team !== '1' ? [{ d: at(0.25), t: `Lock your team (${o.team} allowed)` }] : [];
    return [{ d: 0, t: 'Register on ' + (o.display_url || 'the official page') }, ...team,
      { d: at(0.5), t: 'First working prototype / draft' },
      { d: at(0.85), t: 'Polish + record the demo' },
      { d: dl, t: 'Submit before ' + o.deadline, final: true }].map((s) => ({ ...s, lbl: dayLbl(s.d) }));
  }
  if (['Scholarship', 'Fellowship', 'Grant'].includes(o.type)) {
    return [{ d: 0, t: 'Read eligibility + gather transcripts' },
      { d: at(0.3), t: 'Request recommendation letters' },
      { d: at(0.6), t: 'Draft SoP / research statement' },
      { d: at(0.85), t: 'Final review — Scout can check it' },
      { d: dl, t: 'Submit before ' + o.deadline, final: true }].map((s) => ({ ...s, lbl: dayLbl(s.d) }));
  }
  if (['Conference', 'Talk', 'Meetup', 'Workshop'].includes(o.type)) {
    return [{ d: 0, t: 'Grab your spot / ticket' },
      { d: at(0.4), t: o.type === 'Talk' ? 'Draft your talk proposal' : 'Plan travel & agenda' },
      { d: at(0.8), t: 'Prep: who do you want to meet?' },
      { d: dl, t: (o.type === 'Talk' ? 'CFP closes ' : 'Happens ') + o.deadline, final: true }].map((s) => ({ ...s, lbl: dayLbl(s.d) }));
  }
  return [{ d: 0, t: 'Apply on ' + (o.display_url || 'the source'), lbl: 'Today' }, { d: dl, t: 'Closes ' + o.deadline, lbl: dayLbl(dl), final: true }];
}
function planHTML(o) {
  const steps = planSteps(o);
  if (steps.length < 3) return '';
  return `<div class="dsec"><h3>Scout's plan for this</h3><div class="plan">
    ${steps.map((s, i) => `<div class="plan-step ${s.final ? 'final' : ''}">
      <span class="ps-n">${s.final ? ic('check', 13) : String(i + 1).padStart(2, '0')}</span>
      <span class="ps-t">${esc(s.t)}</span><span class="ps-d">${esc(s.lbl)}</span></div>`).join('')}
    <button class="tool" style="margin-top:10px" onclick="askScout('Refine this application plan for ${esc(shortTitle(o)).replace(/'/g, '')} — I have ${o.days_left} days')">${ic('spark', 14)} Make it mine</button>
  </div></div>`;
}

/* ═══════════════════════════════════════════════════════════
   v5 — generative chat UI: the agent answers with live components
   ═══════════════════════════════════════════════════════════ */
function gcardHTML2(c) {
  return `<button class="gcard" onclick="openDetail('${c.id}')">
    <img src="${esc(c.img)}" alt="" loading="lazy" onerror="this.style.display='none'">
    <span class="gc-t"><b>${esc(c.title)}</b><i>${esc(c.org)} · ${c.type} · ${esc(c.prize)}</i></span>
    <span class="gc-r"><b class="${c.days_left <= 3 ? 'urgent' : ''}">${c.days_left}d</b><i>${c.fit}% fit</i></span>
  </button>`;
}
const ELIG_ICON = { pass: ['check', 'var(--green-deep)'], warn: ['view', 'var(--orange)'], fail: ['x', 'var(--red)'], unknown: ['help', 'var(--ink3)'] };
function renderBlocks(blocks) {
  return blocks.map((b) => {
    if (b.type === 'text' && b.html) return `<div class="bub">${b.html}</div>`;
    if (b.type === 'cards') return `<div class="gcards">${b.items.map(gcardHTML2).join('')}${b.reason ? `<div class="greason">${esc(b.reason)}</div>` : ''}</div>`;
    if (b.type === 'stat') return `<div class="gstat"><b>${fmtIN(b.n)}</b><span>${esc(b.label)}</span>${b.sub ? `<i>${esc(b.sub)}</i>` : ''}</div>`;
    if (b.type === 'eligibility') return `<div class="gelig">${b.opp ? `<div class="ge-h" onclick="openDetail('${b.opp.id}')">${esc(b.opp.title)}</div>` : ''}
      ${b.criteria.map((c) => { const [icn, col] = ELIG_ICON[c.status] || ELIG_ICON.unknown; return `<div class="ge-row"><span class="ge-i" style="color:${col}">${ic(icn, 14)}</span><b>${esc(c.label)}</b><span>${esc(c.note)}</span></div>`; }).join('')}</div>`;
    if (b.type === 'plan') return `<div class="gplan">${b.opp ? `<div class="ge-h" onclick="openDetail('${b.opp.id}')">${esc(b.opp.title)} — worked back from ${esc(b.opp.deadline)}</div>` : ''}
      <div class="plan">${b.steps.map((s, i) => `<div class="plan-step ${s.final ? 'final' : ''}"><span class="ps-n">${s.final ? ic('check', 13) : String(i + 1).padStart(2, '0')}</span><span class="ps-t">${esc(s.t)}</span><span class="ps-d">${esc(s.lbl)}</span></div>`).join('')}</div>
      ${b.opp ? `<button class="tool" onclick="addToCalendar('${b.opp.id}')">${ic('calendar', 13)} Add deadline to calendar</button>` : ''}</div>`;
    if (b.type === 'compare') return `<div class="gcmp"><div class="gcmp-row gcmp-head"><span>Listing</span><span>Closes</span><span>Prize</span><span>Crowd</span><span>Fit</span></div>
      ${b.items.map((c) => `<div class="gcmp-row" onclick="openDetail('${c.id}')"><span class="tt">${esc(c.title.slice(0, 44))}</span><span class="${c.days_left <= 3 ? 'urgent' : ''}">${c.days_left}d</span><span>${esc(c.prize)}</span><span>${c.applied ? fmtIN(c.applied) : '—'}</span><b>${c.fit}%</b></div>`).join('')}</div>`;
    if (b.type === 'form') return genFormHTML();
    if (b.type === 'chips') return `<div class="qr">${b.options.map((q) => `<button onclick="qReply('${q.replace(/'/g, "\\'")}')">${esc(q)}</button>`).join('')}</div>`;
    return '';
  }).join('');
}
function aiBlocks(blocks) {
  const textBlock = blocks.find((b) => b.type === 'text');
  S.chat.push({ r: 'ai', c: textBlock ? textBlock.html : '[interactive]' });
  const m = document.getElementById('msgs'); if (!m) return;
  const div = document.createElement('div'); div.className = 'mg ai gen';
  div.innerHTML = renderBlocks(blocks) + `<div class="mtime">${tstamp()}</div>`;
  m.appendChild(div);
  persistThread();
  hydrateIcons(div);
  if (window.gsap && !REDUCED) gsap.fromTo(div.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .4, stagger: .07, ease: 'power2.out' });
  div.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'end' });
}
function genFormHTML() {
  const p = S.profile || {};
  return `<div class="genform">
    <div class="gf-h">Your Scout profile — powers every ranking</div>
    <div class="gf-grid">
      <label>Level<select id="gf-role">${ROLES.map((r) => `<option value="${r.v}" ${p.role === r.v ? 'selected' : ''}>${r.t}</option>`).join('')}</select></label>
      <label>Goal<select id="gf-goal">${GOALS.map((g) => `<option value="${g.v}" ${p.goal === g.v ? 'selected' : ''}>${g.t}</option>`).join('')}</select></label>
      <label>CGPA<input id="gf-cgpa" value="${esc(p.cgpa || '')}" placeholder="e.g. 8.4"></label>
      <label>Open to<select id="gf-geo">${[['india', 'India'], ['abroad', 'Abroad'], ['remote', 'Remote'], ['any', 'Anywhere']].map(([v, l]) => `<option value="${v}" ${p.geo === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    </div>
    <div class="gf-doms">${DOMAINS.map((d) => `<button class="gf-dom ${(p.domains || []).includes(d) ? 'on' : ''}" onclick="this.classList.toggle('on')">${d}</button>`).join('')}</div>
    <button class="pill pill-dark" onclick="genFormSave(this)">Save — re-rank everything</button>
  </div>`;
}
function genFormSave(btn) {
  const root = btn.closest('.genform');
  S.profile = {
    ...S.profile,
    role: root.querySelector('#gf-role').value,
    goal: root.querySelector('#gf-goal').value,
    cgpa: root.querySelector('#gf-cgpa').value.trim(),
    geo: root.querySelector('#gf-geo').value,
    domains: [...root.querySelectorAll('.gf-dom.on')].map((b) => b.textContent),
  };
  ls('scout-profile', S.profile);
  renderDockChips();
  toast('Profile saved — every ranking just re-computed');
  aiMsg(`Done. You're a <b>${(ROLES.find((r) => r.v === S.profile.role) || {}).t || 'member'}</b> chasing <b>${(GOALS.find((g) => g.v === S.profile.goal) || {}).t || 'everything'}</b> — rails, matches and eligibility now reflect it.`, ['Find my best matches', 'What closes this week?']);
}

/* boot — after all module-level declarations */
if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
