// crawler/src/sources/serb.js — SERB Grant portal crawler
import { PlaywrightCrawler, Dataset } from 'crawlee';

const SERB_URLS = [
  'https://serb.gov.in/programs.php',
  'https://serb.gov.in/page/english/crg',
  'https://serb.gov.in/page/english/spf',
  'https://serb.gov.in/page/english/npdf',
  'https://serb.gov.in/page/english/matrics',
];

export async function crawlSERB() {
  const results = [];
  const now = Math.floor(Date.now() / 1000);

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 8,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 30,
    headless: true,

    async requestHandler({ request, page, enqueueLinks, log }) {
      log.info(`SERB: ${request.loadedUrl}`);

      // Wait for content
      await page.waitForLoadState('networkidle').catch(() => {});

      // Extract grant/program details
      const grants = await page.$$eval(
        '.scheme-item, .program-card, article, .grant-box, table tr, .content-block',
        (els, url) => els.slice(0, 30).map(el => {
          const title = el.querySelector('h1,h2,h3,h4,strong,th')?.textContent?.trim();
          const desc  = el.querySelector('p,.description,.content')?.textContent?.trim()?.slice(0, 500);
          const link  = el.querySelector('a')?.href;
          const deadline = el.textContent.match(/last date[:\s]+([^|]+)/i)?.[1]?.trim() ||
                           el.textContent.match(/deadline[:\s]+([^|]+)/i)?.[1]?.trim();
          const amount = el.textContent.match(/(₹[\d,.]+\s*(?:lakh|crore|lakhs)?|rs\.?\s*[\d,.]+)/i)?.[0];
          return { title, desc, link, deadline, amount };
        }).filter(g => g.title && g.title.length > 5),
        request.loadedUrl
      );

      for (const g of grants) {
        if (!g.title) continue;
        results.push({
          ext_id:      `serb_${hashStr(g.title + request.loadedUrl)}`,
          title:       g.title.slice(0, 200),
          org:         'Science & Engineering Research Board (SERB)',
          type:        'Grant',
          domain:      detectSERBDomain(g.title + ' ' + (g.desc || '')),
          source:      'SERB',
          source_url:  g.link || request.loadedUrl,
          display_url: 'serb.gov.in',
          deadline:    g.deadline || null,
          deadline_ts: g.deadline ? parseDate(g.deadline) : null,
          stipend:     g.amount || null,
          duration:    null,
          location:    'India',
          remote:      0,
          description: g.desc || g.title,
          eligibility: 'Faculty/researchers at SERB-recognized institutions. PhD required.',
          tags:        JSON.stringify(['Research', 'Government', 'India']),
          match_score: 85,
          status:      'upcoming',
          scraped_at:  now,
          raw_html:    null,
        });
      }

      // Also enqueue program detail pages
      await enqueueLinks({
        globs: ['https://serb.gov.in/page/**', 'https://serb.gov.in/programs/**'],
        transformRequestFunction: (req) => {
          req.userData = { depth: (request.userData?.depth || 0) + 1 };
          return (request.userData?.depth || 0) < 2 ? req : false;
        },
      });
    },

    failedRequestHandler({ request, error, log }) {
      log.error(`SERB failed: ${request.url}: ${error.message}`);
    },
  });

  await crawler.run(SERB_URLS);
  return deduplicate(results);
}

function detectSERBDomain(text) {
  const t = text.toLowerCase();
  if (t.match(/computer|software|ai|data|it\b/)) return 'AI/ML';
  if (t.match(/bio|medical|life science|genomic/)) return 'Biotech';
  if (t.match(/energy|material|nano|physics/)) return 'AI/ML';
  return 'AI/ML';
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).slice(0, 8);
}

function parseDate(s) {
  try { return Math.floor(new Date(s).getTime() / 1000); } catch { return null; }
}

function deduplicate(items) {
  const seen = new Set();
  return items.filter(i => {
    const key = i.source_url + i.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
