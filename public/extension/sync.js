// Runs only on the Scout app. Mirrors the master profile into extension storage
// so the fill script works on any site — no servers, no tokens, your data stays local.
(function () {
  try {
    // announce presence so the Scout PWA can adapt the "apply with Scout" flow
    document.documentElement.setAttribute('data-scout-ext', '1.2.0');
    const grab = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
    const data = {
      master: grab('scout-master') || {},
      kit: grab('scout-kit') || {},
      profile: grab('scout-profile') || {},
      user: (() => { const u = grab('scout-user') || {}; return { name: u.name || '', email: u.email || '' }; })(),
      syncedAt: Date.now(),
    };
    if (Object.keys(data.master).length || Object.keys(data.kit).length) {
      chrome.storage.local.set({ scoutData: data }, () => {
        console.log('[Scout Autofill] profile synced', new Date().toLocaleTimeString());
      });
    }
  } catch (e) { /* never break the host page */ }
})();
