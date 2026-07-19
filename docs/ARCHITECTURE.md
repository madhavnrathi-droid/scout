# Architecture

Read this before changing anything. Scout has strong conventions, and most of them exist because something broke without them.

---

## The one rule

**Zero dependencies.** No framework, no bundler, no transpiler, no `node_modules`. `public/` is served byte-for-byte as written; `api/` uses only `node:` builtins and global `fetch`.

This is not minimalism for its own sake. It means the app deploys in seconds, cannot break on a dependency upgrade, runs identically on Vercel and on a bare VPS, and can be read end to end without tooling. If you're about to add a package, the answer is almost always to write the twenty lines instead.

The only external runtime asset is GSAP, loaded from a CDN for motion. Everything degrades gracefully without it.

---

## The frontend

### One file, one idiom

`public/scout.js` is ~4,700 lines and deliberately not split. It uses the same pattern everywhere:

```js
// 1. state lives in one object
const S = { view: 'home', pipe: {}, master: {}, dashSec: 'today', /* … */ };

// 2. renderers return HTML template strings
function dashToday() {
  return `<h2 class="dash-h">${greet}, ${esc(nm)}.</h2> …`;
}

// 3. assigned via innerHTML, then hydrated
el.innerHTML = dashToday();
hydrateIcons(el);   // swaps [data-ic] placeholders for inline SVG
animateIn(el);      // GSAP reveal

// 4. handlers are global functions wired through inline onclick
<button onclick="renderDash('tracking')">
```

Consequences you must respect:

- **Every handler must be a top-level function.** Anything scoped inside another function is unreachable from an `onclick` attribute.
- **Always `esc()` user data** interpolated into a template string. `esc()` is the HTML escaper; skipping it is an XSS hole.
- **`innerHTML` destroys listeners.** Anything attached with `addEventListener` inside a container is gone after a re-render. Use inline handlers, or re-attach.
- **Call `hydrateIcons()` after any `innerHTML`** that contains `data-ic` placeholders, or icons render as empty spans.
- **Mind quote collisions.** Inline `onclick` strings inside template literals nest three levels of quoting. Backticks inside `${}` inside an attribute is where bugs live.

### Persistence

`ls(key)` reads, `ls(key, value)` writes — a thin `localStorage` wrapper with JSON handling. Keys are namespaced `scout-*`.

| Key | Holds |
|---|---|
| `scout-user` | name, onboarded flag |
| `scout-profile` | the onboarding answers |
| `scout-master` | the dossier — 42 fields, 6 essays, links, certs |
| `scout-pipe` | the pipeline: every saved/drafting/sent/closed item |
| `scout-docsidx` | document *index* only (name, mime, size, AI classification) |
| `scout-notifs`, `scout-reminders`, `scout-agentlog`, `scout-acts` | activity |

Documents themselves go to **IndexedDB** (`scout-docs` → `files` → `doc:<slot>`), because a marksheet scan blows past `localStorage`'s ~5 MB budget immediately.

There is **no server-side user storage and no auth**. This was removed deliberately in v35. Don't reintroduce it without a real reason — see the README.

### State model

Borrowed from an earlier project and worth keeping:

- **Status is a pill, risk is a colour, never a bare number.** `deadlineHeat(days)` returns a class and human text; `riskItems()` returns items *with the reason as a sentence* attached.
- **Never silently stale.** Failed agent jobs go to `scout-agentlog` and surface with what was **not** done plus a Retry.
- **The state dot is a colour, not a count.** `paintStateDot()`.

### Cache-busting — three bumps, always together

```
public/index.html   <link href="/scout.css?v=N">
public/index.html   <script src="/scout.js?v=N">
public/sw.js        const CACHE = 'scout-vN-0';
```

The service worker is stale-while-revalidate. Bump two of three and returning users get the old bundle exactly once — which is close to impossible to debug from a report. It never caches `/api/*`; caching the feed would break the 20-minute rotation.

---

## The backend

Six endpoints. All stateless, all pure compute, no database.

| Endpoint | Does | Needs a key? |
|---|---|---|
| `opportunities.js` | Fans out to 9 sources, normalises, scores, rotates. Edge-cached `s-maxage=600`. | No |
| `agent.js` | Intent router → deterministic tools from `_lib/ontology.js` → LLM writes only the connective prose → returns UI blocks | Yes |
| `ai-search.js` | Natural language → structured filters | Yes |
| `compose.js` | Drafting and rewriting applications | Yes |
| `extract.js` | Vision model reads a marksheet/certificate → structured fields | Yes |
| `enrich.js` | Fetches a public URL and reports what it proves about you | Yes |

### The feed pipeline — `api/_lib/feed.js`

Nine keyless sources fanned out in parallel, each with a 9-second timeout: Unstop, Devpost, Devfolio, MLH, confs.tech, lu.ma, ConnectFor, WikiCFP, ArtIC.

Normalised into one shape, then scored as a marketplace:

```
urgency .30 · virality .25 · brand .20 · prize .15 * freshness .10
```

then weighted-shuffled per 20-minute bucket so the feed moves without being random. `rotate()` shuffles only the top 600 plus a cheap tail pass — the naive version was O(n²) on 4,000 items.

Source-specific gotchas that will bite if you touch this — the Devfolio search endpoint only accepts POST (the GET variant 422s), MLH ships its data as Inertia JSON inside a `<script data-page>` tag rather than in the HTML, and Unstop's workshops slug is `workshops` not `workshops-webinars`. [docs/DATA-SOURCES.md](DATA-SOURCES.md) has the full list.

### The LLM chain — `api/_lib/llm.js`

Walks providers until one answers: Gemini → OpenAI-compatible (Groq) → Anthropic. Any single key is enough. Vision models are discovered at runtime from the provider's `/models` endpoint rather than hardcoded, because model availability on a given key changes without warning.

**The LLM never invents listings.** `agent.js` resolves real entities through `_lib/ontology.js` tools first and lets the model write only the narrative around them. This is the difference between a copilot and a plausible liar.

---

## The recommender

In `public/scout.js`, client-side, over the whole feed.

Eight signals through a logistic squash: domain affinity (via a `DOMAIN_KIN` graph), text relevance against an interest vector, stated *and* learned type preference, eligibility (level, geography, and **deadline feasibility** — effort hours against days remaining), listing quality, urgency among feasible items only, and behavioural affinity from your pipeline weighted `saved 1 / draft 2.5 / applied 4`.

Then `diversify()` does an MMR re-rank so one org or type can't own the feed.

`userVector()` is memoised — **call `invalidateUV()` after any pipeline or profile change** or recommendations go stale silently. Demo-mode records carry `_demo: true` and are skipped, so previewing sample data can't teach the recommender anything.

Measured: scores spread 38–98, top-20 held 5 types across 19 orgs, and applying to three volunteering listings moved that category from rank 1056 → 7.

---

## The dashboard

Six sections: **Today · Paths · Tracking · Dossier · Notifications · Scout AI**.

Today is the primary slot and answers *what do I do next*, ranking: failed agent jobs → at-risk items → due reminders → sent-but-unclosed → dossier gaps. Every metric tile is a button that routes into a Tracking filter — a number you cannot act on is decoration.

Things that are easy to break here:

- **`pipeDays(p)` reads `deadline_ts` from the snapshot, never `days_left` from the live feed.** `snapOf()` doesn't store `days_left`, so `o.days_left > 0` is `undefined > 0` — false — and every item whose listing rotated out of the feed silently vanishes. This was a real bug.
- **`dashChat` moves the live `.agent-shell` DOM node** into `#dash-body` and back out. It must stay idempotent: `ensureAgentDOM()` is gated on `dataset.built`, so if the shell is destroyed without clearing that flag, it never rebuilds.
- **Value changes patch in place; structural changes re-render.** Re-rendering `#dash-body` from a keystroke drops the caret mid-sentence. `setMasterInline()` patches the completeness bar directly for exactly this reason.
- **Repaint where the user is actually looking.** `dashLive()` tests whether the dashboard is up; several functions used to repaint views hidden behind it, which looked exactly like the action had failed.

The dossier is editable in the dashboard; the Profile page shows the same fields **read-only**. That's a deliberate split — it also means there's only one set of field IDs in the DOM, so nothing collides.

---

## Local development

```bash
node scripts/dev.mjs 3001
```

Serves `public/`, routes `/api/*` to the handlers with a Vercel-shaped `(req, res)`, and loads `.env.local`.

**Node caches transitive imports.** After editing `api/_lib/*` or any data file, restart the server — the handler will otherwise keep serving the old module.

Check everything before committing:

```bash
npm run check
```

This does two things, and the second one matters more than it looks. `node --check`
only **parses** — it never resolves imports, so a deleted or renamed module passes
it cleanly and then fails at runtime in production. `scripts/check-api.mjs`
cold-imports every module in a fresh process, which is the only way to catch it.

That is not hypothetical: `api/_data/opportunities.js` was deleted by accident
during an unrelated cleanup and the feed broke in production for three deploys.
Local dev never noticed, because the long-running dev process still had the module
resident in memory and every reload was served from that warm cache.
