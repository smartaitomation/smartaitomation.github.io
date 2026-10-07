(() => {
  'use strict';
  const measurementId = 'G-TV98TNCDYE';
  const storageKey = 'smartaitomation_article_analytics_consent_v1';
  const pathname = location.pathname;
  const isArticle = pathname.endsWith('.html') && !pathname.endsWith('/analytics-privacy.html');
  const articleSlug = isArticle ? pathname.split('/').pop().replace(/\.html$/, '') : 'hub';
  const locale = document.documentElement.lang === 'ro' ? 'ro' : 'en';
  const copy = locale === 'ro'
    ? { message: 'Putem folosi Google Analytics pentru a măsura vizitele ghidurilor și clicurile către App Store? Nu trimitem conținutul tabelului.', yes: 'Accept', no: 'Refuz', settings: 'Preferințe pentru analiză', policy: 'Detalii despre analiză' }
    : { message: 'May we use Google Analytics to measure guide visits and App Store clicks? We do not send worksheet contents.', yes: 'Allow analytics', no: 'Decline', settings: 'Analytics preferences', policy: 'Analytics details' };
  let enabled = false;
  let choice = null;
  try { choice = localStorage.getItem(storageKey); } catch (_) { /* Storage can be unavailable. */ }

  function emit(name, extra = {}) {
    if (!enabled || typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({ article_slug: articleSlug, article_locale: locale }, extra));
  }

  function start() {
    if (enabled) return;
    enabled = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('config', measurementId, { send_page_view: false, anonymize_ip: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
    emit('page_view', { page_location: location.origin + pathname, page_title: document.title });
  }

  function save(value) {
    const wasEnabled = enabled;
    choice = value;
    try { localStorage.setItem(storageKey, value); } catch (_) { /* Choice applies for this page only. */ }
    document.querySelector('.article-analytics-choice')?.remove();
    if (value === 'allowed') start();
    else {
      enabled = false;
      if (wasEnabled) {
        window.gtag('consent', 'update', { analytics_storage: 'denied' });
        location.reload();
      }
    }
  }

  function showChoice() {
    document.querySelector('.article-analytics-choice')?.remove();
    const box = document.createElement('section');
    box.className = 'article-analytics-choice';
    box.setAttribute('aria-label', copy.settings);
    const message = document.createElement('p'); message.textContent = copy.message;
    const actions = document.createElement('div'); actions.className = 'article-analytics-actions';
    const allow = document.createElement('button'); allow.type = 'button'; allow.textContent = copy.yes;
    const decline = document.createElement('button'); decline.type = 'button'; decline.textContent = copy.no;
    const policy = document.createElement('a'); policy.href = '/articles/analytics-privacy.html'; policy.textContent = copy.policy;
    allow.addEventListener('click', () => save('allowed'));
    decline.addEventListener('click', () => save('declined'));
    actions.append(allow, decline, policy); box.append(message, actions); document.body.appendChild(box);
  }

  const footer = document.querySelector('.site-footer');
  if (footer) {
    const button = document.createElement('button');
    button.className = 'article-analytics-settings'; button.type = 'button'; button.textContent = copy.settings;
    button.addEventListener('click', showChoice); footer.appendChild(button);
  }
  if (choice === 'allowed') start();
  else if (choice !== 'declined') showChoice();

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || !enabled) return;
    const destination = new URL(link.href, location.href);
    if (destination.hostname === 'apps.apple.com') {
      emit('article_app_store_click', { app_name: link.dataset.app || '', link_position: link.dataset.position || 'other', app_store_id: destination.pathname.match(/id(\d+)/)?.[1] || '' });
    } else if (link.hasAttribute('download') && destination.pathname.endsWith('.csv')) {
      emit('article_worksheet_download', { worksheet_slug: destination.pathname.split('/').pop().replace(/\.csv$/, '') });
    } else if (destination.origin === location.origin && destination.pathname.startsWith('/articles/') && destination.pathname.endsWith('.html')) {
      emit('article_related_click', { destination_slug: destination.pathname.split('/').pop().replace(/\.html$/, '') });
    }
  });
  const seen = new Set();
  addEventListener('scroll', () => {
    if (!enabled) return;
    const travel = document.documentElement.scrollHeight - innerHeight;
    if (travel <= 0) return;
    const depth = Math.round(scrollY / travel * 100);
    for (const mark of [50, 90]) if (depth >= mark && !seen.has(mark)) { seen.add(mark); emit('article_scroll_depth', { percent: mark }); }
  }, { passive: true });

  // A section view means its heading reached the viewport. Reading time counts only
  // while that section and this tab are visible; it is an estimate, not proof of reading.
  if (isArticle && 'IntersectionObserver' in window) {
    const sections = [...document.querySelectorAll('article.content > section[id]')]
      .filter((section) => /^[a-z0-9-]{1,60}$/.test(section.id));
    const states = new Map(sections.map((section, index) => [section, {
      order: index + 1, visible: false, viewed: false, seconds: 0, milestones: new Set()
    }]));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const state = states.get(entry.target);
        if (!state) continue;
        state.visible = entry.isIntersecting;
      }
    }, { rootMargin: '0px 0px -25% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
    setInterval(() => {
      if (!enabled || document.hidden || !document.hasFocus()) return;
      for (const [section, state] of states) {
        if (!state.visible) continue;
        if (!state.viewed) {
          state.viewed = true;
          emit('article_section_view', { section_id: section.id, section_order: state.order });
        }
        state.seconds += 1;
        for (const mark of [10, 30]) {
          if (state.seconds >= mark && !state.milestones.has(mark)) {
            state.milestones.add(mark);
            emit('article_section_engaged', { section_id: section.id, section_order: state.order, seconds: mark });
          }
        }
      }
    }, 1000);
    document.addEventListener('click', (event) => {
      if (!enabled) return;
      const toc = event.target.closest('.contents a[href^="#"]');
      if (toc && /^[a-z0-9-]{1,60}$/.test(toc.hash.slice(1))) {
        emit('article_toc_click', { section_id: toc.hash.slice(1) });
      }
      const faq = event.target.closest('.faq details > summary');
      if (faq && !faq.parentElement.open) {
        const order = [...faq.closest('.faq').querySelectorAll('details > summary')].indexOf(faq) + 1;
        emit('article_faq_open', { faq_order: order });
      }
    });
  }
})();
