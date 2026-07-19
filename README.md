<div align="center">

<img src="public/scout-heart.png" alt="Scout" height="72">

# Scout

**Don't chase opportunities. Scout them.**

Live opportunity discovery, real admission cycles, and an application copilot — for Indian students.

[**opportune-six.vercel.app**](https://opportune-six.vercel.app) · [Architecture](docs/ARCHITECTURE.md) · [Deployment](docs/DEPLOYMENT.md) · [Data sources](docs/DATA-SOURCES.md)

</div>

---

## What it does

Indian students miss things they'd have won — not for lack of merit, but because discovery is scattered across a dozen portals and applying is tedious. Scout closes that gap end to end.

| | |
|---|---|
| **Find** | ~2,000–4,000 live listings across 16 types, scraped from 9 keyless sources and re-ranked every 20 minutes. Natural-language search: *"remote AI hackathons closing this week"*. |
| **Decide** | An 8-signal recommender that learns from what you save, draft and send. Admissions laddered against your actual marks — moonshot → match → safer bet. |
| **Prepare** | A Common-App-grade dossier: 42 fields, 6 essays, documents that read themselves (upload a marksheet, your academics fill in). |
| **Apply** | AI drafts grounded in your real record. A browser extension fills any portal — you review, you submit. A dashboard that tells you what needs you today. |

96 admission cycles are researched and dated — JEE, NEET, CUET, CLAT, CAT, ISB, Common App and more — each labelled `VERIFIED-OPEN`, `UPCOMING` or `ESTIMATED` so an estimate never masquerades as a fact.

---

## Run it

```bash
git clone https://github.com/madhavnrathi-droid/scout.git
cd scout
node scripts/dev.mjs 3001      # → http://localhost:3001
```

That's the whole setup. **No install step, no `node_modules`, no build.** The dev server serves `public/` as static files and routes `/api/*` to the handler modules directly.

AI features need a key — everything else works without one:

```bash
cp .env.example .env.local     # add OPENAI_COMPAT_KEY, then restart
```

---

## How it's built

**Zero dependencies.** No framework, no bundler, no transpiler. `public/` is served as-is; `api/` are serverless functions written against `node:` builtins and `fetch`. This is deliberate — it deploys in seconds, never breaks on a dependency upgrade, and every file reads top to bottom.

```
scout/
├── public/                     the app — served as static files
│   ├── index.html              the shell (onboarding · dashboard · main app)
│   ├── scout.js                THE APP — views, recommender, agent, apply flow, dashboard
│   ├── scout.css               the design system — tokens, editorial layout, motion
│   ├── sw.js                   service worker (never caches /api/*)
│   ├── data/admissions.json    96 researched admission cycles, served statically
│   ├── extension/              Scout Autofill — MV3 browser extension
│   └── ext-test.html           harness running the real extension against a fake portal
│
├── api/                        serverless functions — stateless, pure compute
│   ├── opportunities.js        9-source live aggregator + scoring + 20-min rotation
│   ├── agent.js                intent router → ontology tools → grounded generative UI
│   ├── ai-search.js            natural language → structured filters
│   ├── compose.js              drafting and editing applications
│   ├── extract.js              vision model reads marksheets → structured fields
│   ├── enrich.js               reads a connected link and says what it proves
│   └── _lib/                   feed.js · ontology.js · llm.js
│
├── scripts/dev.mjs             local server: static + /api/* routing + .env.local
├── docs/                       architecture, deployment, data provenance, pitch
└── legacy/                     the abandoned v1 build, kept for reference only
```

`public/scout.js` is one large file on purpose. It uses a single idiom throughout: a state object `S`, render functions returning HTML template strings assigned via `innerHTML`, and global functions wired through inline `onclick`. Match it when you edit.

📖 **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** explains the recommender, the feed pipeline, the state model, and the conventions you need before changing anything.

---

## Where your data lives

**In your browser. Nowhere else.**

Scout has no accounts, no login, and no server-side user storage. Small records (profile, pipeline, drafts, chats) live in `localStorage`; documents live in IndexedDB, which is the only place large enough for them. Nothing is uploaded, and the backend holds no state at all.

The trade is real and stated plainly in the UI: clear your browsing data and Scout goes with it. **Profile → Your data** exports one JSON file carrying your records *and* your documents — that's the backup and the way to move devices.

This also means the six API endpoints are pure compute. The feed is edge-cached, so one function invocation serves every visitor for ten minutes.

---

## Deploying

Live on Vercel today, and portable by design — it's static files plus six stateless functions.

```bash
vercel --prod
```

Self-hosting on your own server needs no Vercel-specific runtime; `scripts/dev.mjs` is a complete reference server in ~100 lines. **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** covers Vercel, nginx + systemd, Docker, Caddy, and the two things that bite: cache-busting and the git-author check.

> **Cache discipline — the one rule that will catch you.** Every frontend change needs **three** bumps together: `?v=N` on both tags in `index.html`, *and* the `CACHE` constant in `sw.js`. The service worker is stale-while-revalidate; miss one and returning users get the old bundle exactly once, which is maddening to debug.

---

## Deliberate non-features

Some things are missing on purpose. They are product decisions, not gaps:

- **No auto-submission.** The extension fills forms and shows you what it filled; you click submit. Portals void applications and ban accounts for detected automation, and that cost lands on the student.
- **No CAPTCHA or bot-detection evasion.** Same reason.
- **No card or bank storage.** Scout never handles a card number. That belongs to a payment provider that tokenises it — not to `localStorage` on a shared college machine.
- **No lead-selling.** The student is the customer. Every incumbent in this market is paid by the other side of the table; that's the thing Scout exists to not be.

---

## Status

Pre-launch and running. Built solo with agentic tooling. Expect rough edges, an unusually detailed commit log, and a codebase that says what it's doing and why.

Licensing hasn't been decided yet — the code is public to read and learn from. Ask before shipping it as your own.
