(function () {
  'use strict';
  const config = window.RUDIRISE_CONFIG || {};
  const consentKey = 'rudirise_marketing_consent_v1';
  const params = new URLSearchParams(window.location.search);
  const creative = /^(S|V)(0[1-9]|10)$/.test(params.get('creative') || '') ? params.get('creative') : '';
  const offer = params.get('offer') === 'pdf' ? 'pdf' : 'app';
  const qaMode = params.get('qa') === '1';
  const validPixel = /^\d{8,20}$/.test(String(config.pixelId || ''));
  const consentPanel = document.getElementById('consent');
  let consent = 'unset', pixelStarted = false, viewSent = false, handoffStarted = false;
  let redirectTimer = null;
  const redirectNotice = document.getElementById('redirect-notice');
  const redirectSessionKey = 'rudirise_auto_handoff_v1';
  const eventsSent = new Set();
  const destination = new URL('https://apps.apple.com/app/id6798422268');
  // Never accept a destination/pixel/provider from URL parameters (open redirect / account injection).
  if (/^\d+$/.test(String(config.appleProviderToken || ''))) {
    destination.searchParams.set('pt', String(config.appleProviderToken));
    const token = String(config.appleCampaignToken || 'rudirise_meta_20261002');
    if (/^[A-Za-z0-9_-]{1,30}$/.test(token)) destination.searchParams.set('ct', token);
    destination.searchParams.set('mt', '8');
  }
  // Strip unknown parameters before Meta can collect this page URL. No email, raw prompts or hashes.
  const safeParams = new URLSearchParams();
  ['utm_source','utm_medium','utm_campaign','utm_content','campaign_id','adset_id','ad_id','placement'].forEach(key => {
    const value = params.get(key);
    if (value && /^[A-Za-z0-9_.{}-]{1,100}$/.test(value)) safeParams.set(key, value);
  });
  if (creative) safeParams.set('creative', creative);
  if (offer === 'pdf') safeParams.set('offer', 'pdf');
  // fbclid remains in memory until consent, never persisted by our code or forwarded to Apple.
  const clickId = params.get('fbclid');
  if (qaMode) safeParams.set('qa', '1');
  try { window.history.replaceState(null, '', window.location.pathname + (safeParams.size ? '?' + safeParams : '')); } catch (_) {}

  document.querySelectorAll('.store-link').forEach(link => { link.href = destination.href; });
  if (offer === 'pdf') {
    document.title = 'Free 5-minute Rudiment Reset — RudiRise';
    document.getElementById('eyebrow').textContent = 'FREE PRACTICE GUIDE · NO EMAIL REQUIRED';
    document.getElementById('hero-title').innerHTML = 'Your 5-minute<br><span>rudiment reset.</span>';
    document.getElementById('hero-lead').textContent = 'Three sticking patterns, controlled tempo steps and a printable practice log. Download the free guide, then try RudiRise if it fits your practice.';
    const main = document.getElementById('main-cta');
    main.classList.remove('store-link'); main.classList.add('pdf-link');
    main.href = 'rudirise/RudiRise-Free-5-Minute-Rudiment-Reset.pdf';
    main.textContent = 'Download the free 5-page PDF ↓';
    const secondary = document.getElementById('secondary-cta');
    secondary.classList.remove('pdf-link'); secondary.classList.add('store-link');
    secondary.href = destination.href; secondary.textContent = 'Explore RudiRise on the App Store ↗';
    document.getElementById('hero-fine').textContent = 'Use the guide with any metronome. RudiRise is optional. No email or purchase needed for the PDF.';
  }

  function saveConsent(value) {
    consent = value;
    try { localStorage.setItem(consentKey, JSON.stringify({ value, time: Date.now() })); } catch (_) {}
  }
  function pixelEvent(name, placement) {
    if (consent !== 'granted' || !pixelStarted || qaMode || eventsSent.has(name + ':' + placement)) return;
    eventsSent.add(name + ':' + placement);
    window.fbq('trackSingleCustom', String(config.pixelId), name, {
      app: 'RudiRise', offer, creative: creative || 'unassigned', placement
    });
  }
  function startPixel() {
    if (!validPixel || qaMode || consent !== 'granted' || pixelStarted) return;
    // Don't attach to or reuse a pre-existing unrelated dataset.
    if (window.fbq) return;
    const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    window._fbq = fbq; fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    // Meta script is loaded ONLY after consent. No unconditional noscript tracking beacon.
    window.fbq('consent', 'grant');
    window.fbq('set', 'autoConfig', false, String(config.pixelId));
    window.fbq('init', String(config.pixelId));
    pixelStarted = true;
    if (clickId && /^[A-Za-z0-9_-]{1,500}$/.test(clickId)) {
      document.cookie = '_fbc=' + 'fb.1.' + Date.now() + '.' + clickId + '; Max-Age=7776000; Path=/; SameSite=Lax; Secure';
    }
    if (!viewSent) { window.fbq('trackSingle', String(config.pixelId), 'PageView'); viewSent = true; }
    const script = document.createElement('script'); script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
  function decline() {
    saveConsent('denied');
    if (pixelStarted && window.fbq) window.fbq('consent', 'revoke');
    // Remove consented ad cookies; include the apex domain that Meta may use.
    ['_fbp','_fbc'].forEach(name => {
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
      if (window.location.hostname === 'smartaitomation.com') document.cookie = name + '=; Max-Age=0; Path=/; Domain=.smartaitomation.com; SameSite=Lax; Secure';
    });
    consentPanel.hidden = true;
    document.getElementById('tracking-status').textContent = 'Advertising cookies declined. Downloads still work.';
  }
  document.getElementById('accept-tracking').addEventListener('click', () => {
    saveConsent('granted'); consentPanel.hidden = true;
    if (pixelStarted && window.fbq) window.fbq('consent', 'grant'); else startPixel();
    document.getElementById('tracking-status').textContent = validPixel && !qaMode ? 'Advertising measurement enabled.' : 'Preference saved. Advertising measurement is not active on this page.';
  });
  document.getElementById('decline-tracking').addEventListener('click', decline);
  document.getElementById('privacy-settings').addEventListener('click', () => {
    consentPanel.hidden = false; document.getElementById('decline-tracking').focus();
  });
  try {
    const stored = JSON.parse(localStorage.getItem(consentKey) || 'null');
    if (stored && ['granted','denied'].includes(stored.value) && Date.now() - stored.time < 15552000000) consent = stored.value;
  } catch (_) {}
  consentPanel.hidden = !validPixel || qaMode || consent !== 'unset';
  startPixel();

  function cancelAutoRedirect() {
    if (redirectTimer !== null) window.clearTimeout(redirectTimer);
    redirectTimer = null;
    if (redirectNotice) redirectNotice.hidden = true;
    try { sessionStorage.setItem(redirectSessionKey, 'handled'); } catch (_) {}
  }
  document.getElementById('stay-on-page').addEventListener('click', cancelAutoRedirect);
  // Do not trap visitors who return with Back, interfere with the promised PDF,
  // or mislabel an automatic handoff as an intentional click / install.
  let previouslyHandled = false;
  try { previouslyHandled = sessionStorage.getItem(redirectSessionKey) === 'handled'; } catch (_) {}
  if (offer === 'app' && !qaMode && !previouslyHandled && config.autoRedirectMs === 2000) {
    redirectNotice.hidden = false;
    redirectTimer = window.setTimeout(() => {
      if (handoffStarted) return;
      handoffStarted = true;
      cancelAutoRedirect();
      pixelEvent('AppStoreAutoRedirect', 'automatic');
      window.location.assign(destination.href);
    }, 2000);
  }
  document.querySelectorAll('a:not(.store-link)').forEach(link => link.addEventListener('click', cancelAutoRedirect));
  window.addEventListener('pagehide', cancelAutoRedirect);

  document.querySelectorAll('.store-link').forEach(link => link.addEventListener('click', event => {
    // Keep normal new-tab/modifier behavior and a true <a> fallback with JS disabled.
    pixelEvent('AppStoreClick', link.dataset.placement || 'unknown');
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (handoffStarted) return; handoffStarted = true;
    cancelAutoRedirect();
    // Give a consented Pixel a bounded chance to send; never wait indefinitely or block non-consenting users.
    window.setTimeout(() => { window.location.assign(destination.href); }, pixelStarted && consent === 'granted' ? 250 : 0);
  }));
  document.querySelectorAll('.pdf-link').forEach(link => link.addEventListener('click', () => {
    pixelEvent('GuideDownloadClick', link.dataset.placement || 'unknown');
  }));
})();
