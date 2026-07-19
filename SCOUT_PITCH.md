# SCOUT — Pitch Deck Source
*The single reference for designing the deck. Written 19 July 2026 against verified research (`PITCH_RESEARCH.md`) and the live product (v34, opportune-six.vercel.app). Every number here is either measured from the product or carries a source in the research file.*

---

## HOW TO BUILD THIS DECK (the rules we researched, distilled)

Structure follows **YC's seed order** (traction-style proof early, market later) with **Sequoia's "Why now?" discipline** (it gets its own early slide — VCs' time on Why-now rose 65% YoY):

- **11 slides + appendix.** YC's set rule: 1 slide per section ideal, never more than 3. No table of contents (no funded deck had one).
- **~50 words max per slide.** VCs skim decks in ~2–3 minutes. One point per slide ("fundraising vertebrae").
- **The traction lesson inverted:** long dwell on a traction slide correlates with *failing* to raise. We are pre-launch — so per DocSend, 41% of successful pre-seed decks skip traction entirely; ours becomes **"What's already built"** (velocity as proof), kept crisp.
- **Competition = moat slide** (YC: "show why you're 10x better"), feature matrix not 2×2 — and pre-answer Hunter Walk's question: *what would each competitor say back?*
- **Dropbox compression standard:** problem in four words.
- Type ≥30pt (Kawasaki). Design in Scout's own system: canvas `#F2F1EC`, ink `#101010`, red `#FF4B2E`, rose heart `#FF3F6C`, Satoshi 300–700, editorial hairlines, the pixel-heart mark (never redrawn).

---

## THE NARRATIVE SPINE (memorize this, then design)

1. Every year, crores of Indian students miss things they'd have won — not for lack of merit, for lack of *plumbing*.
2. The industry knows, and monetizes the failure: **the student is the inventory, not the customer.**
3. Two things changed in 24 months: AI can now *do* the paperwork, and students already trust AI with their futures.
4. Scout is the first product where the student is the customer: it finds everything, knows you deeply (with consent), and does the applying — you stay the author.
5. The wedge is discovery→application for opportunities; the expansion is admissions — the highest-stakes, highest-spend decision in an Indian family's year.

---

## SLIDE 1 · TITLE
**Scout ♥**
*Don't chase opportunities. Scout them.*

Sub-line: `The application copilot for 45 million Indian students.`
Footer: live at opportune-six.vercel.app · July 2026

*Design: the pixel heart huge on canvas, nothing else. Declarative sentence per Sequoia ("define your company in a single declarative sentence").*

---

## SLIDE 2 · PROBLEM
**Four words (Dropbox standard): "Applying is the bottleneck."**

The evidence row (pick 3 of these, not all):
- **₹1,155 crore** of India's marginalised-student scholarship budget went **unused** last year; beneficiaries down ~60% in 4 years *(Rajya Sabha)*
- Discovery is shattered across **6+ channels** — WhatsApp groups, Instagram (76% of Gen Z), portals, posters *(Sallie Mae; Zety)*
- One counsellor per **~3,000 students**; families already pay ₹10k/yr coaching just to navigate
- The result: **73% of applicants call it the most stressful thing they do** *(Princeton Review, 4 years running)*

Bottom line, verbatim on slide: *"The money and the seats exist. The plumbing doesn't."*

---

## SLIDE 3 · THE DIRTY SECRET (the "why incumbents can't" slide)
**"The student is the inventory."**

- Shiksha: register once → your number is **sold to dozens of colleges** (and its billings just fell 13% YoY as AI eats its SEO)
- CollegeDekho: takes a **commission on your enrolment** — lost ₹151 Cr on ₹222 Cr revenue doing it
- Unstop: 28M students monetized at **₹11/user/year** by selling recruiter access; students report apply-and-hear-nothing
- Study-abroad agents: **10–15% of your first-year tuition**, paid by the university that "counsels" you toward it

*"Every incumbent is paid by the other side of the table. Nobody works for the student — because until now, students couldn't be served profitably."*

---

## SLIDE 4 · WHY NOW (Sequoia position #4; the most-scrutinized slide in 2023-26 decks)
**Three lines crossed in 24 months:**

1. **Capability** — AI on real computer tasks: **12% (2024) → 78–85% (2026)**, past the human baseline. Printed-document reading effectively solved.
2. **Behaviour** — Teens using AI for schoolwork: **13% → 54%** in three years. AI in the college search **doubled in six months** (26% → 46%).
3. **Incumbent decay** — AI answers are eating lead-gen SEO alive (Shiksha −13% YoY, first decline in 6 quarters). The old model dies as ours becomes possible.

*Honest sub-note (defensibility, not weakness): full browser autonomy is still unreliable and unsafe (prompt injection unsolved; consumer agents of 2024-25 all shut down). Scout is architected for this reality — grounded drafting + click-to-fill, never auto-submit. We win because we picked the possible half.*

---

## SLIDE 5 · SOLUTION
**One profile. Every door. Scout does the paperwork.**

Three-column product story (all live today):
| FIND | PREPARE | APPLY |
|---|---|---|
| Live feed from 9 sources, re-ranked every 20 min, NLP search ("remote AI hackathons closing this week") | A Common-App-grade dossier: 42 fields, 6 essays, documents that **read themselves** (upload a marksheet → academics fill in) | AI drafts grounded in *your* record, cites your real certificates & GitHub; batch-drafts in background; browser extension fills any portal — you review, you submit |
| + Admissions: 96 researched cycles (JEE→ISB→Common App), laddered **moonshot → match → safer** against your actual marks | + Connect GitHub / Behance / YouTube / portfolio — Scout reads them and cites real work | + Tracking dashboard: paths, at-risk alerts with reasons, reminders |

*Design: product screenshots do the talking — hero, admissions ladder, apply composer, extension overlay.*

---

## SLIDE 6 · PRODUCT PROOF ("what's already built" — our traction surrogate)
**Built and live, pre-launch:**
- **1,800–4,000 live opportunities** at any moment · 16 types · ~₹28 Cr in prizes on the board
- **96 admission cycles** researched & dated (22 windows open today), every date labelled verified/estimated
- **The AI reads documents**: a CBSE marksheet → name, board, %, subjects — perfectly, in production
- **The extension fills forms**: 12/12 fields on a real portal test, password untouched, never auto-submits
- Full stack shipped by **one founder + AI agents** in weeks: accounts (encrypted at rest), sync, dashboard, copilot — at **~$0/month infra**

*This slide answers "can they build it?" with "it's running — click the link."*

---

## SLIDE 7 · HOW IT WORKS (the moat mechanics)
**The more you give Scout, the harder it is to leave.**
- The **dossier compounds**: fields + essays + verified documents + connected proof-of-work — entered once, reused on every application (switching cost = re-typing your life)
- The **recommender learns** from what you save, draft, win (measured: applying to 3 volunteering listings moved that category from rank 1056 → 7)
- **Trust as positioning:** Common App calls substantive AI content fraud — Scout is built for that world: your record, your voice, your click to submit. The spray-and-pray tools (LazyApply: 2.4★) get banned; the copilot gets adopted.

---

## SLIDE 8 · COMPETITION (moat slide — matrix, one ✓-column ours)
| | Finds everything | Knows your record | Writes with you | Fills any portal | Works for the **student** |
|---|---|---|---|---|---|
| Unstop / Internshala | partial | ✗ | ✗ | ✗ | ✗ (recruiter-paid) |
| Shiksha / CollegeDekho | colleges only | ✗ | ✗ | ✗ | ✗ (lead-gen/commission) |
| Leverage / Yocket / agents | abroad only | partial | ✗ | their partners only | ✗ (commission) |
| Common App | 1,100 US colleges | forms only | bans it | own network only | ~ |
| Simplify / LazyApply | jobs only | resume only | generic | ATS autofill | ~ (spam-tainted) |
| **Scout** | **✓ opportunities + admissions** | **✓ dossier + documents + links** | **✓ grounded, you stay author** | **✓ extension + composer** | **✓ student-paid** |

Pre-answered pushback (Hunter Walk test): *Unstop would say "we have 28M users" — at ₹11/user/yr, engagement they can't monetize student-side. Common App would say "we're the standard" — for 1,100 US colleges, closed, and India applications through it fell 14% this year.*

---

## SLIDE 9 · MARKET
**Bottom-up, India-first:**
- **45M** in higher ed (all-time high) + **~13.5M** in Class 12 at any moment *(AISHE/UDISE+)*
- Exam-takers who *must* navigate admissions yearly: NEET **22.8L** + JEE **16L** + CUET **15.7L** + CAT ~3L
- What families already pay navigation-shaped money for: test prep **$11.6B**, study-abroad **$38B → $58B by FY29**, counselling **~₹5,000 Cr**, agents charging **₹75k–2L per student**
- At Plus ₹999/yr: **1M paying students = ₹100 Cr ARR**; the wedge into the $38B abroad-spend decision

*(Deck shows 3 numbers max; rest to appendix.)*

---

## SLIDE 10 · BUSINESS MODEL
**The student pays — because for the first time, the product is worth paying for.**
- **Free**: discover everything, 5 saves, basic reminders (the feed is the growth loop)
- **Plus ₹199/mo · ₹999/yr**: unlimited pipeline, AI drafting/rewrites, doc vault, extension, WhatsApp nudges
- **Pro ₹499/mo**: batch applications, admissions laddering, priority windows
- Later, clearly-labelled B2B2C (institutions license dashboards) — **never lead-selling; that's the point**
- Unit shape: ~$0 marginal infra; LLM cost pennies/application; UPI Autopay via Razorpay

*Front lesson: the investor-favorite slides were "capital efficient" and "land & expand" — this is both, say so.*

---

## SLIDE 11 · TEAM + VISION + ASK
- **Madhav Rathi** — designer-founder who shipped this entire stack (product, brand, AI systems) solo with agentic tooling — the proof is the velocity *(deck: 34 shipped versions in 9 days)*
- **Vision (Sequoia's 5-year question):** every Indian student carries one living dossier from Class 10 to career — and every gate (scholarship, seat, fellowship, job) is one reviewed click away. The Common App for everything, owned by the applicant.
- **Ask:** [amount] for 18 months: founding eng+growth, WhatsApp/notification infra, college-partnership pilots, and the paid launch across 3 exam seasons.

---

## APPENDIX (design as needed)
A. Full market table with sources · B. Competitor financials (Unstop ₹30 Cr/FY25, Internshala sold ₹100 Cr, CollegeDekho −₹151 Cr, Leverage −₹106 Cr, ApplyBoard −74%) · C. Product architecture (zero-dependency, encrypted-at-rest, 9-source live feed) · D. The 96-cycle admissions dataset methodology · E. AI-safety stance (no auto-submit; Common-App-fraud-policy aligned; prompt-injection posture) · F. Screenshots per view.

## FACTS FILE (for the designer — the only numbers approved for slides)
```
PRODUCT (measured 19 Jul 2026, production):
live listings: 1,862–4,024 · types: 16 · prize pool: ₹28.1 Cr · sources: 9
admission cycles: 96 (22 open windows) · master profile: 42 fields + 6 essays + unlimited certs
marksheet extraction: working (CBSE test: 100% fields) · extension: 12/12 fields, pw untouched
versions shipped: v1→v34 · infra cost: ~$0/mo · dependencies: 0

MARKET (sourced, see PITCH_RESEARCH.md):
45M higher-ed · 22.8L NEET · 16L JEE · 15.7L CUET · $38B abroad spend · $11.6B test prep
₹1,155 Cr scholarships unused · 73% high stress · 1:3,000 counsellor ratio

WHY NOW: OSWorld 12%→78-85% · teens AI 13%→54% · college-search AI 26%→46% in 6 months ·
Shiksha billings −13% YoY

DO NOT USE: "$100M unclaimed scholarships" (myth) · per-section attention seconds (refuted) ·
"Airbnb used Sequoia's template" (false)
```
