# Data sources

Everything Scout shows comes from one of two places: a live scrape of nine public sources, or a hand-researched admissions dataset. Both are documented here, including how each one breaks.

**No API keys.** Every feed source is publicly reachable without credentials. That constraint is why these nine and not others — Eventbrite and Meetup both require keys and were dropped.

---

## The live feed

Fanned out in parallel from `api/_lib/feed.js`, 9s timeout each, ~2,000–4,000 listings across 16 types.

| Source | What it gives | Notes for whoever maintains this |
|---|---|---|
| **Unstop** | Hackathons, competitions, internships, jobs, quizzes, workshops, conferences, cultural | Deep pagination (`per_page` up to 500). `registerCount` + `viewsCount` feed the virality score. The workshops slug is `workshops`, **not** `workshops-webinars`. Descriptions trimmed to 460 chars — the full pool is ~6 MB otherwise. |
| **Devpost** | Global hackathons, open + upcoming | Thumbnails arrive as `medium_square`; rewrite to `original` for real banners. |
| **Devfolio** | India-heavy hackathons | `POST` to the search endpoint with `{"type":"application_open"}`. **The GET variant 422s** — this is the single most common way to break this integration. |
| **MLH** | Official Major League Hacking season | Data is **Inertia JSON inside a `<script data-page="app">` tag**, not in the HTML. Regex the script tag; parsing the DOM finds nothing. The page is ~405 KB and will time out under parallel-fetch contention if the timeout is lowered. |
| **confs.tech** | Tech conferences, ~130 topics across 2026–2027 | Raw JSON from GitHub. A future `cfpEndDate` also emits a second "Speak at X" listing typed `Talk`. |
| **lu.ma** | City events — Bengaluru, Delhi, Mumbai | `discover_place_api_id` per city. `cover_url` is always real, which is rare and worth relying on. |
| **ConnectFor** | India NGO volunteering, ~980 opportunities | Dates are `DD-MM-YYYY`, not ISO. Images come from a category list split on `~~`. `causesArea[]` becomes the cause chips. |
| **WikiCFP** | Academic calls for papers | RSS, India-filtered. Genuinely thin — often only a couple of India results. |
| **ArtIC** | Art Institute of Chicago exhibitions | US-only. Included as a global seed for the Exhibition type, not as India coverage. |

Also verified keyless but **not integrated**: GDG Bevy chapter API. Verified as requiring keys and **rejected**: Eventbrite, Meetup, AllEvents.

### Ranking

```
urgency .30 · virality .25 · brand .20 · prize .15 · freshness .10
```

Weighted-shuffled per 20-minute bucket, so the feed moves without being random. `rotate()` only shuffles the top 600 and does a cheap tail pass — the naive full shuffle was O(n²) over 4,000 items.

Per-user re-ranking happens client-side, in the browser, against the whole pool. The server never personalises — it has no idea who you are.

---

## The admissions dataset

`public/data/admissions.json` — **96 cycles**, hand-researched with a multi-agent web-research run and audited (July 2026).

Covers Indian UG (JEE, NEET, CUET, CLAT, BITSAT, state CETs, NID, NIFT), PG and MBA (CAT, XAT, GATE, ISB, IIM executive rounds), online degrees, school-level (Sainik, JNVST, olympiads), and international (Common App, UCAS, uni-assist).

### Honesty labels

Every cycle carries a `status_note` beginning with one of:

- **`VERIFIED-OPEN`** — confirmed open against the official portal at research time
- **`UPCOMING`** — dates announced but the window hasn't opened
- **`ESTIMATED`** — inferred from previous cycles; explicitly not confirmed

This distinction is load-bearing. A student planning around a date needs to know whether it's a fact or an inference, and the UI surfaces the label rather than flattening everything into a confident-looking date.

### Dates are recomputed on read

The file's `open_now` / `days_to_close` / `days_to_open` were frozen the day it was written. `loadAdmissions()` recomputes them client-side against today, otherwise a cycle keeps claiming to be open a month after it closed.

The rule matters and is easy to get wrong:

> If **both** dates parse, the window decides. Otherwise **only** a `VERIFIED-OPEN` note may call it open.

A naive "missing date means open" turned 22 genuinely-open cycles into 84 false ones. Silence is not evidence of being open.

Date strings are prose — `"expected 2026-10-31"`, `"2026-08-01 (Consortium confirmed August start)"` — so `admDate()` extracts the ISO substring rather than trusting `Date.parse` on the whole string.

### Refreshing it

Re-run the research and regenerate the file. Dates drift every cycle; entries labelled `ESTIMATED` should be the first re-checked.

---

## Being a good citizen

- One `User-Agent` identifying the bot with a contact URL.
- The feed endpoint is edge-cached (`s-maxage=600`), so a single fan-out serves every visitor for ten minutes. **If you self-host, cache this** — see [DEPLOYMENT.md](DEPLOYMENT.md). Without it, every page load hits nine upstream sources.
- Timeouts and per-source failure isolation: one source going down degrades the feed, it never fails the request.
- Only public, unauthenticated endpoints. Nothing here is behind a login or a paywall.
