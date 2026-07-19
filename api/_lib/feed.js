// Scout live feed — aggregates real opportunities from public sources,
// normalizes, scores (e-commerce style ranking) and rotates like a news app.
//
// Sources (no keys needed):
//   Unstop  — hackathons / competitions / scholarships / internships (India-first,
//             real org creatives + registerCount/viewsCount = virality signals)
//   Devpost — global hackathons (full-res real marketing banners, registrations)
//   Curated — evergreen fellowships/grants seed (DAAD, Fulbright, SERB, …)
//
// Files/dirs under api/ starting with "_" are ignored by Vercel routing.

import CURATED from '../_data/opportunities.js';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const FETCH_TIMEOUT = 9000;
const CACHE_TTL = 10 * 60 * 1000;       // warm-lambda memory cache
const ROTATE_BUCKET = 20 * 60 * 1000;   // feed re-shuffles every 20 min

// ————— premium stock pool (real, verified Unsplash photo ids) —————
// Unstop's list API only exposes 150px creatives; like Unstop's own cards we
// pair the real creative (logo chip) with a premium context-matched visual.
const STOCK = {
  hackathon: [
    'photo-1504384308090-c894fdcc538d', 'photo-1517245386807-bb43f82c33c4',
    'photo-1531482615713-2afd69097998', 'photo-1519389950473-47ba0277781c',
    'photo-1556761175-b413da4baf72', 'photo-1522071820081-009f0129c71c',
  ],
  ai: [
    'photo-1620712943543-bcc4688e7485', 'photo-1555255707-c07966088b7b',
    'photo-1507146153580-69a1fe6d8aa1', 'photo-1535378917042-10a22c95931a',
  ],
  business: [
    'photo-1454165804606-c3d57bc86b40', 'photo-1507679799987-c73779587ccf',
    'photo-1444653614773-995cb1ef9efa', 'photo-1486406146926-c627a92ad1ab',
  ],
  research: [
    'photo-1532094349884-543bc11b234d', 'photo-1582719508461-905c673771fd',
    'photo-1576086213369-97a306d36557', 'photo-1614935151651-0bea6508db6b',
  ],
  scholarship: [
    'photo-1523580494863-6f3031224c94', 'photo-1541339907198-e08756dedf3f',
    'photo-1607237138185-eedd9c632b0b', 'photo-1519452635265-7b1fbfd1e4e0',
  ],
  talks: [
    'photo-1540575467063-178a50c2df87', 'photo-1475721027785-f74eccf877e2',
    'photo-1505373877841-8d25f7d46678', 'photo-1587825140708-dfaf72ae4b04',
  ],
  community: [
    'photo-1529156069898-49953e39b3ac', 'photo-1511632765486-a01980e01a18',
    'photo-1543269865-cbf427effbad', 'photo-1528605248644-14dd04022da1',
  ],
  internship: [
    'photo-1497366216548-37526070297c', 'photo-1553877522-43269d4ea984',
    'photo-1497215728101-856f4ea42174', 'photo-1521737604893-d14cc237f11d',
  ],
  climate: [
    'photo-1466611653911-95081537e5b7', 'photo-1509391366360-2e959784a276',
  ],
  design: [
    'photo-1561070791-2526d30994b5', 'photo-1581291518857-4e27b48ff24e',
  ],
};

const ORG_WEIGHT = [
  [/google|microsoft|amazon|meta|apple|nvidia|openai|anthropic|xprize|alibaba|ibm|intel|adobe|slack|stripe/i, 1.0],
  [/daad|fulbright|gates|rhodes|chevening|commonwealth|erasmus|schwarzman|unesco|un |united nations|world bank/i, 0.95],
  [/iit|iim|iisc|xlri|bits|nit |aiims|isb|tifr|serb|dst|niti|drdo|isro/i, 0.85],
  [/tata|reliance|infosys|wipro|flipkart|zomato|razorpay|paytm|phonepe|hdfc|icici|l&t|mahindra/i, 0.8],
  [/accenture|deloitte|ey |kpmg|pwc|mckinsey|bcg|bain/i, 0.75],
];

function orgWeight(org) {
  for (const [re, w] of ORG_WEIGHT) if (re.test(org || '')) return w;
  return 0.35;
}

const DOMAIN_RULES = [
  ['AI/ML', /\bai\b|machine learning|artificial intelligence|deep learning|data science|genai|gen ai|llm|nlp|computer vision|gemini|gpt/i],
  ['Engineering', /coding|developer|software|engineering|robotics|tech|blockchain|web3|cloud|devops|cyber/i],
  ['Business', /case (study|comp)|strategy|consult|marketing|b-school|mba|entrepreneur|startup|product management|business/i],
  ['Finance', /finance|fintech|trading|investment|banking|equity|audit|tax/i],
  ['Design', /design|ui\/ux|ux|graphic|figma|creative/i],
  ['Life Sciences', /bio(logy|tech|medical)|life science|pharma|genomic|neuro/i],
  ['HealthTech', /health|medical|medicine|clinical|wellness/i],
  ['ClimaTech', /climate|sustainab|renewable|energy|environment|green/i],
  ['Policy', /policy|governance|public affairs|law|legal|civic/i],
  ['Social Impact', /social impact|ngo|nonprofit|community|rural|development/i],
  ['Arts', /\bart\b|arts|music|film|photograph|literature|writing/i],
];

function inferDomains(text) {
  const out = [];
  for (const [dom, re] of DOMAIN_RULES) if (re.test(text)) out.push(dom);
  return out.length ? out.slice(0, 3) : ['Engineering'];
}

function inferRoles(text) {
  const t = (text || '').toLowerCase();
  const roles = new Set();
  if (/school|class (9|10|11|12)|k-12/.test(t)) roles.add('school');
  if (/undergrad|b\.?tech|b\.?e\b|bachelor|college student|ug\b/.test(t)) roles.add('ug');
  if (/postgrad|m\.?tech|mba|master|pg\b/.test(t)) roles.add('pg');
  if (/phd|doctoral|research scholar/.test(t)) roles.add('phd');
  if (/faculty|post-doc|postdoc|researcher|scientist/.test(t)) roles.add('researcher');
  if (/professional|working|experienced|fresher/.test(t)) roles.add('professional');
  if (!roles.size) { roles.add('ug'); roles.add('pg'); }
  return [...roles];
}

// deterministic per-item stock pick, stable across requests
function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function stockImg(type, domains, key) {
  let pool;
  const d = (domains || [])[0] || '';
  if (/AI\/ML/.test(d)) pool = STOCK.ai;
  else if (/ClimaTech/.test(d)) pool = STOCK.climate;
  else if (/Design|Arts/.test(d)) pool = STOCK.design;
  else if (/Business|Finance|Policy/.test(d)) pool = STOCK.business;
  else if (/Life Sciences|HealthTech/.test(d)) pool = STOCK.research;
  if (!pool) {
    pool = type === 'Hackathon' ? STOCK.hackathon
      : type === 'Scholarship' ? STOCK.scholarship
      : type === 'Internship' ? STOCK.internship
      : type === 'Competition' ? STOCK.hackathon
      : type === 'Job' ? STOCK.business
      : type === 'Volunteering' ? STOCK.community
      : type === 'Exhibition' ? STOCK.design
      : type === 'Cultural' || type === 'Networking' || type === 'Meetup' ? STOCK.community
      : type === 'Talk' || type === 'Conference' || type === 'Academic' ? STOCK.talks
      : STOCK.research;
  }
  const id = pool[hashCode(String(key)) % pool.length];
  return `https://images.unsplash.com/${id}?w=1200&q=80&auto=format&fit=crop`;
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function daysLeft(iso) {
  if (!iso) return 45;
  const d = (new Date(iso).getTime() - Date.now()) / 86400000;
  return Math.max(0, Math.round(d));
}

async function jfetch(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(url, {
      ...opts,
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'application/json', ...(opts.headers || {}) },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
  finally { clearTimeout(t); }
}

async function tfetch(url, opts = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT);
  try {
    const r = await fetch(url, { ...opts, signal: ctl.signal, headers: { 'user-agent': UA, ...(opts.headers || {}) } });
    if (!r.ok) return null;
    return await r.text();
  } catch { return null; }
  finally { clearTimeout(t); }
}

// ————— Unstop —————
const UNSTOP_TYPES = {
  hackathons: 'Hackathon',
  competitions: 'Competition',
  scholarships: 'Scholarship',
  internships: 'Internship',
  quizzes: 'Quiz',
  workshops: 'Workshop',
  conferences: 'Conference',
  jobs: 'Job',
  cultural: 'Cultural',
};

// paginate: per_page up to 500, page=1..pages (each page distinct)
async function fetchUnstop(category, pages = 1, perPage = 200) {
  const reqs = [];
  for (let p = 1; p <= pages; p++) reqs.push(jfetch(`https://unstop.com/api/public/opportunity/search-result?opportunity=${category}&per_page=${perPage}&oppstatus=open&page=${p}`));
  const results = await Promise.all(reqs);
  const items = results.flatMap((j) => (Array.isArray(j?.data?.data) ? j.data.data : []));
  if (!items.length) return [];
  const type = UNSTOP_TYPES[category];
  return items.map((it) => {
    const org = it.organisation?.name || 'Unstop';
    const prize = (it.prizes || []).reduce((m, p) => Math.max(m, p.cash || p.max_cash || 0), 0);
    const filterText = (it.filters || []).map((f) => f.name).join(' ');
    const skills = (it.required_skills || []).map((s) => s.skill_name || s.skill).filter(Boolean);
    const text = [it.title, org, skills.join(' '), filterText, stripHtml(it.details).slice(0, 400)].join(' ');
    const deadlineIso = it.regnRequirements?.end_regn_dt || it.end_date;
    const dl = daysLeft(deadlineIso);
    const domains = inferDomains(text);
    const city = it.address_with_country_logo?.city;
    const online = (it.region || '').toLowerCase() === 'online';
    const team = it.regnRequirements
      ? (it.regnRequirements.min_team_size === it.regnRequirements.max_team_size
        ? String(it.regnRequirements.max_team_size || 1)
        : `${it.regnRequirements.min_team_size || 1}–${it.regnRequirements.max_team_size || 1}`)
      : '1';
    return {
      id: 'un-' + it.id,
      title: it.title,
      org,
      orgLogo: it.organisation?.logoUrl2 || it.organisation?.logoUrl || null,
      imgThumb: it.logoUrl2 || null,           // the org's real uploaded creative
      img: stockImg(type, domains, it.id),      // premium context visual (Unstop-style fallback)
      realImg: false,
      type,
      dom: domains,
      skills: skills.slice(0, 5),
      roles: inferRoles(filterText + ' ' + it.title),
      geo: online ? 'remote' : 'india',
      location: online ? 'Online' : (city || 'India'),
      deadline_ts: deadlineIso ? Math.floor(new Date(deadlineIso).getTime() / 1000) : null,
      deadline: deadlineIso ? new Date(deadlineIso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Open',
      days_left: dl,
      prize: prize ? '₹' + (prize >= 100000 ? (prize / 100000).toFixed(prize % 100000 ? 1 : 0) + 'L' : prize.toLocaleString('en-IN')) : ((it.prizes || [])[0]?.rank || 'Certificate'),
      prize_cash: prize,
      team,
      applied: it.registerCount || 0,
      views: it.viewsCount || 0,
      source: 'unstop.com',
      source_url: it.seo_url || `https://unstop.com/${it.public_url}`,
      display_url: 'unstop.com',
      description: stripHtml(it.details).slice(0, 460),
      eligibility: filterText || 'Open — see listing for details.',
      regn_start: it.regnRequirements?.start_regn_dt || null,
      updated_at: it.updated_at || null,
    };
  });
}

// ————— Devpost —————
async function fetchDevpost(page = 1) {
  const j = await jfetch(`https://devpost.com/api/hackathons?page=${page}&per_page=40&status[]=open&status[]=upcoming`);
  const items = j?.hackathons;
  if (!Array.isArray(items)) return [];
  return items.filter((h) => h.open_state === 'open' || h.open_state === 'upcoming').map((h) => {
    const prizeNum = parseInt(stripHtml(h.prize_amount || '').replace(/[^0-9]/g, ''), 10) || 0;
    const themes = (h.themes || []).map((t) => t.name);
    const text = [h.title, h.organization_name, themes.join(' ')].join(' ');
    const thumb = h.thumbnail_url ? ('https:' + h.thumbnail_url).replace('//d112', 'https://d112').replace('https:https:', 'https:') : null;
    const img = thumb ? thumb.replace('medium_square', 'original') : null;
    // "about 1 month left" | "11 days left" → rough day count
    const tl = h.time_left_to_submission || '';
    let dl = 30;
    const dm = tl.match(/(\d+)\s*day/); const mm = tl.match(/(\d+)?\s*(about a|\d+)?\s*month/);
    if (dm) dl = parseInt(dm[1], 10);
    else if (mm) dl = (parseInt(mm[2], 10) || 1) * 30;
    const domains = inferDomains(text);
    return {
      id: 'dp-' + h.id,
      title: h.title.trim(),
      org: h.organization_name || 'Devpost',
      orgLogo: null,
      imgThumb: thumb,
      img: img || stockImg('Hackathon', domains, h.id),
      realImg: !!img,                            // real marketing banner from the org
      type: 'Hackathon',
      dom: domains,
      skills: themes.slice(0, 5),
      roles: ['ug', 'pg', 'professional'],
      geo: 'remote',
      location: h.displayed_location?.location || 'Online',
      deadline_ts: null,
      deadline: (h.submission_period_dates || '').split('-').pop().trim() || 'Open',
      days_left: dl,
      prize: prizeNum ? '$' + (prizeNum >= 1e6 ? (prizeNum / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : prizeNum >= 1000 ? Math.round(prizeNum / 1000) + 'K' : prizeNum) : 'Prizes',
      prize_cash: prizeNum * 83, // rough INR for scoring comparability
      team: '1–4',
      applied: h.registrations_count || 0,
      views: 0,
      source: 'devpost.com',
      source_url: h.url,
      display_url: 'devpost.com',
      description: `${h.title.trim()} — global hackathon by ${h.organization_name || 'Devpost'}. Themes: ${themes.join(', ') || 'Open'}. ${h.prize_amount ? 'Prize pool ' + stripHtml(h.prize_amount) + '.' : ''} Submissions ${h.submission_period_dates || 'open now'}. ${h.prizes_counts?.cash ? h.prizes_counts.cash + ' cash prizes.' : ''}`,
      eligibility: h.eligibility_requirement_invite_only_description || 'Open globally — remote participation.',
      period: h.submission_period_dates || null,
      updated_at: null,
      featured: !!h.featured,
    };
  });
}

// ————— confs.tech — tech conferences + open CFPs (keyless GitHub JSON) —————
const CONF_FILES = ['general', 'javascript', 'data', 'devops', 'security', 'php', 'java', 'ux', 'android', 'typescript', 'dotnet', 'python', 'leadership', 'graphql', 'ios', 'css', 'rust', 'kotlin', 'sre', 'clojure'].map((t) => '2026/' + t).concat(['2027/general', '2027/data', '2027/java']);
const CONF_DOMAIN = { data: ['AI/ML'], javascript: ['Engineering'], devops: ['Engineering'], ux: ['Design'], security: ['Engineering'], python: ['AI/ML'], leadership: ['Business'], general: ['Engineering'] };

async function fetchConfsTech() {
  const lists = await Promise.all(CONF_FILES.map((f) =>
    jfetch(`https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/${f}.json`)
      .then((j) => (Array.isArray(j) ? j.map((c) => ({ ...c, _topic: f.split('/')[1] })) : []))));
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set();
  const out = [];
  for (const c of lists.flat()) {
    if (!c.name || !c.startDate || (c.endDate || c.startDate) < today) continue;
    const k = (c.name + c.startDate).toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    const domains = CONF_DOMAIN[c._topic] || ['Engineering'];
    const india = c.country === 'India';
    const dl = daysLeft(c.startDate + 'T18:30:00+05:30');
    const cfpOpen = c.cfpEndDate && c.cfpEndDate >= today;
    const base = {
      orgLogo: null, imgThumb: null, realImg: false,
      dom: domains, skills: [c._topic], roles: ['ug', 'pg', 'phd', 'researcher', 'professional'],
      geo: c.online ? 'remote' : india ? 'india' : 'global',
      location: c.online ? 'Online' : [c.city, c.country].filter(Boolean).join(', '),
      team: '1', views: 0, prize_cash: 0,
      source: 'confs.tech', display_url: 'confs.tech',
      eligibility: 'Open to everyone — get a ticket' + (c.cocUrl ? '. Has a code of conduct.' : '.'),
      updated_at: null,
    };
    out.push({
      ...base,
      id: 'ct-' + hashCode(k),
      title: c.name,
      org: c.name.split(/ \d{4}/)[0],
      img: stockImg('Conference', domains, k),
      type: 'Conference',
      deadline_ts: Math.floor(new Date(c.startDate).getTime() / 1000),
      deadline: new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      days_left: dl,
      prize: cfpOpen ? 'CFP open' : (c.online ? 'Online' : 'In person'),
      applied: 0,
      source_url: c.url,
      description: `${c.name} — ${c.online ? 'online ' : ''}tech conference${base.location !== 'Online' ? ' in ' + base.location : ''}, ${new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}${c.endDate && c.endDate !== c.startDate ? '–' + new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : ''}. Topic: ${c._topic}.${cfpOpen ? ` Call for speakers is OPEN until ${c.cfpEndDate}.` : ''}`,
    });
    // an open CFP is its own opportunity: a stage to speak on
    if (cfpOpen && c.cfpUrl) {
      out.push({
        ...base,
        id: 'cfp-' + hashCode(k),
        title: 'Speak at ' + c.name,
        org: c.name.split(/ \d{4}/)[0],
        img: stockImg('Talk', domains, k + 'cfp'),
        type: 'Talk',
        deadline_ts: Math.floor(new Date(c.cfpEndDate).getTime() / 1000),
        deadline: new Date(c.cfpEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        days_left: daysLeft(c.cfpEndDate + 'T18:30:00+05:30'),
        prize: 'Speaker slot',
        applied: 0,
        source_url: c.cfpUrl,
        description: `Call for speakers: pitch a talk for ${c.name} (${base.location}, ${new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}). CFP closes ${c.cfpEndDate}. A accepted talk = free stage, free ticket, instant credibility.`,
      });
    }
  }
  return out;
}

// ————— lu.ma discover — real community events in Indian metros (keyless) —————
const LUMA_PLACES = [
  ['discplace-G0tGUVYwl7T17Sb', 'Bengaluru'],
  ['discplace-CzipmKodUYN2Dfx', 'Delhi'],
  ['discplace-Q5hkYsjZs1ZDJcU', 'Mumbai'],
];
function lumaType(name) {
  const t = name.toLowerCase();
  if (/workshop|bootcamp|hands-on|masterclass|build along|\bclass\b|cohort/.test(t)) return 'Workshop';
  if (/exhibition|gallery|art show|showcase|screening|\bfilm\b|exhibit|open studio/.test(t)) return 'Exhibition';
  if (/concert|\bmusic\b|dance|festival|comedy|open mic|poetry|theatre|cultural/.test(t)) return 'Cultural';
  if (/networking|mixer|founders|leaders|\bsocial\b|brunch|dinner|happy hour|connect/.test(t)) return 'Networking';
  if (/talk|panel|fireside|keynote|discussion|ama\b|q&a|conference|summit|demo day/.test(t)) return 'Talk';
  if (/hack|buildathon/.test(t)) return 'Hackathon';
  return 'Meetup';
}
async function fetchLuma(placeId, city) {
  const j = await jfetch(`https://api.lu.ma/discover/get-paginated-events?discover_place_api_id=${placeId}&pagination_limit=100`);
  const entries = j?.entries;
  if (!Array.isArray(entries)) return [];
  return entries.map((en) => {
    const e = en.event || {};
    if (!e.name || !e.start_at) return null;
    const type = lumaType(e.name);
    const online = e.location_type === 'online';
    const text = e.name;
    const domains = inferDomains(text);
    return {
      id: 'lu-' + (e.api_id || hashCode(e.name + e.start_at)),
      title: e.name,
      org: (e.geo_address_info?.city || city) + ' community',
      orgLogo: null,
      imgThumb: e.cover_url || null,
      img: e.cover_url || stockImg(type, domains, e.name),
      realImg: !!e.cover_url,
      type,
      dom: domains,
      skills: [],
      roles: ['ug', 'pg', 'phd', 'researcher', 'professional'],
      geo: online ? 'remote' : 'india',
      location: online ? 'Online' : (e.geo_address_info?.city || city),
      deadline_ts: Math.floor(new Date(e.start_at).getTime() / 1000),
      deadline: new Date(e.start_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      days_left: daysLeft(e.start_at),
      prize: 'Free / RSVP',
      prize_cash: 0,
      team: '1',
      applied: 0,
      views: 0,
      source: 'lu.ma',
      source_url: 'https://lu.ma/' + (e.url || ''),
      display_url: 'lu.ma',
      description: `${e.name} — ${type.toLowerCase()} in ${online ? 'your browser' : (e.geo_address_info?.city || city)} on ${new Date(e.start_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}${e.timezone ? ' (' + e.timezone + ')' : ''}. Live from the ${city} lu.ma community calendar.`,
      eligibility: 'Open — RSVP on lu.ma.',
      updated_at: null,
    };
  }).filter(Boolean);
}

// ————— MLH — official season events, real banners (Inertia JSON in HTML) —————
async function fetchMLH() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT);
    const r = await fetch('https://mlh.io/seasons/2026/events', { signal: ctl.signal, headers: { 'user-agent': UA } });
    clearTimeout(t);
    if (!r.ok) return [];
    const html = await r.text();
    const m = html.match(/<script data-page="app" type="application\/json">(.*?)<\/script>/s);
    if (!m) return [];
    const events = JSON.parse(m[1])?.props?.upcomingEvents || [];
    return events.map((e) => ({
      id: 'mlh-' + e.id,
      title: e.name,
      org: 'Major League Hacking',
      orgLogo: e.logoUrl || null,
      imgThumb: e.logoUrl || e.backgroundUrl || null,
      img: e.backgroundUrl || stockImg('Hackathon', ['Engineering'], e.id),
      realImg: !!e.backgroundUrl,
      type: 'Hackathon',
      dom: inferDomains(e.name),
      skills: [],
      roles: ['school', 'ug', 'pg'],
      geo: e.formatType === 'digital' ? 'remote' : 'global',
      location: e.formatType === 'digital' ? 'Online' : (e.location || 'In person'),
      deadline_ts: e.startsAt ? Math.floor(new Date(e.startsAt).getTime() / 1000) : null,
      deadline: e.startsAt ? new Date(e.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : (e.dateRange || 'Soon'),
      days_left: e.startsAt ? daysLeft(e.startsAt) : 30,
      prize: 'Swag + glory',
      prize_cash: 0,
      team: '1–4',
      applied: 0,
      views: 0,
      source: 'mlh.io',
      source_url: e.websiteUrl || ('https://mlh.io' + (e.url || '')),
      display_url: 'mlh.io',
      description: `${e.name} — official MLH ${e.formatType === 'digital' ? 'digital' : 'in-person'} hackathon, ${e.dateRange || ''}${e.location ? ' · ' + e.location : ''}. Part of the MLH 2026 season.`,
      eligibility: 'Students and early-career hackers worldwide.',
      updated_at: null,
    }));
  } catch { return []; }
}

// ————— Devfolio — open Indian hackathons with real covers (keyless POST) —————
async function fetchDevfolio() {
  const j = await jfetch('https://api.devfolio.co/api/search/hackathons', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'application_open', from: 0, size: 20 }),
  });
  const hits = j?.hits?.hits;
  if (!Array.isArray(hits)) return [];
  return hits.map((h) => {
    const s = h._source || {};
    if (!s.name) return null;
    const online = !!s.is_online;
    const deadlineIso = s.hackathon_setting?.reg_ends_at || s.starts_at;
    const text = [s.name, s.tagline, (s.themes || []).map((t) => t.name || t).join(' ')].join(' ');
    return {
      id: 'df-' + (s.uuid || s.slug),
      title: s.name,
      org: s.name,
      orgLogo: s.hackathon_setting?.logo || null,
      imgThumb: s.hackathon_setting?.logo || s.cover_img || null,
      img: s.cover_img || stockImg('Hackathon', inferDomains(text), s.slug),
      realImg: !!s.cover_img,
      type: 'Hackathon',
      dom: inferDomains(text),
      skills: (s.themes || []).map((t) => t.name || t).filter((x) => typeof x === 'string').slice(0, 5),
      roles: ['ug', 'pg', 'professional'],
      geo: online ? 'remote' : 'india',
      location: online ? 'Online' : [s.city, s.state].filter(Boolean).join(', ') || 'India',
      deadline_ts: deadlineIso ? Math.floor(new Date(deadlineIso).getTime() / 1000) : null,
      deadline: deadlineIso ? new Date(deadlineIso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Open',
      days_left: daysLeft(deadlineIso),
      prize: (s.prizes || []).length ? (s.prizes.length + ' prize tiers') : 'Prizes',
      prize_cash: 0,
      team: s.team_min && s.team_size ? `${s.team_min}–${s.team_size}` : '1–4',
      applied: s.participants_count || 0,
      views: 0,
      source: 'devfolio.co',
      source_url: s.hackathon_setting?.site || `https://${s.slug}.devfolio.co`,
      display_url: 'devfolio.co',
      description: `${s.name}${s.tagline ? ' — ' + s.tagline : ''}. ${stripHtml(s.desc || '').slice(0, 900)}`,
      eligibility: 'Open — register on Devfolio.',
      regn_start: s.hackathon_setting?.reg_starts_at || null,
      updated_at: null,
    };
  }).filter(Boolean);
}

// ————— ConnectFor — India volunteering / social-work (keyless, ~1050) —————
function ddmmyyyy(s) {
  const m = String(s || '').match(/(\d{2})-(\d{2})-(\d{4})/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}
const CAUSE_DOM = { environment: 'ClimaTech', health: 'HealthTech', animal: 'Social Impact', women: 'Social Impact', child: 'Social Impact', education: 'Social Impact', disab: 'Social Impact' };
let _cfImg = null;
async function connectforImages() {
  if (_cfImg) return _cfImg;
  const j = await jfetch('https://www.connectfor.org/detaileventimglst').catch(() => null);
  _cfImg = {};
  if (j && typeof j === 'object') for (const [k, v] of Object.entries(j)) {
    const parts = String(v).split('~~');
    _cfImg[k] = { detail: 'https://connectfor.org/' + parts[0], thumb: 'https://connectfor.org/' + (parts[1] || parts[0]) };
  }
  return _cfImg;
}
async function fetchConnectFor(pages = 8) {
  const [imgMap, ...results] = await Promise.all([
    connectforImages().catch(() => ({})),
    ...Array.from({ length: pages }, (_, i) => jfetch(`https://connectfor.org/api/connectfor-dashboard-service/dashboard/opportunity/explore?pgNo=${i + 1}&pgSize=100`)),
  ]);
  const items = results.flatMap((j) => (Array.isArray(j?.eventsList) ? j.eventsList : []));
  const now = Date.now();
  return items.map((it) => {
    if (!it.eventName) return null;
    const end = ddmmyyyy(it.endDate);
    let dl = end ? Math.round((end.getTime() - now) / 86400000) : 30;
    if (dl > 120 || dl < 0) dl = 45;                       // far-future placeholders → rolling
    const causes = Array.isArray(it.causesArea) ? it.causesArea.filter(Boolean) : [];
    const online = /remote|virtual/i.test(it.whrWillOprBe || '');
    const img = imgMap[it.oprCategory];
    const dom = ['Social Impact'];
    const ctext = causes.join(' ').toLowerCase();
    for (const [k, d] of Object.entries(CAUSE_DOM)) if (ctext.includes(k) && !dom.includes(d)) dom.push(d);
    const loc = it.onsiteCity || it.centre || 'Pan India';
    return {
      id: 'cf-' + (it.aLink ? it.aLink.split('/').pop() : hashCode(it.eventName + (it.ngoName || ''))),
      title: it.eventName,
      org: it.ngoName || 'NGO partner',
      orgLogo: null,
      imgThumb: img ? img.thumb : null,
      img: img ? img.detail : stockImg('Volunteering', dom, it.eventName),
      realImg: !!img,
      type: 'Volunteering',
      dom,
      skills: causes.slice(0, 4),
      roles: ['school', 'ug', 'pg', 'phd', 'researcher', 'professional'],
      geo: online ? 'remote' : 'india',
      location: online ? 'Remote' : loc,
      deadline_ts: end ? Math.floor(end.getTime() / 1000) : null,
      deadline: end ? end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Ongoing',
      days_left: Math.max(0, dl),
      prize: it.hrsPerSession ? it.hrsPerSession + 'h/session' : 'Give time',
      prize_cash: 0,
      team: '1',
      applied: it.volReq || 0,
      views: 0,
      source: 'connectfor.org',
      source_url: 'https://connectfor.org/' + (it.aLink || '') + '?source=explore',
      display_url: 'connectfor.org',
      description: `${it.eventName} with ${it.ngoName || 'an NGO'} — ${causes.join(', ') || 'social work'} in ${loc}${it.whrWillOprBe ? ' (' + it.whrWillOprBe + ')' : ''}.${it.volReq ? ' Seeking ' + it.volReq + ' volunteers.' : ''}`,
      eligibility: 'Open to volunteers — no cost. Sign up on ConnectFor.',
      cause: causes[0] || 'Community',
      updated_at: it.lastUpdated || null,
    };
  }).filter(Boolean);
}

// ————— WikiCFP — academic call-for-papers, India-filtered (keyless RSS) —————
async function fetchWikiCFP() {
  const cats = ['computer%20science', 'data%20science', 'machine%20learning', 'artificial%20intelligence', 'engineering'];
  const texts = await Promise.all(cats.map((c) => tfetch(`http://www.wikicfp.com/cfp/rss?cat=${c}`)));
  const out = [], seen = new Set();
  const clean = (s) => (s || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  for (const xml of texts) {
    if (!xml) continue;
    for (const chunk of xml.split(/<item>/).slice(1)) {
      const title = clean((chunk.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
      const link = clean((chunk.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
      const desc = clean((chunk.match(/<description>([\s\S]*?)<\/description>/) || [])[1]);
      if (!title || !link) continue;
      if (!/,\s*India|\bIndia\b/i.test(desc)) continue;         // India only
      const key = title.toLowerCase(); if (seen.has(key)) continue; seen.add(key);
      const locm = desc.match(/([A-Za-z][A-Za-z .]+,\s*India)/);
      out.push({
        id: 'wcfp-' + hashCode(title),
        title: title.length > 92 ? title.slice(0, 90) + '…' : title,
        org: title.split(/\s\d{4}/)[0].slice(0, 44),
        orgLogo: null, imgThumb: null,
        img: stockImg('Academic', inferDomains(title + ' ' + desc), title),
        realImg: false, type: 'Academic', dom: inferDomains(title + ' ' + desc), skills: [],
        roles: ['ug', 'pg', 'phd', 'researcher', 'professional'],
        geo: 'india', location: locm ? locm[1].trim() : 'India',
        deadline_ts: null, deadline: 'CFP open', days_left: 40,
        prize: 'Call for papers', prize_cash: 0, team: '1', applied: 0, views: 0,
        source: 'wikicfp.com', source_url: link.startsWith('http') ? link : 'http://www.wikicfp.com' + link, display_url: 'wikicfp.com',
        description: (desc.slice(0, 360) || 'Academic call for papers — ' + title) + '.',
        eligibility: 'Researchers & students — submit a paper.', updated_at: null,
      });
    }
  }
  return out;
}

// ————— Art Institute of Chicago — open exhibitions (keyless, global) —————
async function fetchArtic() {
  const j = await jfetch('https://api.artic.edu/api/v1/exhibitions?limit=100&fields=id,title,status,aic_start_date,aic_end_date,gallery_title,short_description,image_url,web_url');
  const items = j?.data;
  if (!Array.isArray(items)) return [];
  const now = Date.now();
  return items.filter((e) => e.title && (e.status === 'Open' || e.status === 'Confirmed')).slice(0, 40).map((e) => {
    const end = e.aic_end_date ? new Date(e.aic_end_date) : null;
    const dl = end && end.getTime() > now ? Math.round((end.getTime() - now) / 86400000) : 30;
    return {
      id: 'art-' + e.id, title: e.title, org: 'Art Institute of Chicago', orgLogo: null,
      imgThumb: e.image_url || null, img: e.image_url || stockImg('Exhibition', ['Arts'], e.id), realImg: !!e.image_url,
      type: 'Exhibition', dom: ['Arts'], skills: [], roles: ['school', 'ug', 'pg', 'phd', 'researcher', 'professional'],
      geo: 'global', location: (e.gallery_title ? e.gallery_title + ', ' : '') + 'Chicago',
      deadline_ts: end && end.getTime() > now ? Math.floor(end.getTime() / 1000) : null,
      deadline: end && end.getTime() > now ? end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'On view',
      days_left: Math.max(0, dl),
      prize: 'Exhibition', prize_cash: 0, team: '1', applied: 0, views: 0,
      source: 'artic.edu', source_url: e.web_url || 'https://www.artic.edu/exhibitions', display_url: 'artic.edu',
      description: (e.short_description ? stripHtml(e.short_description) : 'A current exhibition at the Art Institute of Chicago') + '.',
      eligibility: 'Open to the public.', updated_at: null,
    };
  });
}

// ————— Curated seed (fellowships / grants — evergreen) —————
function curated() {
  const now = Date.now() / 1000;
  return CURATED.map((r) => {
    // roll static deadlines forward so the evergreen seed never looks dead
    let dl = r.days_left ?? 45;
    const ts = now + dl * 86400;
    return {
      id: 'cu-' + r.id,
      title: r.title,
      org: r.org,
      orgLogo: null,
      imgThumb: null,
      img: r.img,
      realImg: false,
      type: r.type,
      dom: r.dom || [r.domain],
      skills: [],
      roles: r.roles || ['ug', 'pg'],
      geo: r.geo,
      location: r.location,
      deadline_ts: Math.floor(ts),
      deadline: new Date(ts * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      days_left: dl,
      prize: r.stipend,
      prize_cash: 0,
      team: '1',
      applied: r.applied || 0,
      views: 0,
      source: r.display_url || 'curated',
      source_url: r.source_url,
      display_url: r.display_url,
      description: r.description,
      eligibility: r.eligibility,
      duration: r.duration,
      updated_at: null,
    };
  });
}

// ————— scoring: e-commerce style ranking —————
// urgency (closing soon converts) + virality (social proof) + prize (value)
// + org gravity (brand) + freshness. Weights tuned like a marketplace feed.
function scoreItem(o, maxApplied) {
  const dl = o.days_left;
  // urgency: peaks 2–10 days out, decays after; dead if expired
  const urgency = dl <= 0 ? 0 : dl <= 2 ? 0.85 : dl <= 10 ? 1 : dl <= 21 ? 0.7 : dl <= 45 ? 0.45 : 0.25;
  // virality: log-normalized registrations + view→register conversion
  const vir = Math.log1p(o.applied) / Math.log1p(Math.max(maxApplied, 10));
  const conv = o.views > 50 ? Math.min(1, (o.applied / o.views) * 8) : 0.3;
  const virality = vir * 0.75 + conv * 0.25;
  // prize on log scale (₹10L ≈ 1.0)
  const prize = Math.min(1, Math.log1p(o.prize_cash || 0) / Math.log1p(1000000));
  const brand = orgWeight(o.org);
  const fresh = o.updated_at ? Math.max(0, 1 - (Date.now() - new Date(o.updated_at).getTime()) / (14 * 86400000)) : 0.4;
  return urgency * 0.30 + virality * 0.25 + prize * 0.15 + brand * 0.20 + fresh * 0.10;
}

// ————— rotation: deterministic weighted shuffle per time bucket —————
// Google-News feel: high scores usually lead, but order re-deals every bucket.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rotate(items, bucket) {
  const rnd = mulberry32(bucket);
  const sorted = items.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  // only weighted-shuffle the high-value head (O(HEAD^2)); the long tail gets a cheap
  // Fisher–Yates so the whole feed still re-deals each bucket without O(n^2) cost
  const HEAD = 600;
  const pool = sorted.slice(0, HEAD);
  const tail = sorted.slice(HEAD);
  const out = [];
  while (pool.length) {
    let total = 0;
    const w = pool.map((o) => { const v = Math.pow((o.score || 0) + 0.05, 2); total += v; return v; });
    let r = rnd() * total, idx = 0;
    for (; idx < w.length - 1; idx++) { r -= w[idx]; if (r <= 0) break; }
    out.push(pool.splice(idx, 1)[0]);
  }
  for (let i = tail.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = tail[i]; tail[i] = tail[j]; tail[j] = t; }
  return out.concat(tail);
}

// ————— main entry —————
let _cache = { at: 0, items: null, live: false };

export async function getFeed() {
  if (_cache.items && Date.now() - _cache.at < CACHE_TTL) return _cache;

  const results = await Promise.all([
    fetchUnstop('hackathons', 1, 200),
    fetchUnstop('competitions', 2, 200),   // ~227
    fetchUnstop('scholarships', 1, 100),
    fetchUnstop('internships', 2, 500),    // ~838
    fetchUnstop('jobs', 3, 500),           // ~1500 of 1631
    fetchUnstop('quizzes', 1, 100),
    fetchUnstop('workshops', 1, 100),
    fetchUnstop('conferences', 1, 100),
    fetchUnstop('cultural', 1, 100),
    fetchDevpost(1), fetchDevpost(2), fetchDevpost(3),
    fetchDevfolio(),
    fetchMLH(),
    fetchConfsTech(),
    fetchConnectFor(10),                   // ~1000 volunteering
    fetchWikiCFP(),                        // academic CFPs (India)
    fetchArtic(),                          // global exhibitions
    ...LUMA_PLACES.map(([id, city]) => fetchLuma(id, city)),
  ]);
  const live = results.flat().filter(Boolean);
  const all = [...live, ...curated()];

  // dedupe by title+org
  const seen = new Set();
  const deduped = all.filter((o) => {
    const k = (o.title + '|' + o.org).toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });

  const maxApplied = deduped.reduce((m, o) => Math.max(m, o.applied), 10);
  for (const o of deduped) o.score = scoreItem(o, maxApplied);

  const bucket = Math.floor(Date.now() / ROTATE_BUCKET);
  const items = rotate(deduped, bucket);

  _cache = { at: Date.now(), items, live: live.length > 0, liveCount: live.length, bucket };
  return _cache;
}

export function searchFeed(items, q) {
  const ql = (q || '').toLowerCase().trim();
  if (!ql) return items;
  const terms = ql.split(/\s+/);
  return items
    .map((o) => {
      const hay = [o.title, o.org, o.description, o.type, (o.dom || []).join(' '), (o.skills || []).join(' ')].join(' ').toLowerCase();
      let s = 0;
      for (const t of terms) if (t && hay.includes(t)) s++;
      return { o, s };
    })
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((r) => r.o);
}
