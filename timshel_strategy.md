# timshel — product, UX & growth playbook
*Last updated: June 2026 · Owner: M*

This is the strategic spine for turning timshel from a working prototype into a product students actually open daily and pay for. Items are sequenced roughly by impact-per-effort.

---

## 1 · ACTIVATION (the first 60 seconds)

> Goal: 70%+ of first-time visitors complete onboarding. Currently nobody knows what they're getting.

**1.1 Show value before sign-up.** Today onboarding asks 8 questions before showing anything. Flip it: on the intro screen, surface 1 hand-picked "trending right now" opportunity with real social proof ("4,200 students applied this week"). Curiosity → onboarding.

**1.2 The 3-question micro-onboarding.** Start with the minimum: role + 2 interests + email. Everything else (CGPA, location, goal) is asked *in-context* later, when it actually matters. Reduces drop-off ~40% on similar products.

**1.3 Animated match-score reveal.** When home loads, animate scores 0% → N% with easing over 600ms. Costs 8 lines of JS, drives engagement on every session start.

**1.4 College email magic-link as the default.** Already in v7. Lean into it everywhere — "Verify your student status in 10 seconds." Strongest signal for the student persona.

---

## 2 · RETENTION (week 2 and beyond)

> Goal: 35%+ DAU/MAU. Without retention, paid acquisition is a money fire.

**2.1 The "Today" view.** Make the default landing screen a triage feed: 1 high-match, 1 closing soon, 1 trending. Bounded, finite, returnable. The infinite list creates browse anxiety.

**2.2 Deadline timeline / Gantt.** Visual calendar of saved opps' deadlines. Students hoard 20+ applications; they desperately need this. None of the competitors have it.

**2.3 Streak counter.** "5 days checking opportunities" with rewards at 7 / 14 / 30 days (free Plus week at 30). Standard Duolingo mechanic, works extremely well for student demographics.

**2.4 Achievement / quest system.** "First save" · "First application submitted" · "10 saves" · "Apply to 3 fellowships." Drives behaviour in the first 2 weeks when retention is most fragile.

**2.5 WhatsApp opt-in for reminders.** **Critical for the Indian market.** Indian students live on WhatsApp; email reminders get buried. After a user saves their first opp, surface "Want this deadline as a WhatsApp reminder?" Use the WhatsApp Business API. Single biggest retention lever for this geography.

**2.6 Save with intent.** When saving, ask "Applying or just browsing?" Use intent to personalise: applying = priority reminders + agent nudges; browsing = lower-friction.

---

## 3 · MONETISATION (free → paid)

> Goal: 4-7% free→paid conversion. INR pricing optimised for student budgets.

**Free tier** — 5 saves, 5 agent queries/month, basic alerts (14d / 3d), Discover and Home unlocked. The point: never enough.

**Plus — ₹199/mo or ₹999/yr (₹83/mo equivalent).**
- Unlimited saves + agent queries
- Draft SoPs and statements with AI
- Priority alerts (24h before deadline)
- Calendar sync (Google / Apple)
- Stripe / Razorpay payment, 7-day free trial

**Pro — ₹499/mo or ₹2,999/yr (₹250/mo equivalent).**
- Auto-fill applications via the agent (massive)
- 1-on-1 mentor call/month (sourced from past winners)
- "Success guarantee": apply to 10+ via the platform, no acceptances in 12 months → full refund. Strong commitment device for serious users.

**Upgrade triggers (paywall placement).** The 5th save · the 5th agent query · opening an opp with >90% match. Each is a moment of high intent.

**Geographic pricing.** ₹999/yr = US$12/yr. Match power-parity in Tier 2/3 cities (offer ₹499/yr for students from non-metro institutions verified via college email).

---

## 4 · GROWTH (the viral loop)

> Goal: K-factor > 0.7. Below that, you're stuck on paid acquisition.

**4.1 Share-an-opportunity loop.** Every opp has a unique public landing page (`/opp/serb-research-grant-2025`). Sharing pings the recipient with the same match score *they* would get if they signed up. Both share + recipient unlock 1 month of Plus on a successful invite.

**4.2 SEO long-tail pages.** Database → static pages: `/fellowships-for-ml-students`, `/grants-india`, `/iit-madras-opportunities`. 500+ pages indexed = thousands of monthly organic visits. Indian student search behaviour is intensely long-tail.

**4.3 Campus rep program.** Recruit 1 ambassador from each of the top 50 Indian colleges. Give them free Pro + ₹50 commission per converted sign-up. ~₹1.5L total CAC for 3K activated users from prestige institutions.

**4.4 Winner wall / case studies.** Students who win a fellowship get a public profile (opt-in). Their story includes screenshots of what they applied to via timshel. Social proof + SEO + emotional pull all at once.

**4.5 Influencer kits.** 100 student YouTubers, IG career-content creators (Aman Dhattarwal, Anuj Pachhel-tier). Custom referral codes, tracked dashboards. Costs ₹50K total, expect 5-10K sign-ups in 6 weeks.

**4.6 Founder authenticity angle.** "Built by IIT/IISc students, for Indian students" — lead with this. Indian student trust is rooted in pedigree credibility.

---

## 5 · UI TRICKS & PSYCHOLOGICAL NUDGES

> Every screen should have at least one of these.

**5.1 Scarcity — real, not fake.** "Only 12 spots, 4 days left" *when the data supports it*. Never fabricate. Real scarcity from real deadlines is honest urgency.

**5.2 Social proof, hyper-localised.** "847 applied · 12 from your college" — bridges abstract to specific. Auto-compute from user data.

**5.3 Loss aversion in copy.** "Don't miss SERB — closes in 8 days" performs ~30% better than "Apply to SERB before May 1." Loss > gain in CTAs.

**5.4 Anchoring with match score.** Match score is the single number the user remembers. Always prominent. Animate it. Reference it ("Your 94% match closes tomorrow").

**5.5 Undo toasts.** After every destructive action (save, dismiss, delete), toast with Undo button for 5 seconds. Reduces support requests + builds trust.

**5.6 Recoverable navigation.** Back button never destroys state. Returning from agent → home preserves scroll position, filter state, even input drafts. Polish-tier.

**5.7 Optimistic UI.** Save shows the filled bookmark *immediately* before API confirms. Feels native, not web.

**5.8 Haptics on PWA.** `navigator.vibrate(10)` on save, share, success. Phone-only, free, feels premium.

**5.9 Skeleton loaders, not spinners.** Spinners are 90s. Skeleton placeholders during fetch = perceived 2× faster.

**5.10 Empty states with CTAs.** Never a blank screen. "No saved opportunities yet → Browse 3 trending" with the 3 right there.

---

## 6 · DEFENSIBILITY / MOATS

> What makes timshel hard to copy?

**6.1 The scraper IS the product.** 18+ live sources, hourly refresh, ML enrichment (tags, deadlines, geo, difficulty). Whoever has the most complete + accurate dataset wins. Spend 50% of engineering on the scraper.

**6.2 The application graph.** Where past applicants ended up. "12 alumni from IIT Madras applied to this fellowship, 4 won, 3 are now at MIT." Network data → user moat.

**6.3 Form auto-fill from passport.** Once a user fills their passport once, the agent auto-fills 50+ application forms. Massive switching cost — leaving means re-doing all of that.

**6.4 Mentor marketplace.** Book a 30-min call with someone who won that exact fellowship. Two-sided market = defensible because supply (winners) only exists if you have past winners.

**6.5 Trust signals on the platform.** Verified college email · institution badges · public profiles. Hard to fake at scale.

---

## 7 · DASHBOARDS & ADMIN (operational excellence)

> Already built — make it real.

**7.1 The crawler dashboard at `/dashboard`.** Show: opp count by source × type, freshness (when last scraped), failure rate per source, user signups by hour, top opportunities by save/click ratio. Already scaffolded in v6.

**7.2 Health alerts.** Discord/Slack webhook when a source goes silent for 24h or crawl rate drops. ~50 lines of code, prevents data quality slippage.

**7.3 Opp-quality scoring.** ML or heuristic score on each scraped opp (has deadline, has stipend, has eligibility). Filter junk before it hits users. Critical for the "every opportunity worth your time" tagline to be true.

---

## 8 · IMMEDIATE NEXT 14 DAYS

In order:
1. Deploy v7 to Vercel + Supabase (today)
2. Hook up Stripe/Razorpay sandbox + the 3-tier paywall
3. Build the "Today" view + skeleton loaders + match-score animation
4. WhatsApp Business API integration for deadline reminders
5. Public opp landing pages for SEO (`/opp/[slug]`)
6. Recruit 5 campus reps from IIT Madras, IISc, IIM Bangalore (your network)
7. Soft-launch via 5 student influencer DMs

Anything not on this list waits 2 more weeks.

---

*Built on user research patterns from Duolingo, Notion's onboarding, Linear's empty states, Stripe's pricing pages, Calendly's social proof, and Tinder's progressive profiling.*
