// Scout ontology — a typed object model over the live feed (Palantir-style).
//
// ENTITIES
//   Opportunity {id, title, type, org, domains[], skills[], roles[], geo, location,
//                deadline_ts, days_left, prize, prize_cash, applied, views, score,
//                source, regn_start}
//   User        {role, domains[], looking[], goal, geo, cgpa, gradYear, institution, city}
//   Organization{name, weight}          — derived from listings
//   Type        Hackathon|Competition|Scholarship|Internship|Fellowship|Grant|
//               Conference|Talk|Workshop|Quiz|Meetup
//
// RELATIONS
//   Opportunity —HOSTED_BY→ Organization
//   Opportunity —IN_DOMAIN→ Domain            (dom[])
//   Opportunity —REQUIRES→ Skill              (skills[])
//   Opportunity —OPEN_TO→ Role                (roles[])
//   Opportunity —SIMILAR_TO→ Opportunity      (computed: type/domain/org overlap)
//   User        —INTERESTED_IN→ Domain, —SEEKS→ Type, —PURSUES→ Goal
//
// Every agent tool below is a deterministic query over this model — the LLM only
// narrates; it never invents listings.

const GOAL_BOOST = {
  fund: { Grant: 14, Fellowship: 12, Scholarship: 10 },
  experience: { Competition: 12, Hackathon: 12, Quiz: 6 },
  intern: { Internship: 16, Hackathon: 4 },
  abroad: { Fellowship: 10, Scholarship: 9, Conference: 7, Hackathon: 3 },
  network: { Conference: 13, Meetup: 13, Workshop: 9, Talk: 9, Hackathon: 4 },
  explore: {},
};
const LOOK_TYPE = { scholarships: 'Scholarship', fellowships: 'Fellowship', grants: 'Grant', hackathons: 'Hackathon', competitions: 'Competition', internships: 'Internship', conferences: 'Conference', workshops: 'Workshop', events: 'Meetup', jobs: 'Internship' };

/* personal fit score 40–98, mirrors the client formula so both agree */
export function fitScore(o, profile) {
  const p = profile || {};
  const wanted = new Set((p.looking || []).map((x) => LOOK_TYPE[String(x).toLowerCase()]).filter(Boolean));
  const boost = GOAL_BOOST[p.goal] || {};
  let s = 44;
  const dom = (o.dom || []).filter((x) => (p.domains || []).includes(x)).length;
  s += Math.min(dom * 14, 28);
  if (wanted.has(o.type)) s += 11;
  s += boost[o.type] || 0;
  if ((o.roles || []).includes(p.role)) s += 9; else s -= 4;
  if (p.geo === 'any' || !p.geo || o.geo === p.geo || o.geo === 'remote') s += 6;
  else if (p.geo === 'abroad' && o.geo === 'global') s += 6;
  if (o.days_left <= 10) s += 3;
  return Math.max(40, Math.min(98, Math.round(s)));
}

// mirror of the client metrics() — competition intensity / ROI / effort / CV / odds
const EFFORT_HOURS = { Hackathon: 48, Competition: 30, Internship: 14, Scholarship: 22, Fellowship: 26, Grant: 24, Conference: 5, Talk: 16, Workshop: 4, Quiz: 2, Meetup: 2, Volunteering: 24, Exhibition: 3, Cultural: 3, Networking: 3, Academic: 6 };
const CV_BASE = { Fellowship: 90, Grant: 84, Scholarship: 80, Talk: 82, Internship: 78, Competition: 76, Academic: 70, Hackathon: 72, Volunteering: 68, Conference: 60, Exhibition: 46, Workshop: 42, Networking: 44, Quiz: 36, Meetup: 26 };
const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));
export function metrics(o, score) {
  const applied = o.applied || 0, views = o.views || 0, prize = o.prize_cash || 0;
  const crowd = Math.log1p(applied) / Math.log1p(15000);
  const conv = views > 80 ? Math.min(1, (applied / views) * 6) : crowd;
  const intensity = cl(crowd * 55 + conv * 15 + Math.min(prize / 1e6, 1) * 20 + (o.team === '1' ? 6 : 0) + (o.days_left > 0 && o.days_left <= 5 ? 6 : 0), 4, 99);
  const effort = EFFORT_HOURS[o.type] || 8;
  const cv = cl((CV_BASE[o.type] || 50) + Math.min(prize / 1e6, 1) * 8 + (applied > 3000 ? 6 : 0) + (intensity > 72 ? 6 : 0), 15, 99);
  const reward = Math.min(prize / 1.5e5, 1) * 55 + cv * 0.5;
  const roi = cl(reward * (1 - intensity / 240) * (1 - Math.min(effort, 60) / 160), 5, 99);
  const grade = roi >= 55 ? 'A+' : roi >= 44 ? 'A' : roi >= 33 ? 'B' : roi >= 22 ? 'C' : 'D';
  const fit = score || 70;
  const odds = cl(100 - intensity * 0.72 + (fit - 70) * 0.5, 3, 96);
  return { intensity, effort, cv, roi, grade, odds };
}

export function recommend(items, profile, k = 6) {
  return items
    .filter((o) => o.days_left > 0)
    .map((o) => ({ ...o, _fit: fitScore(o, profile), _blend: 0.55 * fitScore(o, profile) + 45 * (o.score || 0.4) }))
    .sort((a, b) => b._blend - a._blend)
    .slice(0, k);
}

export function facetQuery(items, { type, domain, maxDays, geo, minPrize, q, sort, limit = 6 } = {}) {
  let out = items.filter((o) => o.days_left > 0);
  if (type) out = out.filter((o) => o.type === type);
  if (domain) out = out.filter((o) => (o.dom || []).includes(domain));
  if (maxDays) out = out.filter((o) => o.days_left <= maxDays);
  if (geo) out = out.filter((o) => o.geo === geo);
  if (minPrize) out = out.filter((o) => (o.prize_cash || 0) >= minPrize);
  if (q) {
    const terms = String(q).toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    out = out.map((o) => {
      const hay = [o.title, o.org, o.description, o.type, (o.dom || []).join(' '), (o.skills || []).join(' ')].join(' ').toLowerCase();
      return { o, hits: terms.filter((t) => hay.includes(t)).length };
    }).filter((r) => r.hits > 0).sort((a, b) => b.hits - a.hits).map((r) => r.o);
  }
  if (sort === 'closing') out = out.slice().sort((a, b) => a.days_left - b.days_left);
  else if (sort === 'viral') out = out.slice().sort((a, b) => b.applied - a.applied);
  else if (sort === 'prize') out = out.slice().sort((a, b) => (b.prize_cash || 0) - (a.prize_cash || 0));
  return out.slice(0, limit);
}

export function similar(items, o, k = 3) {
  return items
    .filter((x) => x.id !== o.id && x.days_left > 0)
    .map((x) => {
      let s = 0;
      if (x.type === o.type) s += 3;
      s += (x.dom || []).filter((d) => (o.dom || []).includes(d)).length * 2;
      if (x.org === o.org) s += 4;
      if (x.geo === o.geo) s += 1;
      return { x, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((r) => r.x);
}

/* rule-based eligibility check — profile vs listing, honest about unknowns */
export function eligibilityCheck(o, profile) {
  const p = profile || {};
  const out = [];
  // deadline
  out.push(o.days_left > 0
    ? { label: 'Deadline', status: o.days_left <= 3 ? 'warn' : 'pass', note: o.days_left + ' days left — ' + (o.days_left <= 3 ? 'cutting it close' : 'enough runway') }
    : { label: 'Deadline', status: 'fail', note: 'registration has closed' });
  // role / level
  if (p.role) {
    const ok = (o.roles || []).includes(p.role);
    out.push({ label: 'Your level', status: ok ? 'pass' : 'warn', note: ok ? 'open to your level' : `listing targets ${(o.roles || []).join('/')} — double-check the fine print` });
  } else out.push({ label: 'Your level', status: 'unknown', note: 'add your role in your profile for a real check' });
  // geography
  const geoOk = !p.geo || p.geo === 'any' || o.geo === 'remote' || o.geo === p.geo || (p.geo === 'abroad' && o.geo === 'global');
  out.push({ label: 'Location', status: geoOk ? 'pass' : 'warn', note: o.geo === 'remote' ? 'fully remote' : `${o.location} — ${geoOk ? 'fits your preference' : 'outside your stated preference'}` });
  // CGPA if the listing mentions one
  const m = (o.eligibility || '').match(/(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:cgpa|gpa)/i) || (o.eligibility || '').match(/cgpa[^\d]{0,12}(\d+(?:\.\d+)?)/i);
  if (m) {
    const need = parseFloat(m[1]);
    const have = parseFloat(p.cgpa);
    if (!isNaN(have)) out.push({ label: 'CGPA', status: have >= need ? 'pass' : 'fail', note: `needs ${need}, you have ${have}` });
    else out.push({ label: 'CGPA', status: 'unknown', note: `listing asks for ${need} — add yours to your profile` });
  }
  // domain fit (fit, not gate)
  const dom = (o.dom || []).filter((d) => (p.domains || []).includes(d));
  out.push({ label: 'Field fit', status: dom.length ? 'pass' : 'unknown', note: dom.length ? `overlaps ${dom.join(', ')}` : 'no stated field overlap — still open to you' });
  // team
  if (o.team && o.team !== '1') out.push({ label: 'Team', status: 'unknown', note: `${o.team} members — you'll need teammates` });
  return out;
}

export function feedStats(items) {
  const open = items.filter((o) => o.days_left > 0);
  const week = open.filter((o) => o.days_left <= 7);
  const types = {};
  open.forEach((o) => { types[o.type] = (types[o.type] || 0) + 1; });
  return {
    open: open.length,
    closingWeek: week.length,
    prizePool: open.reduce((s, o) => s + (o.prize_cash || 0), 0),
    types,
  };
}

/* worked-back plan (server twin of the client generator, for gen-UI blocks) */
export function planSteps(o) {
  const dl = o.days_left;
  if (dl <= 0) return [];
  const at = (f) => Math.max(0, Math.round(dl * f));
  const lbl = (d) => d === 0 ? 'Today' : new Date(Date.now() + d * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  let steps;
  if (o.type === 'Hackathon' || o.type === 'Competition') {
    steps = [{ d: 0, t: 'Register on ' + (o.display_url || 'the official page') }];
    if (o.team && o.team !== '1') steps.push({ d: at(0.25), t: `Lock your team (${o.team})` });
    steps.push({ d: at(0.5), t: 'First working prototype / draft' }, { d: at(0.85), t: 'Polish + record the demo' }, { d: dl, t: 'Submit before ' + o.deadline, final: true });
  } else if (['Scholarship', 'Fellowship', 'Grant'].includes(o.type)) {
    steps = [{ d: 0, t: 'Read eligibility + gather transcripts' }, { d: at(0.3), t: 'Request recommendation letters' }, { d: at(0.6), t: 'Draft SoP / research statement' }, { d: at(0.85), t: 'Final review' }, { d: dl, t: 'Submit before ' + o.deadline, final: true }];
  } else {
    steps = [{ d: 0, t: 'Grab your spot on ' + (o.display_url || 'the source') }, { d: at(0.6), t: 'Prep: goals, questions, people to meet' }, { d: dl, t: 'Happens ' + o.deadline, final: true }];
  }
  return steps.map((s) => ({ ...s, lbl: lbl(s.d) }));
}

/* compact catalog line for LLM grounding */
export function catalogLine(o) {
  return `[${o.id}] ${o.title} (${o.org}) · ${o.type} · ${o.location} · ${o.days_left}d left · ${o.prize}${o.applied ? ' · ' + o.applied + ' registered' : ''}`;
}
