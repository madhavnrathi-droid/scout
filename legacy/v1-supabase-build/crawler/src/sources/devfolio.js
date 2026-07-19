// crawler/src/sources/devfolio.js
// Devfolio has a public GraphQL API at devfolio.co/api/graphql
// Also fallback to their public hackathons listing page

const DEVFOLIO_API = 'https://api.devfolio.co/api/v1/hackathons';

export async function crawlDevfolio() {
  const opportunities = [];
  const now = Math.floor(Date.now() / 1000);

  try {
    // Devfolio public REST endpoint
    const res = await fetch(`${DEVFOLIO_API}?should_show_on_homepage=true&count=50`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpportuneBot/1.0',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const hackathons = data?.results || data?.hackathons || [];

      for (const h of hackathons) {
        const deadline = h.ends_at || h.submission_deadline;
        const url = h.url ? `https://devfolio.co/hackathons/${h.slug || h.url}` : 'https://devfolio.co/hackathons';
        const starts = h.starts_at ? new Date(h.starts_at) : null;
        const ends   = h.ends_at   ? new Date(h.ends_at)   : null;
        const status = ends ? (ends < new Date() ? 'past' : starts < new Date() ? 'live' : 'upcoming') : 'upcoming';

        opportunities.push({
          ext_id:      `devfolio_${h.id || h.slug}`,
          title:       h.name || h.title,
          org:         h.organisation?.name || h.organizer || 'Devfolio',
          type:        'Hackathon',
          domain:      detectDevfolioDomain(h),
          source:      'Devfolio',
          source_url:  url,
          display_url: `devfolio.co/${h.slug || 'hackathons'}`,
          deadline:    deadline ? new Date(deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : null,
          deadline_ts: deadline ? Math.floor(new Date(deadline).getTime() / 1000) : null,
          stipend:     formatPrizePool(h.prize_amount, h.prize_currency),
          duration:    formatDuration(h.starts_at, h.ends_at),
          location:    h.mode === 'online' ? 'Online' : h.city || 'India',
          remote:      h.mode === 'online' ? 1 : 0,
          description: h.description || h.tagline || 'Hackathon on Devfolio',
          eligibility: `Open to all developers. ${h.team_min ? `Teams of ${h.team_min}–${h.team_max || 4}.` : ''}`,
          tags:        JSON.stringify(extractDevfolioTags(h)),
          match_score: scoreHackathon(h),
          status,
          scraped_at:  now,
          raw_html:    null,
        });
      }
    }
  } catch (err) {
    console.warn('[Devfolio] API failed, trying web fallback:', err.message);
    // If API fails, fall through with empty array
  }

  // Fallback: crawl the Devfolio hackathons page with Crawlee
  if (opportunities.length === 0) {
    return await crawlDevfolioWeb();
  }

  return opportunities;
}

async function crawlDevfolioWeb() {
  // Lightweight fetch-based fallback
  const { PlaywrightCrawler } = await import('crawlee');
  const opps = [];
  const now = Math.floor(Date.now() / 1000);

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1,
    async requestHandler({ page, log }) {
      log.info('Crawling Devfolio...');
      await page.waitForSelector('[data-testid="hackathon-card"], .hackathon-card, article', { timeout: 8000 }).catch(() => {});

      const cards = await page.$$eval('article, [class*="hackathon"], [class*="card"]', els =>
        els.slice(0, 20).map(el => ({
          title: el.querySelector('h1,h2,h3,h4,[class*="title"]')?.textContent?.trim(),
          url:   el.querySelector('a')?.href,
          desc:  el.querySelector('p,[class*="desc"]')?.textContent?.trim()?.slice(0, 200),
        })).filter(c => c.title && c.url)
      );

      for (const c of cards) {
        if (!c.title) continue;
        opps.push({
          ext_id: `devfolio_web_${Buffer.from(c.url || c.title).toString('base64').slice(0, 16)}`,
          title: c.title, org: 'Devfolio', type: 'Hackathon', domain: 'AI/ML',
          source: 'Devfolio', source_url: c.url || 'https://devfolio.co/hackathons',
          display_url: 'devfolio.co', deadline: null, deadline_ts: null,
          stipend: null, duration: null, location: 'India', remote: 0,
          description: c.desc || c.title, eligibility: 'Open to all developers.',
          tags: JSON.stringify(['Hackathon']), match_score: 72, status: 'upcoming',
          scraped_at: now, raw_html: null,
        });
      }
    },
  });

  await crawler.run(['https://devfolio.co/hackathons']).catch(() => {});
  return opps;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function detectDevfolioDomain(h) {
  const text = `${h.name} ${h.description || ''} ${(h.themes || []).join(' ')}`.toLowerCase();
  if (text.match(/ai|ml|machine learning|blockchain|web3/)) return 'AI/ML';
  if (text.match(/health|medical|biotech/)) return 'HealthTech';
  if (text.match(/climate|sustainability|green/)) return 'ClimaTech';
  return 'AI/ML';
}

function formatPrizePool(amount, currency) {
  if (!amount) return null;
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '€';
  const formatted = amount >= 100000 ? `${(amount/100000).toFixed(1)}L` :
                    amount >= 1000   ? `${(amount/1000).toFixed(0)}K` : String(amount);
  return `${sym}${formatted} prize pool`;
}

function formatDuration(start, end) {
  if (!start || !end) return null;
  const days = Math.round((new Date(end) - new Date(start)) / 86400000);
  return `${days} days`;
}

function extractDevfolioTags(h) {
  const tags = ['Hackathon'];
  if (h.mode === 'online') tags.push('Remote');
  if (h.prize_amount) tags.push('Prize Pool');
  if (h.is_student_only) tags.push('Students Only');
  return tags;
}

function scoreHackathon(h) {
  let score = 65;
  if (h.prize_amount > 500000) score += 15;
  if (h.registered_participants > 1000) score += 10;
  if (h.mode === 'online') score += 5;
  return Math.min(score, 95);
}
