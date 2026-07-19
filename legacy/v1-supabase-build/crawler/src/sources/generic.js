// crawler/src/sources/generic.js
// A smart generic crawler that works on any opportunity listing page
import { PlaywrightCrawler } from 'crawlee';

// Opportunity signals — text that suggests this element is an opportunity
const OPP_SIGNALS = [
  'apply', 'deadline', 'fellowship', 'grant', 'scholarship', 'hackathon',
  'internship', 'stipend', 'funded', 'award', 'prize', 'competition',
  'registration', 'call for', 'open now', 'applications open'
];

export async function crawlGeneric({ url, source, domain = 'AI/ML', type = 'Fellowship', maxPages = 3 }) {
  const results = [];
  const now = Math.floor(Date.now() / 1000);
  const seen = new Set();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: maxPages * 3,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 25,
    headless: true,

    async requestHandler({ request, page, enqueueLinks, log }) {
      log.info(`[${source}] Crawling: ${request.loadedUrl}`);

      await page.waitForLoadState('networkidle').catch(() => {});

      // Extract page title
      const pageTitle = await page.title();

      // Smart extraction: find elements with opportunity signals
      const items = await page.evaluate((signals) => {
        const results = [];
        const allLinks = Array.from(document.querySelectorAll('a[href]'));

        for (const link of allLinks) {
          const text = link.textContent.trim();
          const href = link.href;

          if (!text || text.length < 10 || text.length > 300) continue;
          if (!href || href.includes('#') || href.includes('javascript:')) continue;

          const textLower = text.toLowerCase();
          const isOpportunity = signals.some(s => textLower.includes(s));
          if (!isOpportunity) continue;

          // Try to find surrounding context
          const parent = link.closest('article, li, .card, .item, tr, [class*="opport"], [class*="grant"], [class*="fellow"]');
          const description = parent?.querySelector('p, .description, .excerpt')?.textContent?.trim()?.slice(0, 300);
          const deadline = parent?.textContent?.match(/deadline[:\s]+([^|,\n]+)/i)?.[1]?.trim();
          const amount = parent?.textContent?.match(/(₹[\d,.]+\s*(?:lakh|crore)?|\$[\d,.]+[KM]?)/i)?.[0];

          results.push({ title: text, url: href, description, deadline, amount });
        }

        return results.slice(0, 30);
      }, OPP_SIGNALS);

      for (const item of items) {
        const key = item.url + item.title;
        if (seen.has(key)) continue;
        seen.add(key);

        results.push({
          ext_id:      `${source.toLowerCase().replace(/\s/g, '_')}_${hashStr(item.url)}`,
          title:       item.title.slice(0, 200),
          org:         source,
          type,
          domain,
          source,
          source_url:  item.url,
          display_url: new URL(item.url).hostname.replace('www.', ''),
          deadline:    item.deadline || null,
          deadline_ts: item.deadline ? tryParseDate(item.deadline) : null,
          stipend:     item.amount || null,
          duration:    null,
          location:    'India',
          remote:      0,
          description: item.description || item.title,
          eligibility: 'See source website for full eligibility details.',
          tags:        JSON.stringify([type, source]),
          match_score: 70,
          status:      'upcoming',
          scraped_at:  now,
          raw_html:    null,
        });
      }

      // Enqueue pagination links
      await enqueueLinks({
        globs: [`${new URL(url).origin}/**`],
        pseudoUrls: [
          `${new URL(url).origin}/[.*]page[.*]`,
          `${new URL(url).origin}/[.*]page=[\\d]+[.*]`,
        ],
        transformRequestFunction: (req) => {
          const depth = (request.userData?.depth || 0) + 1;
          return depth <= maxPages ? { ...req, userData: { depth } } : false;
        },
      });
    },
  });

  await crawler.run([url]);
  return results;
}

// IIT-specific crawler
export async function crawlIIT({ name = 'IIT Madras', url }) {
  return crawlGeneric({
    url: url || 'https://research.iitm.ac.in/funding-opportunities',
    source: name,
    domain: 'AI/ML',
    type: 'Fellowship',
    maxPages: 2,
  });
}

// Opportunity Desk crawler
export async function crawlOpportunityDesk() {
  const results = [];
  const categories = [
    { url: 'https://opportunitydesk.org/category/fellowships/', type: 'Fellowship' },
    { url: 'https://opportunitydesk.org/category/grants/',      type: 'Grant' },
    { url: 'https://opportunitydesk.org/category/scholarships/',type: 'Fellowship' },
    { url: 'https://opportunitydesk.org/category/competitions/', type: 'Competition' },
  ];

  for (const cat of categories) {
    const items = await crawlGeneric({
      url: cat.url,
      source: 'OpportunityDesk',
      domain: 'Social Impact',
      type: cat.type,
      maxPages: 2,
    });
    results.push(...items);
    await new Promise(r => setTimeout(r, 1000)); // polite delay
  }
  return results;
}

// DAAD Scholarships crawler
export async function crawlDAAD() {
  return crawlGeneric({
    url: 'https://www.daad.de/en/study-and-research-in-germany/scholarships/all-scholarship-database/?lang=en&type=0&subType=0&origin=103&intended_degree=0&stays_abroad=0&partner=&statusLang=en',
    source: 'DAAD',
    domain: 'AI/ML',
    type: 'Fellowship',
    maxPages: 3,
  });
}

// Unstop crawler
export async function crawlUnstop() {
  return crawlGeneric({
    url: 'https://unstop.com/opportunities',
    source: 'Unstop',
    domain: 'AI/ML',
    type: 'Competition',
    maxPages: 2,
  });
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).slice(0, 8);
}

function tryParseDate(s) {
  try { return Math.floor(new Date(s).getTime() / 1000); } catch { return null; }
}
