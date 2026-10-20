(() => {
  'use strict';
  const pixelId = '251383929491305';
  const key = 'calace_ads_consent_v1';
  const params = new URLSearchParams(location.search);
  const internal = params.get('qa') === '1' || params.get('traffic') === 'codex_test' || params.get('utm_source') === 'review' || navigator.webdriver === true;
  const safe = new URLSearchParams();
  for (const name of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    const value = params.get(name);
    if (value && /^[A-Za-z0-9_.-]{1,100}$/.test(value)) safe.set(name, value);
  }
  window.calaceLandingContext = {internal, source: Object.fromEntries(safe)};
  try { history.replaceState(null, '', location.pathname + (safe.size ? '?' + safe : '')); } catch (_) {}
  const panel = document.getElementById('ad-consent');
  let choice = '';
  try { choice = localStorage.getItem(key) || ''; } catch (_) {}
  function start() {
    if (internal || choice !== 'allow' || window.fbq) return;
    const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    window._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    f('set', 'autoConfig', false, pixelId);
    f('consent', 'grant');
    f('init', pixelId);
    f('trackSingle', pixelId, 'PageView');
    const script = document.createElement('script');
    script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  function choose(value) {
    choice = value;
    try { localStorage.setItem(key, value); } catch (_) {}
    panel.hidden = true;
    if (value === 'allow') start();
    else if (window.fbq) window.fbq('consent', 'revoke');
  }
  panel.hidden = internal || !!choice;
  document.getElementById('ad-allow').onclick = () => choose('allow');
  document.getElementById('ad-decline').onclick = () => choose('decline');
  document.getElementById('ad-preferences').onclick = () => { panel.hidden = false; };
  start();
})();
