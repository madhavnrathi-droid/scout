// crawler/src/sources/reddit.js
// Reddit exposes a free JSON API at reddit.com/r/SUBREDDIT.json
// No auth required for public subreddits. Rate limit: ~1 req/sec.

const OPPORTUNITY_KEYWORDS = [
  'fellowship', 'grant', 'scholarship', 'hackathon', 'internship',
  'residency', 'stipend', 'funded', 'application open', 'call for',
  'competition', 'award', 'prize', 'research position', 'phd',
  'postdoc', 'funding', 'deadline', 'apply now', 'applications',
];

const SUBREDDIT_CONFIGS = {
  scholarships:       { domain: 'Social Impact', defaultType: 'Fellowship' },
  gradadmissions:     { domain: 'AI/ML',         defaultType: 'Fellowship' },
  cscareerquestionsIN:{ domain: 'AI/ML',         defaultType: 'Internship' },
  MachineLearning:    { domain: 'AI/ML',         defaultType: 'Grant' },
  india:              { domain: 'Social Impact', defaultType: 'Grant' },
  startups:           { domain: 'Social Impact', defaultType: 'Grant' },
  phdstudents:        { domain: 'AI/ML',         defaultType: 'Fellowship' },
  datascience:        { domain: 'AI/ML',         defaultType: 'Competition' },
};

export async function crawlReddit({ subreddit, query, type, limit = 50 }) {
  const config = SUBREDDIT_CONFIGS[subreddit] || { domain: 'Social Impact', defaultType: 'Grant' };
  const opType = type || config.defaultType;

  let url;
  if (query) {
    url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&limit=${limit}&restrict_sr=1`;
  } else {
    url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'OpportuneBot/1.0 (opportunity aggregator; contact: hello@opportune.app)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) throw new Error(`Reddit ${subreddit}: HTTP ${res.status}`);
  const json = await res.json();
  const posts = json?.data?.children || [];

  const opportunities = [];

  for (const { data: post } of posts) {
    // Skip removed/deleted posts
    if (!post.title || post.removed_by_category || post.score < 1) continue;

    const titleLower = post.title.toLowerCase();
    const bodyLower  = (post.selftext || '').toLowerCase();
    const combined   = titleLower + ' ' + bodyLower;

    // Only keep posts that look like opportunities
    const isOpportunity = OPPORTUNITY_KEYWORDS.some(kw => combined.includes(kw));
    if (!isOpportunity) continue;

    const now = Math.floor(Date.now() / 1000);
    const postAge = now - post.created_utc; // seconds old

    // Skip posts older than 90 days
    if (postAge > 90 * 86400) continue;

    // Extract deadline from text (rough)
    const deadlineMatch = combined.match(/deadline[:\s]+([A-Za-z]+ \d{1,2},?\s*\d{4}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
    const deadline = deadlineMatch ? deadlineMatch[1] : null;

    // Extract stipend/prize
    const stipendMatch = combined.match(/(\$|₹|€|£|USD|INR|EUR)\s*[\d,]+[KMk]?(?:\s*\/\s*(?:month|mo|year|yr))?/i);
    const stipend = stipendMatch ? stipendMatch[0] : null;

    // Determine the actual source URL
    const externalUrl = post.url && !post.url.includes('reddit.com') ? post.url : `https://reddit.com${post.permalink}`;

    opportunities.push({
      ext_id:      `reddit_${post.id}`,
      title:       cleanTitle(post.title),
      org:         extractOrg(post.title, post.selftext, post.author) || `r/${subreddit}`,
      type:        detectType(combined) || opType,
      domain:      detectDomain(combined) || config.domain,
      source:      `Reddit/r/${subreddit}`,
      source_url:  externalUrl,
      display_url: `reddit.com/r/${subreddit}`,
      deadline:    deadline,
      deadline_ts: deadline ? parseDeadlineToTs(deadline) : null,
      stipend:     stipend,
      duration:    null,
      location:    detectLocation(combined),
      remote:      combined.includes('remote') || combined.includes('online') ? 1 : 0,
      description: cleanBody(post.selftext, 400) || post.title,
      eligibility: extractEligibility(combined),
      tags:        JSON.stringify(extractTags(combined)),
      match_score: scoreOpportunity(post),
      status:      'upcoming',
      scraped_at:  now,
      raw_html:    null,
    });
  }

  return opportunities;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function cleanTitle(t) {
  return t.replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

function cleanBody(text, maxLen = 400) {
  if (!text) return '';
  return text.replace(/\n{3,}/g, '\n\n').replace(/https?:\/\/\S+/g, '').trim().slice(0, maxLen);
}

function extractOrg(title, body, author) {
  const orgPatterns = [
    /at\s+([A-Z][A-Za-z\s&]+(?:University|Institute|Foundation|Lab|Research|Inc|Corp|Ltd))/,
    /by\s+([A-Z][A-Za-z\s&]+(?:University|Institute|Foundation|Lab|Research))/,
    /from\s+([A-Z][A-Za-z\s&]+(?:University|Institute|Foundation|Lab|Research))/,
    /([A-Z]{2,}(?:\s[A-Z]{2,})*)\s+(?:grant|fellowship|scholarship|hackathon)/i,
  ];
  const text = title + ' ' + (body || '');
  for (const p of orgPatterns) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 100);
  }
  return null;
}

function detectType(text) {
  if (text.includes('hackathon')) return 'Hackathon';
  if (text.includes('fellowship')) return 'Fellowship';
  if (text.includes('scholarship')) return 'Fellowship';
  if (text.includes('grant')) return 'Grant';
  if (text.includes('internship')) return 'Internship';
  if (text.includes('competition')) return 'Competition';
  if (text.includes('conference') || text.includes('workshop')) return 'Conference';
  return null;
}

function detectDomain(text) {
  if (text.match(/ai|machine learning|deep learning|nlp|computer vision|llm/)) return 'AI/ML';
  if (text.match(/biotech|biology|genomics|medicine|health|medical/)) return 'Biotech';
  if (text.match(/climate|environment|sustainability|green|carbon/)) return 'ClimaTech';
  if (text.match(/health|hospital|disease|pharma/)) return 'HealthTech';
  if (text.match(/startup|entrepreneur|business|venture/)) return 'Social Impact';
  if (text.match(/policy|governance|law|economics/)) return 'Policy';
  return null;
}

function detectLocation(text) {
  const locs = ['india', 'usa', 'uk', 'germany', 'online', 'remote', 'global',
                 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'chennai', 'hyderabad'];
  for (const loc of locs) {
    if (text.includes(loc)) return loc.charAt(0).toUpperCase() + loc.slice(1);
  }
  return 'India';
}

function extractEligibility(text) {
  const eMatch = text.match(/eligible[:\s]+([^.]+\.)/i) ||
                 text.match(/eligibility[:\s]+([^.]+\.)/i) ||
                 text.match(/open to\s+([^.]+\.)/i);
  return eMatch ? eMatch[1].trim().slice(0, 300) : 'See original post for eligibility details.';
}

function extractTags(text) {
  const tags = [];
  const tagMap = {
    'PhD': /phd|doctoral/i, 'Remote': /remote|online/i, 'Funded': /funded|stipend|paid/i,
    'AI/ML': /ai|machine learning/i, 'India': /india|indian/i, 'International': /international|global/i,
    'Undergrad': /undergraduate|ug\b/i, 'Postgrad': /postgraduate|masters|mtech/i,
  };
  for (const [tag, re] of Object.entries(tagMap)) {
    if (re.test(text)) tags.push(tag);
  }
  return tags.slice(0, 4);
}

function scoreOpportunity(post) {
  let score = 60;
  if (post.score > 100) score += 10;
  if (post.score > 500) score += 10;
  if (post.num_comments > 10) score += 5;
  if (post.url && !post.url.includes('reddit.com')) score += 10; // Has external link
  return Math.min(score, 95);
}

function parseDeadlineToTs(deadlineStr) {
  try {
    const d = new Date(deadlineStr);
    if (!isNaN(d.getTime())) return Math.floor(d.getTime() / 1000);
  } catch {}
  return null;
}
