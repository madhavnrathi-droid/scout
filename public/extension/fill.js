// Scout Autofill — fills any application form from your Scout profile.
// Hard rules: fills ONLY when you click, NEVER submits anything, and never
// touches password, OTP, CAPTCHA, or payment fields.
(function () {
  if (window.__scoutFillLoaded) return; window.__scoutFillLoaded = true;
  const HOST_SELF = /opportune-six\.vercel\.app|localhost:3001/.test(location.host);
  if (HOST_SELF && !window.__scoutHarness) return;        // never on Scout itself (test harness excepted)

  const FORBIDDEN = /(pass|pwd|otp|cvv|card|credit|debit|upi|iban|routing|ssn|captcha|secret|token)/i;

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

  function labelFor(el) {
    let t = [el.name, el.id, el.placeholder, el.getAttribute('aria-label')].filter(Boolean).join(' ');
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) t += ' ' + l.textContent; }
    const wrap = el.closest('label') || el.closest('[role="listitem"]') || el.closest('.form-group, .field, .question, [data-params]');
    if (wrap) t += ' ' + (wrap.querySelector('label, .label, [role="heading"], .freebirdFormviewerComponentsQuestionBaseTitle')?.textContent || wrap.textContent.slice(0, 120));
    return t.slice(0, 260);
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

  /* scan the page: which fields do we understand, what would we put, what's missing */
  function scanForm(D) {
    const matched = [], missing = [];
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      if (el.disabled || el.readOnly || el.type === 'hidden' || el.type === 'file' || el.type === 'submit' || el.type === 'button') return;
      const ctx = labelFor(el) + ' ' + (el.type || '');
      if (FORBIDDEN.test(ctx) || el.type === 'password') return;
      for (const [key, re] of RULES) {
        if (!re.test(ctx)) continue;
        const val = String(valueFor(key, D) || '').trim();
        const label = (ctx.trim().split(/\s{2,}|\n/)[0] || key).slice(0, 34);
        if (val) matched.push({ el, key, val, label, has: !!(el.value && String(el.value).trim()) });
        else missing.push({ key, label });
        return;
      }
    });
    return { matched, missing };
  }

  function fillOne(m) {
    const el = m.el;
    if (el.tagName === 'SELECT') {
      const opt = [...el.options].find((o) => o.textContent.toLowerCase().includes(m.val.toLowerCase().slice(0, 12)));
      if (!opt) return false;
      el.value = opt.value;
    } else el.value = m.val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.style.boxShadow = '0 0 0 2px #FF3F6C66';
    setTimeout(() => { el.style.boxShadow = ''; }, 2000);
    return true;
  }

  /* the Scout overlay — a takeover panel that shows exactly what it will do */
  function openOverlay() {
    chrome.storage.local.get('scoutData', ({ scoutData }) => {
      if (!scoutData) { flash('Open your Scout tab once to sync, then try again'); return; }
      closeOverlay();
      const { matched, missing } = scanForm(scoutData);
      const p = document.createElement('div');
      p.id = '__scout_overlay';
      p.style.cssText = 'position:fixed;top:16px;right:16px;bottom:16px;width:340px;max-width:92vw;z-index:2147483647;background:#FCFCFA;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.3);font:13px/1.45 system-ui;color:#101010;display:flex;flex-direction:column;overflow:hidden';
      const fresh = matched.filter((m) => !m.has);
      p.innerHTML = `
        <div style="display:flex;align-items:center;gap:9px;padding:14px 16px;border-bottom:1px solid #E4E2DA">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF3F6C"><path d="M12 21.2s-7.6-4.6-9.9-9.4C.7 8.3 2.4 4.8 5.8 4.3 8 3.95 10 5 12 7.3c2-2.3 4-3.35 6.2-3 3.4.5 5.1 4 3.7 7.5C19.6 16.6 12 21.2 12 21.2z"/></svg>
          <b style="font-size:14px">Scout Autofill</b>
          <span style="margin-left:auto;font-size:11px;color:#6F6D66">${matched.length} understood</span>
          <button id="__sc_close" style="border:none;background:none;cursor:pointer;font-size:16px;color:#6F6D66;padding:2px 6px">✕</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:10px 14px">
          ${fresh.length ? `<div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:#ABA9A1;margin:6px 2px">WILL FILL</div>` : ''}
          ${fresh.map((m, i) => `<label style="display:flex;gap:9px;align-items:flex-start;padding:8px 6px;border-radius:10px;cursor:pointer"><input type="checkbox" checked data-i="${i}" style="margin-top:2px;accent-color:#FF3F6C"><span style="min-width:0"><b style="display:block;font-size:12px">${m.label.replace(/</g, '&lt;')}</b><i style="font-style:normal;font-size:11.5px;color:#6F6D66;word-break:break-word">${String(m.val).slice(0, 70).replace(/</g, '&lt;')}</i></span></label>`).join('')}
          ${matched.filter((m) => m.has).length ? `<div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:#ABA9A1;margin:12px 2px 6px">ALREADY FILLED — LEFT ALONE</div>${matched.filter((m) => m.has).map((m) => `<div style="padding:5px 6px;font-size:11.5px;color:#6F6D66">✓ ${m.label.replace(/</g, '&lt;')}</div>`).join('')}` : ''}
          ${missing.length ? `<div style="font-size:10px;font-weight:700;letter-spacing:.08em;color:#ABA9A1;margin:12px 2px 6px">SCOUT DOESN'T KNOW YET</div>${missing.map((m) => `<div style="padding:5px 6px;font-size:11.5px;color:#8A5200">• ${m.label.replace(/</g, '&lt;')} — add it in Scout → Profile</div>`).join('')}` : ''}
          ${!matched.length && !missing.length ? '<div style="padding:20px 8px;color:#6F6D66">No recognisable form fields on this page.</div>' : ''}
        </div>
        <div style="padding:12px 14px;border-top:1px solid #E4E2DA;display:flex;gap:8px;align-items:center">
          <button id="__sc_fill" style="flex:1;border:none;background:#101010;color:#fff;font:600 13px system-ui;padding:12px;border-radius:12px;cursor:pointer">Fill ${fresh.length} field${fresh.length === 1 ? '' : 's'}</button>
        </div>
        <div style="padding:0 14px 12px;font-size:10px;color:#ABA9A1">Fills only — you review and submit. Passwords &amp; payments are never touched.</div>`;
      document.body.appendChild(p);
      p.querySelector('#__sc_close').onclick = closeOverlay;
      p.querySelector('#__sc_fill').onclick = () => {
        let n = 0;
        p.querySelectorAll('input[type=checkbox]').forEach((cb) => { if (cb.checked && fresh[+cb.dataset.i] && fillOne(fresh[+cb.dataset.i])) n++; });
        flash(`Filled ${n} field${n === 1 ? '' : 's'} — review before you submit`);
        closeOverlay();
      };
    });
  }
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

  // the button only appears on pages that actually look like forms
  function maybeButton() {
    const fields = document.querySelectorAll('input:not([type=hidden]):not([type=submit]), textarea').length;
    if (fields < 3 || document.getElementById('__scout_fill_btn')) return;
    const b = document.createElement('button');
    b.id = '__scout_fill_btn'; b.type = 'button'; b.title = 'Fill with Scout';
    b.style.cssText = 'position:fixed;bottom:22px;right:22px;z-index:2147483647;width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;background:#fff;box-shadow:0 10px 34px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .15s';
    b.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="#FF3F6C"><path d="M12 21.2s-7.6-4.6-9.9-9.4C.7 8.3 2.4 4.8 5.8 4.3 8 3.95 10 5 12 7.3c2-2.3 4-3.35 6.2-3 3.4.5 5.1 4 3.7 7.5C19.6 16.6 12 21.2 12 21.2z"/></svg>';
    b.onmouseenter = () => { b.style.transform = 'scale(1.1)'; };
    b.onmouseleave = () => { b.style.transform = ''; };
    b.onclick = openOverlay;
    document.body.appendChild(b);
  }
  maybeButton();
  new MutationObserver(() => maybeButton()).observe(document.documentElement, { childList: true, subtree: true });
})();
