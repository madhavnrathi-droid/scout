// Scout Autofill — a supervised agent that fills any application form from your
// Scout profile while you watch.
//
// The trust contract, enforced as code below (not as comments):
//   • ALLOWLIST, never denylist. The agent only touches fields it can map to a
//     known dossier key via RULES. A field it doesn't understand is left alone.
//   • VALUES COME ONLY FROM YOUR DOSSIER. Page text is data, never instructions —
//     nothing the page says can make the agent do something. (Prompt-injection safe.)
//   • NEVER submits, pays, or confirms. The plan cannot contain a submit step; the
//     agent stops at the review and hands back. The final click is always yours.
//   • Password / OTP / CAPTCHA / payment / government-ID fields are unreachable.
//   • STOP is always one click away, and the page is visibly locked while the agent
//     drives — you can see exactly what it is doing, and halt it instantly.
//   • No background / headless mode. The agent only ever runs where you can watch it.
(function () {
  if (window.__scoutFillLoaded) return; window.__scoutFillLoaded = true;
  const HOST_SELF = /opportune-six\.vercel\.app|localhost:3001/.test(location.host);
  if (HOST_SELF && !window.__scoutHarness) return;        // never on Scout itself (test harness excepted)

  const FORBIDDEN = /(pass|pwd|otp|cvv|card|credit|debit|upi|iban|routing|ssn|aadhaar|aadhar|captcha|secret|token)/i;
  const PINK = '#FF3F6C', INK = '#101010';

  // field-intent map: regex over (label + name + id + placeholder + aria-label)
  const RULES = [
    ['firstName', /first\s*name|given\s*name|fname/i],
    ['lastName', /last\s*name|surname|family\s*name|lname/i],
    ['fullName', /^(full\s*)?name$|applicant\s*name|your\s*name|candidate\s*name/i],
    ['email', /e-?mail/i],
    ['phone', /phone|mobile|contact\s*(no|number)|whatsapp/i],
    ['dob', /date\s*of\s*birth|dob|birth\s*date/i],
    ['gender', /gender|sex\b/i],
    ['fatherName', /father/i],
    ['motherName', /mother/i],
    ['address1', /address(?!.*email)|street|line\s*1/i],
    ['city', /city|town/i],
    ['state', /\bstate\b(?!ment)|province/i],
    ['pincode', /pin\s*code|zip|postal/i],
    ['nationality', /nationality|citizen/i],
    ['category', /category|caste|reservation/i],
    ['board10', /class\s*10.*board|x\s*board|sslc.*board|10th.*board/i],
    ['pct10', /class\s*10.*(%|percent|marks|cgpa)|10th.*(%|percent|marks)|x\s*(%|percent)/i],
    ['board12', /class\s*12.*board|xii\s*board|hsc.*board|12th.*board/i],
    ['pct12', /class\s*12.*(%|percent|marks|cgpa)|12th.*(%|percent|marks)|xii\s*(%|percent)/i],
    ['stream12', /stream|group\s*(of\s*study)?/i],
    ['college', /college|university|institute|school\s*name/i],
    ['degree', /degree|qualification|course/i],
    ['branch', /branch|major|specialization|discipline/i],
    ['cgpa', /cgpa|gpa|aggregate/i],
    ['gradYear', /graduat(e|ion)\s*(year)?|passing\s*year|year\s*of\s*pass/i],
    ['workExYears', /work\s*ex|experience\s*(in\s*)?years?/i],
    ['jee', /jee/i], ['neet', /neet/i], ['cat', /\bcat\b.*(score|percentile)/i], ['gate', /\bgate\b/i],
    ['sat', /\bsat\b/i], ['gre', /\bgre\b/i], ['gmat', /gmat/i], ['ielts', /ielts/i], ['toefl', /toefl/i],
    ['linkedin', /linkedin/i], ['github', /github/i], ['portfolio', /portfolio|website|personal\s*site/i],
    ['personalStatement', /personal\s*statement|statement\s*of\s*purpose|\bsop\b|about\s*(you|yourself)|tell\s*us\s*about/i],
    ['whyProgram', /why\s*(do\s*you|this|us|our)|motivation|reason\s*for\s*applying/i],
    ['activities', /activities|achievements|awards|extra-?curricular/i],
  ];

  // the wide context string used for MATCHING — more signal = better field mapping
  function labelFor(el) {
    let t = [el.name, el.id, el.placeholder, el.getAttribute('aria-label')].filter(Boolean).join(' ');
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) t += ' ' + l.textContent; }
    const wrap = el.closest('label') || el.closest('[role="listitem"]') || el.closest('.form-group, .field, .question, [data-params]');
    if (wrap) t += ' ' + (wrap.querySelector('label, .label, [role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle')?.textContent || wrap.textContent.slice(0, 120));
    return t.slice(0, 260);
  }
  // the clean human label used for DISPLAY — the associated <label>, else placeholder/aria, else a humanised name
  function displayLabel(el) {
    let l = '';
    if (el.id) { const forL = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (forL) l = forL.textContent; }
    if (!l) { const wrapL = el.closest('label'); if (wrapL) l = wrapL.textContent; }
    if (!l) l = el.getAttribute('aria-label') || el.placeholder || '';
    if (!l) l = (el.name || el.id || 'field').replace(/[_\-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    l = l.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
    return (l.charAt(0).toUpperCase() + l.slice(1)).slice(0, 42);
  }

  function valueFor(key, D) {
    const m = D.master || {}, k = D.kit || {}, p = D.profile || {}, u = D.user || {};
    const map = {
      fullName: [m.firstName, m.lastName].filter(Boolean).join(' ') || k.name || u.name || p.name,
      firstName: m.firstName || (k.name || u.name || '').split(' ')[0],
      lastName: m.lastName || (k.name || u.name || '').split(' ').slice(1).join(' '),
      email: k.email || u.email, phone: m.phone || k.phone,
      college: m.college || k.institution || p.institution, gradYear: m.gradYear || p.gradYear,
      cgpa: m.cgpa || p.cgpa, city: m.city || k.city || p.city,
      github: m.github || k.github, linkedin: m.linkedin || k.linkedin, portfolio: m.portfolio || k.portfolio,
    };
    return map[key] != null && String(map[key]).trim() ? map[key] : (m[key] != null ? m[key] : '');
  }

  /* scan the page into a PLAN — an ordered, inspectable list of steps.
     A field is only in the plan if RULES maps its label AND the dossier has a value.
     Nothing here reads instructions from the page; values come only from the dossier. */
  function buildPlan(D) {
    const steps = [], missing = [], already = [];
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      if (el.disabled || el.readOnly || el.type === 'hidden' || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
      const ctx = labelFor(el) + ' ' + (el.type || '');
      if (FORBIDDEN.test(ctx) || el.type === 'password') return;   // unreachable, structurally
      for (const [key, re] of RULES) {
        if (!re.test(ctx)) continue;
        const val = String(valueFor(key, D) || '').trim();
        const label = displayLabel(el);
        if (val && el.value && String(el.value).trim()) already.push({ key, label });
        else if (val) steps.push({ kind: 'fill', el, key, val, label });
        else missing.push({ key, label });
        return;
      }
    });
    // the plan can NEVER contain a submit/confirm step. It ends by handing back.
    return { steps, missing, already };
  }

  function setFieldValue(el, val) {
    if (el.tagName === 'SELECT') {
      const opt = [...el.options].find((o) => o.textContent.toLowerCase().includes(String(val).toLowerCase().slice(0, 12)));
      if (!opt) return false;
      el.value = opt.value;
    } else {
      // native setter so React/Vue controlled inputs register the change
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      if (setter) setter.call(el, val); else el.value = val;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  /* ─────────── the agent: visible, stoppable, step-by-step ─────────── */
  const AG = { running: false, stopped: false };

  // Stop must let the current wait RESOLVE (so the loop continues to its stop-check)
  // — not clear the timeout, which would leave the await hanging forever.
  function sleep(ms) {
    return new Promise((r) => {
      AG._resolve = r;
      AG._t = setTimeout(() => { AG._resolve = null; r(); }, ms);
    });
  }

  function lockPage() {
    let v = document.getElementById('__scout_veil');
    if (!v) {
      v = document.createElement('div'); v.id = '__scout_veil';
      v.style.cssText = 'position:fixed;inset:0;z-index:2147483640;background:rgba(16,16,16,.14);backdrop-filter:saturate(.85);cursor:not-allowed';
      // block interaction with the page while the agent drives — but STOP (higher z) stays live
      v.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); }, true);
      document.body.appendChild(v);
    }
    v.style.display = 'block';
  }
  function unlockPage() { const v = document.getElementById('__scout_veil'); if (v) v.style.display = 'none'; }

  function halo(el) {
    let h = document.getElementById('__scout_halo');
    if (!h) {
      h = document.createElement('div'); h.id = '__scout_halo';
      h.style.cssText = 'position:fixed;z-index:2147483645;pointer-events:none;border-radius:12px;box-shadow:0 0 0 3px ' + PINK + ', 0 0 0 8px ' + PINK + '33;transition:all .32s cubic-bezier(.3,.8,.3,1);opacity:0';
      document.body.appendChild(h);
    }
    const r = el.getBoundingClientRect();
    h.style.opacity = '1';
    h.style.top = (r.top - 4) + 'px'; h.style.left = (r.left - 4) + 'px';
    h.style.width = (r.width + 8) + 'px'; h.style.height = (r.height + 8) + 'px';
  }
  function haloOff() { const h = document.getElementById('__scout_halo'); if (h) h.style.opacity = '0'; }

  // the persistent control bar — STOP is above the veil, always clickable
  function controlBar() {
    let c = document.getElementById('__scout_ctl');
    if (c) return c;
    c = document.createElement('div'); c.id = '__scout_ctl';
    c.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483646;display:flex;align-items:center;gap:12px;background:' + INK + ';color:#fff;padding:11px 14px 11px 18px;border-radius:16px;box-shadow:0 16px 50px rgba(0,0,0,.35);font:13px/1.3 system-ui;max-width:min(560px,94vw)';
    c.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${PINK}" style="flex:0 0 auto"><path d="M12 21.2s-7.6-4.6-9.9-9.4C.7 8.3 2.4 4.8 5.8 4.3 8 3.95 10 5 12 7.3c2-2.3 4-3.35 6.2-3 3.4.5 5.1 4 3.7 7.5C19.6 16.6 12 21.2 12 21.2z"/></svg>
      <div style="flex:1;min-width:0"><b id="__sc_step" style="display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Reading the form…</b><i id="__sc_sub" style="font-style:normal;font-size:11px;color:#B9B7AE">Scout is in control · watch it work</i></div>
      <button id="__sc_stop" style="flex:0 0 auto;border:none;background:#fff;color:${INK};font:600 12px system-ui;padding:8px 14px;border-radius:10px;cursor:pointer">Stop</button>`;
    document.body.appendChild(c);
    c.querySelector('#__sc_stop').onclick = () => stopAgent('You stopped Scout');
    return c;
  }
  function say(step, sub) {
    const s = document.getElementById('__sc_step'), b = document.getElementById('__sc_sub');
    if (s) s.textContent = step; if (b && sub != null) b.textContent = sub;
  }
  function removeControl() { const c = document.getElementById('__scout_ctl'); if (c) c.remove(); }

  function stopAgent() {
    AG.stopped = true;
    clearTimeout(AG._t);
    if (AG._resolve) { const r = AG._resolve; AG._resolve = null; r(); }   // unblock the pending wait so the loop can break cleanly
  }

  async function runAgent(D) {
    if (AG.running) return; AG.running = true; AG.stopped = false;
    const plan = buildPlan(D);
    controlBar(); lockPage();
    if (!plan.steps.length) {
      say('Nothing new to fill', plan.already.length ? 'Everything Scout knows is already filled in' : 'No fields Scout recognises on this page');
      await sleep(1600); finish(plan, 0); return;
    }
    say(`Filling ${plan.steps.length} field${plan.steps.length === 1 ? '' : 's'} — you can Stop any time`, 'Scout is in control · watch it work');
    await sleep(700);

    let done = 0;
    for (let i = 0; i < plan.steps.length; i++) {
      if (AG.stopped) break;
      const step = plan.steps[i];
      if (!document.contains(step.el)) continue;                 // page changed under us — skip, never guess
      step.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(260);
      if (AG.stopped) break;
      halo(step.el);
      say(`${step.label}`, `Step ${i + 1} of ${plan.steps.length} · ${String(step.val).slice(0, 46)}`);
      await sleep(340);
      if (AG.stopped) break;
      if (setFieldValue(step.el, step.val)) { step._done = true; done++; }
      step.el.style.transition = 'box-shadow .3s'; step.el.style.boxShadow = '0 0 0 2px ' + PINK + '66';
      await sleep(360);
    }
    haloOff();
    finish(plan, done);
  }

  function finish(plan, done) {
    AG.running = false;
    unlockPage(); removeControl();
    haloOff();
    artifact(plan, done, AG.stopped);
    AG.stopped = false;
  }

  /* the artifact — what the agent actually did, beside what it drew from, plus the
     one thing it will never do for you: the final submit. */
  function artifact(plan, done, wasStopped) {
    closeOverlay();
    const filled = plan.steps.filter((s) => s._done);
    const p = document.createElement('div');
    p.id = '__scout_overlay';
    p.style.cssText = panelCss();
    p.innerHTML = `
      ${panelHead(wasStopped ? 'Stopped' : 'Done — your turn')}
      <div style="flex:1;overflow-y:auto;padding:12px 14px">
        <div style="padding:12px 14px;border-radius:12px;background:${wasStopped ? '#FBF2E6' : '#EAF6EE'};margin-bottom:12px">
          <b style="font-size:13px">${wasStopped ? `Stopped after ${done} field${done === 1 ? '' : 's'}` : `Filled ${done} field${done === 1 ? '' : 's'} for you`}</b>
          <div style="font-size:11.5px;color:#6F6D66;margin-top:3px">${wasStopped ? 'Nothing was submitted. Pick up where Scout left off.' : 'Scout does not submit. Read it over, then submit it yourself.'}</div>
        </div>
        ${filled.length ? `<div style="${grpCss()}">SCOUT FILLED</div>${filled.map((s) => rowCss('✓', s.label, String(s.val).slice(0, 60), '#1F7A47')).join('')}` : ''}
        ${plan.already.length ? `<div style="${grpCss()}">ALREADY FILLED — LEFT ALONE</div>${plan.already.map((m) => rowCss('·', m.label, '', '#6F6D66')).join('')}` : ''}
        ${plan.missing.length ? `<div style="${grpCss()}">YOUR TURN — SCOUT DIDN'T KNOW THESE</div>${plan.missing.map((m) => rowCss('•', m.label, 'add it in Scout → Your details', '#8A5200')).join('')}` : ''}
      </div>
      <div style="padding:12px 14px;border-top:1px solid #E4E2DA">
        <button id="__sc_close2" style="width:100%;border:none;background:${INK};color:#fff;font:600 13px system-ui;padding:12px;border-radius:12px;cursor:pointer">Review &amp; submit — your click</button>
        <div style="text-align:center;font-size:10px;color:#ABA9A1;margin-top:8px">Scout never submits, pays, or confirms. That is always you.</div>
      </div>`;
    document.body.appendChild(p);
    p.querySelector('#__sc_close2').onclick = closeOverlay;
  }

  const panelCss = () => 'position:fixed;top:16px;right:16px;bottom:16px;width:344px;max-width:92vw;z-index:2147483641;background:#FCFCFA;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.3);font:13px/1.45 system-ui;color:#101010;display:flex;flex-direction:column;overflow:hidden';
  const grpCss = () => 'font-size:10px;font-weight:700;letter-spacing:.08em;color:#ABA9A1;margin:12px 2px 6px';
  const rowCss = (mark, label, sub, col) => `<div style="display:flex;gap:8px;padding:6px 6px;font-size:11.5px;color:${col}"><span>${mark}</span><span style="min-width:0"><b style="font-weight:500;color:#101010">${esc(label)}</b>${sub ? `<i style="font-style:normal;display:block;color:#6F6D66;word-break:break-word">${esc(sub)}</i>` : ''}</span></div>`;
  function panelHead(right) {
    return `<div style="display:flex;align-items:center;gap:9px;padding:14px 16px;border-bottom:1px solid #E4E2DA">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="${PINK}"><path d="M12 21.2s-7.6-4.6-9.9-9.4C.7 8.3 2.4 4.8 5.8 4.3 8 3.95 10 5 12 7.3c2-2.3 4-3.35 6.2-3 3.4.5 5.1 4 3.7 7.5C19.6 16.6 12 21.2 12 21.2z"/></svg>
      <b style="font-size:14px">Scout</b>
      <span style="margin-left:auto;font-size:11px;color:#6F6D66">${esc(right)}</span>
      <button id="__sc_close" style="border:none;background:none;cursor:pointer;font-size:16px;color:#6F6D66;padding:2px 6px">✕</button>
    </div>`;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  /* the plan preview — shown BEFORE the agent runs, so you approve what it will do.
     This is the "explicit plan up front" that watched agents like Comet lack. */
  function openOverlay() {
    const withData = (scoutData) => {
      if (!scoutData) { flash('Open your Scout tab once to sync, then try again'); return; }
      closeOverlay();
      const plan = buildPlan(scoutData);
      const p = document.createElement('div');
      p.id = '__scout_overlay'; p.style.cssText = panelCss();
      p.innerHTML = `
        ${panelHead(plan.steps.length + ' to fill')}
        <div style="flex:1;overflow-y:auto;padding:12px 14px">
          <div style="font-size:12px;color:#6F6D66;margin:2px 2px 12px">Scout will fill these while you watch. Nothing is submitted — you review and send.</div>
          ${plan.steps.length ? `<div style="${grpCss()}">WILL FILL — ${plan.steps.length}</div>${plan.steps.map((s) => rowCss('→', s.label, String(s.val).slice(0, 60), '#101010')).join('')}` : `<div style="padding:16px 6px;color:#6F6D66">Nothing new to fill — ${plan.already.length ? 'the form already has everything Scout knows.' : 'Scout doesn\'t recognise fields on this page.'}</div>`}
          ${plan.missing.length ? `<div style="${grpCss()}">SCOUT DOESN'T KNOW YET</div>${plan.missing.map((m) => rowCss('•', m.label, 'add it in Scout → Your details', '#8A5200')).join('')}` : ''}
        </div>
        <div style="padding:12px 14px;border-top:1px solid #E4E2DA">
          <button id="__sc_run" style="width:100%;border:none;background:${plan.steps.length ? INK : '#C9C7BF'};color:#fff;font:600 13px system-ui;padding:12px;border-radius:12px;cursor:${plan.steps.length ? 'pointer' : 'default'}" ${plan.steps.length ? '' : 'disabled'}>${plan.steps.length ? 'Watch Scout fill it' : 'Nothing to fill'}</button>
          <div style="text-align:center;font-size:10px;color:#ABA9A1;margin-top:8px">You can Stop any time. Passwords, payments &amp; OTPs are never touched.</div>
        </div>`;
      document.body.appendChild(p);
      p.querySelector('#__sc_close').onclick = closeOverlay;
      const run = p.querySelector('#__sc_run');
      if (plan.steps.length) run.onclick = () => { closeOverlay(); getData(runAgent); };
    };
    getData(withData);
  }

  // one data path for both the extension (chrome.storage) and the test harness
  function getData(cb) {
    if (window.__scoutHarness) { cb(window.__scoutHarness); return; }
    try { chrome.storage.local.get('scoutData', ({ scoutData }) => cb(scoutData)); }
    catch { cb(null); }
  }
  window.__scoutAgent = { open: openOverlay, run: () => getData(runAgent), stop: () => stopAgent('stopped') };

  function closeOverlay() { const x = document.getElementById('__scout_overlay'); if (x) x.remove(); }

  function flash(msg) {
    let el = document.getElementById('__scout_flash');
    if (!el) {
      el = document.createElement('div'); el.id = '__scout_flash';
      el.style.cssText = 'position:fixed;bottom:84px;right:22px;z-index:2147483646;background:#101010;color:#fff;font:13px/1.4 system-ui;padding:10px 16px;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.3);transition:opacity .3s';
      document.body.appendChild(el);
    }
    el.textContent = msg; el.style.opacity = '1';
    clearTimeout(el.__t); el.__t = setTimeout(() => { el.style.opacity = '0'; }, 3500);
  }

  // the launcher only appears on pages that actually look like forms
  function maybeButton() {
    const fields = document.querySelectorAll('input:not([type=hidden]):not([type=submit]), textarea').length;
    if (fields < 3 || document.getElementById('__scout_fill_btn')) return;
    const b = document.createElement('button');
    b.id = '__scout_fill_btn'; b.type = 'button'; b.title = 'Apply with Scout';
    b.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:2147483639;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:#fff;box-shadow:0 10px 34px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .15s';
    b.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="#FF3F6C"><path d="M12 21.2s-7.6-4.6-9.9-9.4C.7 8.3 2.4 4.8 5.8 4.3 8 3.95 10 5 12 7.3c2-2.3 4-3.35 6.2-3 3.4.5 5.1 4 3.7 7.5C19.6 16.6 12 21.2 12 21.2z"/></svg>';
    b.onmouseenter = () => { b.style.transform = 'scale(1.1)'; };
    b.onmouseleave = () => { b.style.transform = ''; };
    b.onclick = openOverlay;
    document.body.appendChild(b);
  }
  maybeButton();
  new MutationObserver(() => maybeButton()).observe(document.documentElement, { childList: true, subtree: true });
})();
