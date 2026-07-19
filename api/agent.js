// POST /api/agent — Scout's agent, LangChain-style pipeline in plain JS:
//   intent router → deterministic ontology tools → LLM narrative → UI blocks.
// The LLM never invents listings: cards/eligibility/plans are computed from the
// live feed by api/_lib/ontology.js; the model only writes the connective prose.
//
// Request:  { msg, ctx:{intent,oppId}, history:[{r,c}], profile, ui:true }
// Response: { text, blocks:[ {type:'text',html} | {type:'cards',items,reason}
//            | {type:'eligibility',opp,criteria} | {type:'plan',opp,steps}
//            | {type:'stat',n,label,sub} | {type:'compare',items}
//            | {type:'form'} | {type:'chips',options} ] }
import { callLLM } from './_lib/llm.js';
import { getFeed } from './_lib/feed.js';
import { recommend, facetQuery, similar, eligibilityCheck, feedStats, planSteps, catalogLine, fitScore } from './_lib/ontology.js';

const SYSTEM = `You are Scout — a sharp, warm agent that helps Indian students and researchers actually WIN opportunities: fellowships, grants, hackathons, scholarships, internships, conferences, talks.
Rules:
- Be concrete and specific to THIS user and THESE listings. Never generic. Never invent listings — structured data is shown separately; your job is the connective narrative.
- Indian context aware: CGPA vs GPA, GATE/NET, visa/funding nuance for abroad.
- Keep it tight: 1-3 sentences unless drafting documents.
- FORMAT: raw HTML in a chat bubble. NEVER markdown or LaTeX. Only <b> and <br> allowed.`;

const stripHtml = (s) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const card = (o, profile) => ({
  id: o.id, title: o.title, org: o.org, type: o.type, img: o.imgThumb || o.img,
  days_left: o.days_left, deadline: o.deadline, prize: o.prize, applied: o.applied,
  location: o.location, fit: o._fit || fitScore(o, profile),
});

// ————— intent router (fast deterministic pass) —————
const TYPE_WORDS = { hackathon: 'Hackathon', competition: 'Competition', scholarship: 'Scholarship', internship: 'Internship', fellowship: 'Fellowship', grant: 'Grant', conference: 'Conference', talk: 'Talk', workshop: 'Workshop', quiz: 'Quiz', meetup: 'Meetup' };
function route(msg, ctx) {
  const t = msg.toLowerCase();
  if (/eligib|qualify|can i (apply|enter|join)|am i (fit|good)/.test(t)) return 'eligibility';
  if (/\b(plan|checklist|schedule|timeline|prepare|work back)\b/.test(t)) return 'plan';
  if (/\b(draft|sop|statement|essay|motivation|letter|write)\b/.test(t)) return 'draft';
  if (/\b(compare|versus|vs\.?|which one|better)\b/.test(t)) return 'compare';
  if (/\b(profile|my goal|about me|preferences|tune)\b/.test(t)) return 'form';
  if (/clos|deadline|this week|urgent|expiring|racing/.test(t)) return 'closing';
  if (/\b(match|recommend|for me|best|suggest|find|show|search|looking for|what should)\b/.test(t)) return 'recommend';
  if (ctx && ctx.oppId && /how|help|apply/.test(t)) return 'plan';
  return 'general';
}
function detectFacets(msg) {
  const t = msg.toLowerCase();
  const f = {};
  for (const [w, T] of Object.entries(TYPE_WORDS)) if (t.includes(w)) { f.type = T; break; }
  const dm = t.match(/\b(ai|ml|machine learning|design|climate|bio|health|finance|policy|business|arts?)\b/);
  if (dm) f.domain = { ai: 'AI/ML', ml: 'AI/ML', 'machine learning': 'AI/ML', design: 'Design', climate: 'ClimaTech', bio: 'Life Sciences', health: 'HealthTech', finance: 'Finance', policy: 'Policy', business: 'Business', art: 'Arts', arts: 'Arts' }[dm[1]];
  const days = t.match(/(\d+)\s*days?/);
  if (days) f.maxDays = parseInt(days[1], 10);
  else if (/this week|7 days|week/.test(t)) f.maxDays = 7;
  if (/remote|online/.test(t)) f.geo = 'remote';
  return f;
}

// ————— narrative helper: LLM writes prose around computed data —————
async function narrate(prompt, fallback) {
  const ai = await callLLM({ system: SYSTEM, messages: [{ role: 'user', content: prompt }], max_tokens: 380 });
  return ai.ok ? ai.text : fallback;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { msg, ctx, history, profile, ui } = body;
  if (!msg) return res.status(400).json({ error: 'msg required' });

  const feed = await getFeed();
  const items = feed.items;
  const opp = ctx && ctx.oppId ? items.find((o) => String(o.id) === String(ctx.oppId)) : null;
  const intent = route(msg, ctx);
  const blocks = [];
  let say = '';
  const pName = profile && profile.role ? '' : ' (tip: a filled profile sharpens every answer)';

  try {
    if (intent === 'recommend' || intent === 'closing') {
      const facets = detectFacets(msg);
      if (intent === 'closing' && !facets.maxDays) facets.maxDays = 7;
      let picks = Object.keys(facets).length
        ? facetQuery(items, { ...facets, sort: intent === 'closing' ? 'closing' : undefined, limit: 6 })
        : recommend(items, profile, 6);
      if (!picks.length) picks = recommend(items, profile, 6);
      picks = picks.map((o) => ({ ...o, _fit: fitScore(o, profile) }));
      const stats = feedStats(items);
      if (intent === 'closing') blocks.push({ type: 'stat', n: stats.closingWeek, label: 'close in 7 days', sub: '₹' + Math.round(stats.prizePool / 1e6) / 10 + ' Cr live across ' + stats.open + ' listings' });
      blocks.push({ type: 'cards', items: picks.map((o) => card(o, profile)), reason: intent === 'closing' ? 'soonest first' : 'ranked by your fit' });
      say = await narrate(
        `User asked: "${msg}". You computed these real matches (already shown to them as cards, do NOT relist them):\n${picks.map(catalogLine).join('\n')}\nUser profile: ${JSON.stringify(profile || {})}\nWrite 1-2 sharp sentences: the single strongest pick and why, plus one caveat or tactic.`,
        `Top of the stack: <b>${picks[0] ? picks[0].title : 'nothing yet'}</b> — strongest blend of fit and urgency${pName}.`);
      blocks.push({ type: 'chips', options: ['Am I eligible for the top one?', 'Build me a plan for it', 'Show only remote ones'] });
    } else if (intent === 'eligibility') {
      const target = opp || recommend(items, profile, 1)[0];
      if (target) {
        const criteria = eligibilityCheck(target, profile);
        blocks.push({ type: 'eligibility', opp: card(target, profile), criteria });
        const fails = criteria.filter((c) => c.status === 'fail').length;
        const unknowns = criteria.filter((c) => c.status === 'unknown').length;
        say = await narrate(
          `User asked eligibility for ${target.title}. Computed criteria (already shown as a checklist): ${JSON.stringify(criteria)}. Profile: ${JSON.stringify(profile || {})}. One honest sentence: overall verdict + the single thing to fix or confirm.`,
          fails ? 'One hard blocker — see the checklist.' : unknowns ? `Likely eligible — ${unknowns} item${unknowns > 1 ? 's' : ''} to confirm${pName}.` : 'You clear every check I can verify. Go.');
        if (unknowns) blocks.push({ type: 'form' });
        blocks.push({ type: 'chips', options: ['Build me a plan for it', 'Draft my SoP', 'Show similar ones'] });
      } else say = 'Tell me which listing to check — or say "find matches" first.';
    } else if (intent === 'plan') {
      const target = opp || recommend(items, profile, 1)[0];
      if (target) {
        blocks.push({ type: 'plan', opp: card(target, profile), steps: planSteps(target) });
        say = await narrate(
          `User wants an application plan for ${catalogLine(target)}. A worked-back schedule is already shown. One sentence: the one step people underestimate for this type (${target.type}).`,
          `Worked back from ${target.deadline} — the middle step is where most people slip.`);
        blocks.push({ type: 'chips', options: ['Draft the first document', 'Am I eligible?', 'Add deadline to calendar'] });
      } else say = 'Pick a listing and I\'ll work the plan back from its deadline.';
    } else if (intent === 'compare') {
      const picks = opp ? [opp, ...similar(items, opp, 2)] : recommend(items, profile, 3);
      blocks.push({ type: 'compare', items: picks.map((o) => card(o, profile)) });
      say = await narrate(
        `User wants a comparison. Rows shown: ${picks.map(catalogLine).join(' | ')}. Profile: ${JSON.stringify(profile || {})}. One sentence: which to prioritise and the deciding factor.`,
        `On pure fit-per-day-of-effort, <b>${picks[0] ? picks[0].title : '—'}</b> wins.`);
    } else if (intent === 'form') {
      blocks.push({ type: 'form' });
      say = 'Tune these and every ranking, rail and eligibility check re-computes instantly.';
    } else if (intent === 'draft') {
      const target = opp || recommend(items, profile, 1)[0];
      const draft = await narrate(
        `Draft the requested document. Request: "${msg}". ${target ? 'Opportunity: ' + catalogLine(target) + '. Eligibility: ' + target.eligibility + '.' : ''} Profile: ${JSON.stringify(profile || {})}. Write real, usable prose (250-350 words), personal and specific — no placeholders like [Name]. If profile details are missing, write around them gracefully. <b> and <br> only.`,
        'Here\'s a skeleton to react to:<br><br><b>01 · Hook</b> — the moment this field grabbed you.<br><b>02 · Evidence</b> — one project that proves fit.<br><b>03 · Why this</b> — name the program.<br><b>04 · Trajectory</b> — where it takes you.<br><br>Give me one detail per section and I\'ll write it in full.');
      say = draft;
      if (target) blocks.push({ type: 'chips', options: ['Tighten it to 200 words', 'Make it more technical', 'Check my eligibility for ' + target.title.slice(0, 30)] });
    } else {
      const stats = feedStats(items);
      const picks = recommend(items, profile, 12);
      say = await narrate(
        `User said: "${msg}". Chat history: ${(history || []).slice(-4).map((h) => h.r + ': ' + stripHtml(h.c).slice(0, 120)).join(' | ')}. Live feed right now: ${stats.open} open listings, ${stats.closingWeek} close in 7 days, types ${JSON.stringify(stats.types)}. Their strongest matches: ${picks.slice(0, 5).map(catalogLine).join('\n')}. Profile: ${JSON.stringify(profile || {})}. Answer in 1-3 sentences grounded ONLY in this data.`,
        `Right now: <b>${stats.open} live listings</b>, ${stats.closingWeek} closing this week. Ask me to find matches, check eligibility, or build a plan.`);
      blocks.push({ type: 'chips', options: ['Find my best matches', 'What closes this week?', 'Draft an SoP for my top match'] });
    }
  } catch (e) {
    say = 'Something snagged mid-thought — ask that again?';
  }

  // legacy text (old clients) = say + nothing else; gen-UI clients get blocks
  const payload = { text: say, blocks: [{ type: 'text', html: say }, ...blocks] };
  if (!ui) delete payload.blocks;
  return res.status(200).json(payload);
}
