// Provider-agnostic LLM caller for the Scout agent + AI search.
// Walks providers in order until one answers — so a dead key or dry quota
// on one provider never kills the AI. Files under api/_ are not routed.
//
// Vercel project env (set any subset; order tried is Gemini → OpenAI-compat → Anthropic):
//   GEMINI_API_KEY       → Google Gemini            (model via GEMINI_MODEL, default chain below)
//   OPENAI_COMPAT_KEY    → any OpenAI-compatible API (Groq, Together, …)
//   OPENAI_COMPAT_BASE   →   its base URL, default https://api.groq.com/openai/v1
//   OPENAI_COMPAT_MODEL  →   its model,   default llama-3.3-70b-versatile
//   ANTHROPIC_API_KEY    → Anthropic Claude          (model via ANTHROPIC_MODEL, default claude-sonnet-4-6)
// With none set (or all failing), callLLM returns { ok:false } and the caller
// serves its data-grounded fallback.

export async function callLLM({ system, messages, max_tokens = 1024 }) {
  let lastReason = 'no_key';
  if (process.env.GEMINI_API_KEY) {
    const r = await callGemini({ key: process.env.GEMINI_API_KEY, system, messages, max_tokens });
    if (r.ok) return r;
    lastReason = r.reason;
  }
  if (process.env.OPENAI_COMPAT_KEY) {
    const r = await callOpenAICompat({ key: process.env.OPENAI_COMPAT_KEY, system, messages, max_tokens });
    if (r.ok) return r;
    lastReason = r.reason;
  }
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await callAnthropic({ key: process.env.ANTHROPIC_API_KEY, system, messages, max_tokens });
    if (r.ok) return r;
    lastReason = r.reason;
  }
  return { ok: false, reason: lastReason };
}

const COMPAT_CHAIN = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

async function callOpenAICompat({ key, system, messages, max_tokens }) {
  const base = (process.env.OPENAI_COMPAT_BASE || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
  const chain = process.env.OPENAI_COMPAT_MODEL
    ? [process.env.OPENAI_COMPAT_MODEL, ...COMPAT_CHAIN.filter((m) => m !== process.env.OPENAI_COMPAT_MODEL)]
    : COMPAT_CHAIN;
  const msgs = [...(system ? [{ role: 'system', content: system }] : []), ...messages];
  let lastReason = 'compat_error';
  for (const model of chain) {
    try {
      const r = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
        body: JSON.stringify({ model, max_tokens, messages: msgs }),
      });
      const data = await r.json();
      if (data.error) { lastReason = `${model}: ${data.error.message || 'error'}`.slice(0, 140); continue; }
      const text = (data.choices?.[0]?.message?.content || '').trim();
      if (text) return { ok: true, text, provider: 'openai-compat', model };
      lastReason = `${model}: empty`;
    } catch (e) { lastReason = `${model}: ${String(e)}`.slice(0, 140); }
  }
  return { ok: false, reason: lastReason };
}

// Free-tier Gemini quota/availability varies per model, so walk a chain of
// models until one answers; only then does the caller use its canned fallback.
const GEMINI_CHAIN = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.0-flash'];

async function callGemini({ key, system, messages, max_tokens }) {
  // Map to Gemini's format: roles are 'user' | 'model'; contents should start with a user turn.
  const contents = messages
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  while (contents.length && contents[0].role === 'model') contents.shift();

  const chain = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...GEMINI_CHAIN.filter((m) => m !== process.env.GEMINI_MODEL)]
    : GEMINI_CHAIN;

  let lastReason = 'gemini_error';
  for (const model of chain) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            system_instruction: system ? { parts: [{ text: system }] } : undefined,
            contents,
            generationConfig: { maxOutputTokens: max_tokens },
          }),
        }
      );
      const data = await r.json();
      if (data.error) { lastReason = `${model}: ${data.error.message || data.error.status || 'error'}`; continue; }
      const text = (data.candidates?.[0]?.content?.parts || [])
        .filter((p) => !p.thought) // skip thinking-model reasoning parts
        .map((p) => p.text || '')
        .join('')
        .trim();
      if (text) return { ok: true, text, provider: 'gemini', model };
      lastReason = `${model}: empty`;
    } catch (e) {
      lastReason = `${model}: ${String(e)}`;
    }
  }
  return { ok: false, reason: lastReason };
}

async function callAnthropic({ key, system, messages, max_tokens }) {
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });
    const data = await r.json();
    if (data.error) return { ok: false, reason: data.error.message || 'anthropic_error' };
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return text ? { ok: true, text, provider: 'anthropic' } : { ok: false, reason: 'empty' };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}
