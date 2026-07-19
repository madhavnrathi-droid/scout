# timshel

Scraper-first opportunity-discovery PWA for Indian students & researchers — fellowships, grants, hackathons, scholarships, internships, conferences. Applicant-first, with an apply-through-chat AI agent.

**Live:** https://opportune-six.vercel.app

---

## What's in this folder

```
timshel/
├── public/                     ← the frontend (static, single-file app)
│   ├── index.html              ← THE APP (v8 — Tailwind + Flowbite + Carbon icons)
│   ├── icons_block.js          ← 60 IBM Carbon icons (source; also inlined in index.html)
│   ├── js/auth.js              ← Supabase auth wiring (LinkedIn + Google + magic link + agent + Razorpay)
│   ├── dashboard.html          ← admin/crawler dashboard
│   ├── manifest.json           ← PWA manifest (installable on phone)
│   └── img/timshel-logo.png    ← wordmark
├── supabase/
│   ├── migrations/0001_init.sql       ← full production schema (13 tables, RLS, auth trigger)
│   └── functions/
│       ├── agent/index.ts             ← apply-through-chat AI agent (Edge Function)
│       └── razorpay/index.ts          ← subscription create + webhook verify (Edge Function)
├── crawler/                    ← data pipeline that scrapes opportunities into the DB
│   └── src/                    ← per-source scrapers (devfolio, daad, serb, iit, unstop, …)
├── vercel.json                 ← Vercel static config
└── package.json
```

The **frontend is pure static** — it runs by opening `public/index.html`. It talks to Supabase only once you fill in the keys (below); until then it runs in demo mode with sample data.

---

## Run it locally (30 seconds)

```bash
cd timshel/public
python3 -m http.server 8080
# open http://localhost:8080
```

Or any static server (`npx serve public`, VS Code Live Server, etc.).

---

## Deploy the frontend (Vercel)

Already linked to the `opportune` project. From this folder:

```bash
npx vercel deploy --prod
```

Or drag the `public/` folder onto the Vercel dashboard. Output dir is `public` (see `vercel.json`).

---

## Set up the backend (Supabase) — one time

### 1. Apply the schema
In the Supabase SQL editor (or CLI), run `supabase/migrations/0001_init.sql`. This creates all 13 tables, row-level security, and the `handle_new_user()` trigger that auto-creates a profile and pulls name/email/avatar/headline from LinkedIn or Google on first sign-in.

### 2. Wire the frontend to Supabase
In `public/index.html`, set these two globals (near the top of the main script, or inject before `auth.js` loads):

```html
<script>
  window.__SUPABASE_URL__  = "https://YOUR_PROJECT.supabase.co";
  window.__SUPABASE_ANON__ = "YOUR_ANON_PUBLIC_KEY";
</script>
```

### 3. Deploy the Edge Functions
```bash
supabase functions deploy agent
supabase functions deploy razorpay --no-verify-jwt   # webhook path needs public access
```

### 4. Set secrets (Supabase → Project Settings → Edge Functions → Secrets)
```
ANTHROPIC_API_KEY=...           # powers the apply-through-chat agent
RZP_KEY_ID=...                  # Razorpay
RZP_KEY_SECRET=...
RZP_WEBHOOK_SECRET=...
RZP_PLAN_PLUS_M=plan_...        # 4 subscription plan IDs from Razorpay dashboard
RZP_PLAN_PLUS_Y=plan_...
RZP_PLAN_PRO_M=plan_...
RZP_PLAN_PRO_Y=plan_...
```

---

## Auth providers (Supabase → Authentication → Providers)

### LinkedIn (OIDC)  — speeds up registration by pulling profile data
- Enable **LinkedIn (OIDC)**
- Client ID: `86mau1j5k92sr9`
- Client Secret: *(from your LinkedIn developer app)*
- In the LinkedIn app, add redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- Scopes: `openid profile email`

### Google
- Enable **Google**, paste your OAuth client ID + secret
- Same callback URL as above

### Email
- Magic-link (OTP) is on by default — used for college-email verification.

---

## Pricing / monetization (Razorpay)

Create 4 subscription plans in the Razorpay dashboard, drop their IDs into the secrets above:

| Plan | Price (India) | Plan secret |
|---|---|---|
| Plus monthly | ₹199/mo | `RZP_PLAN_PLUS_M` |
| Plus yearly  | ₹999/yr | `RZP_PLAN_PLUS_Y` |
| Pro monthly  | ₹499/mo | `RZP_PLAN_PRO_M` |
| Pro yearly   | ₹2,999/yr | `RZP_PLAN_PRO_Y` |

Point a Razorpay webhook at `https://YOUR_PROJECT.supabase.co/functions/v1/razorpay/webhook` (events: `subscription.*`). It HMAC-verifies and auto-updates `profiles.plan`.

See `timshel_engagement_and_monetization.md` for the full strategy (engagement mechanics + India/global business models).

---

## Data pipeline (crawler)

`crawler/src/` scrapes opportunities from 18+ sources into the `opportunities` table. Run on a schedule (GitHub Actions cron, or Supabase scheduled function). Each source file is independent; `generic.js` handles WP-REST and common listing formats.

---

## Stack
Frontend: vanilla HTML + Tailwind (CDN) + Flowbite + IBM Carbon icons · Backend: Supabase (Postgres + Auth + Edge Functions, Deno/TypeScript) · Payments: Razorpay · Hosting: Vercel · AI agent: Claude.
