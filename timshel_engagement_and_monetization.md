# timshel — engagement engine & monetization playbook

## PART 1 · THE ENGAGEMENT ALGORITHMS (how SaaS keeps people hooked)

Every retention-strong app runs some version of the **Hook loop** (trigger → action → variable reward → investment). Here's the concrete stack timshel should run, in priority order:

### A. The daily-return engine
1. **The "Today" feed** — a finite, fresh, 3-item triage screen (1 closing soon · 1 high-match · 1 trending). Finite = returnable. This is the home screen. New content daily (the scraper guarantees freshness) is the single strongest retention driver for a discovery app.
2. **Streaks with loss aversion** — daily check-in counter. The pain of breaking a 12-day streak is what brings people back. Milestone at 7 days (free Plus week), 30 days (free Plus month). `bump_streak()` is already in the schema.
3. **Variable-reward match reveal** — when new opportunities are scraped, the match score is computed fresh and *animated* on reveal (0→94%). Variable because the user never knows if today brings a 70% or a 98% match. Slot-machine mechanics, honestly applied.

### B. Social-media mechanics (the "feel like social media" ask)
4. **Activity feed** — "Priya from IIT-B saved this," "320 students applied this week," "Aarav just won the DAAD." Real peer activity = social proof + FOMO + identity. This is the feature that makes it feel like a network, not a database.
5. **Hyper-local social proof** — "12 from YOUR college applied." Computed from `profiles.institution`. Far more motivating than a global number.
6. **Public "I'm applying" commitments** — tapping Apply optionally posts to your feed. Commitment-and-consistency: people who declare intent publicly follow through more, and it seeds the feed.
7. **Winner wall** — opt-in profiles of people who won, with what they applied to. Aspirational social proof + SEO goldmine.
8. **Reviews & past editions on every event** — star ratings, photos, "what it was like" from past attendees (the `event_reviews` / `event_editions` / `event_media` tables). Turns a cold listing into a warm, social object.

### C. Investment mechanics (switching cost)
9. **Profile completion bar with endowed progress** — start everyone at "20% complete" (LinkedIn trick). The Zeigarnik effect drives them to finish; each field improves match quality, which they feel immediately.
10. **The application graph** — every saved opp, every draft, every submitted application accrues in their account. Leaving means abandoning all of it. The agent's SoP drafts (stored in `applications.draft`) are the deepest lock-in.
11. **XP + levels** — +10 XP per daily check-in, per save, per application. Visible level. Cheap to build, real dopamine.

### D. Notification timing (the re-trigger)
12. **Deadline-based reminders** — 14d / 3d / 24h before a saved opp's deadline, via push + WhatsApp. Scheduled in the `notifications` queue.
13. **WhatsApp re-engagement** — India lives on WhatsApp; email is dead for students. Daily/weekly digest + deadline pings. This is the #1 India-specific retention lever.
14. **Behavioural triggers** — "You viewed DAAD 3 times — want the agent to start your SoP?" Intent detected, agent offered at the moment of friction.

### E. The recommendation algorithm
15. **Match score** = weighted sum of: domain overlap (0.30) + role/eligibility fit (0.25) + looking-for type match (0.20) + geo preference (0.10) + recency/urgency (0.10) + quality_score (0.05). Tunable. Show it everywhere as the anchor number.
16. **Collaborative signal (v2)** — "students like you also applied to…" from the application graph once you have volume. This compounds: more users → better recs → more users.

---

## PART 2 · MONETIZATION — INDIA + ABROAD

India is price-sensitive but UPI-Autopay makes subscriptions frictionless. The winning structure is **freemium consumer + B2B2C institutional**, because Indian *students* won't pay much but Indian *institutions* have real budgets.

### Model 1 · Freemium subscription (the consumer base)
The everyday revenue. Razorpay subscriptions on UPI Autopay.

| Tier | Price (India) | Price (Global) | What you get |
|---|---|---|---|
| **Free** | ₹0 | $0 | 5 saves, 5 agent messages/mo, basic 14d/3d alerts, full browse |
| **Plus** | ₹199/mo · ₹999/yr | $7/mo · $49/yr | Unlimited saves, 100 agent msgs/mo, AI SoP drafts, 24h alerts, calendar sync, WhatsApp reminders |
| **Pro** | ₹499/mo · ₹2,999/yr | $15/mo · $99/yr | Unlimited agent, auto-fill applications, 1 mentor call/mo, priority alerts, "success guarantee" refund |

- **Student pricing via college-email verification:** ₹99/mo for verified `.edu`/`.ac.in` — captures the price-sensitive core without devaluing the brand.
- **Push annual hard.** UPI Autopay annual = best LTV and lowest churn. Anchor monthly high to make annual look cheap.
- **Upgrade triggers:** 5th save · 5th agent message · opening a 90%+ match. Paywall at peak intent, never cold.

### Model 2 · B2B2C institutional licensing (the real money in India) ⭐
Sell to **college placement cells, career-services offices, and coaching institutes.** They pay; students get Pro free under the institution's brand.
- ₹50K–₹2L/year per institution for a co-branded portal + an admin dashboard (which opportunities their students saved/won, placement analytics).
- India has 1,000+ colleges with placement budgets. 50 institutions × ₹1L = ₹50L ARR with almost no consumer CAC.
- This is the wedge that makes timshel a *hit* in India — it rides existing institutional budgets and distribution (the college emails the whole batch).

### Model 3 · Provider-side lead-gen (the abroad money)
Fellowship/scholarship/bootcamp providers pay to **feature** listings and reach qualified applicants.
- Featured placement, verified badge, applicant analytics. ₹/$ per featured slot or per qualified lead.
- Universities abroad spend heavily on grad recruitment from India — this is high-margin and scales globally.

### Model 4 · Mentor marketplace (two-sided, defensible)
Book a 30-min call with someone who won that exact fellowship. timshel takes **15–20% commission.** Supply = your winner wall. Network effect: more winners → more mentors → more conversions.

### Model 5 · Outcome cohorts (high-ticket, seasonal)
"Land a Fellowship in 8 weeks" paid cohorts (₹4,999–₹9,999) around major deadline seasons (DAAD, Fulbright, PMRF). High margin, strong word-of-mouth, doubles as content marketing.

### Recommended sequencing
1. Ship **Free + Plus** on Razorpay first (consumer base, validate willingness to pay).
2. Add **Pro** once the agent auto-fill + mentor supply exist.
3. Land **3 institutional pilots** (your MAHE / IIT / IISc network) — this is the revenue that makes it a business.
4. Layer **provider lead-gen** once you have applicant volume to sell.

### Razorpay specifics
- Use **Subscriptions API** with **UPI Autopay mandates** (created by the `razorpay` edge function already written).
- Create 4 plans in the Razorpay dashboard (plus_monthly, plus_yearly, pro_monthly, pro_yearly), put their IDs in Supabase secrets (`RZP_PLAN_PLUS_M`, etc.).
- Webhook → the `/razorpay/webhook` edge function verifies HMAC and flips `profiles.plan` automatically.
- Offer **one-tap UPI** at checkout — conversion in India is 2–3× card.
