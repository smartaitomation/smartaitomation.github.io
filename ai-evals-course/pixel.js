(() => {
  'use strict';
  const pixel = '1155902766952836', key = 'smartai_course_ads_v1';
  const onCheckout = location.hostname === 'shortsblink.com' || location.hostname === 'dev.shortsblink.com' || location.hostname === 'localhost';
  const params = new URLSearchParams(location.search), internalKey = 'smartai_course_internal_v1';
  const marked = ['codex_test','owner_test'].includes(params.get('traffic')) || params.get('qa') === '1' || ['codex_test','owner_test','qa'].includes(params.get('utm_source'));
  let internal = marked || navigator.webdriver === true || ['dev.shortsblink.com','localhost','127.0.0.1','::1'].includes(location.hostname);
  try {
    if (marked) localStorage.setItem(internalKey, String(Date.now() + 180 * 86400000));
    internal = internal || Number(localStorage.getItem(internalKey) || 0) > Date.now();
  } catch (_) {}
  const ro = document.documentElement.lang.toLowerCase().startsWith('ro');
  const purchase = window.smartaiCoursePurchase || null;
  let choice = null, clickId = '';
  try { choice = localStorage.getItem(key); } catch (_) {}
  if (onCheckout && location.hash.startsWith('#course-ad-consent=')) {
    const params = new URLSearchParams(location.hash.slice(1));
    if (/^https:\/\/(www\.)?smartaitomation\.com\//.test(document.referrer)) {
      const handedChoice = params.get('course-ad-consent');
      if (['allow','deny'].includes(handedChoice)) {
        choice = handedChoice;
        clickId = choice === 'allow' ? params.get('fbclid') || '' : '';
        try { localStorage.setItem(key, choice); } catch (_) {}
      }
      if (params.get('course-internal') === '1') {
        internal = true;
        try { localStorage.setItem(internalKey, String(Date.now() + 180 * 86400000)); } catch (_) {}
      }
    }
    history.replaceState(null, '', location.pathname + location.search);
  }
  if (purchase) history.replaceState(null, '', location.pathname);
  if (!onCheckout) clickId = new URLSearchParams(location.search).get('fbclid') || '';
  if (!/^[A-Za-z0-9_-]{1,500}$/.test(clickId)) clickId = '';
  let started = false;
  function start() {
    if (choice !== 'allow' || internal || started) return;
    started = true;
    if (clickId) document.cookie = '_fbc=fb.1.' + Date.now() + '.' + clickId + '; Max-Age=7776000; Path=/; SameSite=Lax; Secure';
    if (!window.fbq) {
      const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      window._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      const script = document.createElement('script'); script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js'; document.head.appendChild(script);
    }
    window.fbq('consent', 'grant'); window.fbq('set', 'autoConfig', false, pixel); window.fbq('init', pixel);
    window.fbq('trackSingle', pixel, 'PageView');
    if (purchase && /^[a-f0-9]{64}$/.test(purchase.id)) {
      const sent = 'smartai_course_purchase_' + purchase.id;
      let done = false; try { done = localStorage.getItem(sent) === '1'; } catch (_) {}
      if (!done) {
        window.fbq('trackSingle', pixel, 'Purchase', {value:purchase.value,currency:purchase.currency,content_ids:['smartai-ai-evals-course'],content_type:'product'}, {eventID:purchase.id});
        try { localStorage.setItem(sent,'1'); } catch (_) {}
      }
    }
  }
  function save(value) {
    choice = value; try { localStorage.setItem(key,value); } catch (_) {}
    if (value === 'allow') { if (started && window.fbq) window.fbq('consent','grant'); else start(); }
    else {
      if (started && window.fbq) window.fbq('consent','revoke');
      for (const n of ['_fbp','_fbc']) {
        document.cookie = n + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
        document.cookie = n + '=; Max-Age=0; Path=/; Domain=.' + location.hostname + '; SameSite=Lax; Secure';
      }
    }
    control.open = false;
    status.textContent=choice==='allow'?(ro?'Măsurare permisă.':'Measurement allowed.'):(ro?'Măsurare refuzată.':'Measurement declined.');
  }
  const control=document.createElement('details');control.className='ad-preferences';
  const summary=document.createElement('summary');summary.textContent=ro?'Preferințe publicitate':'Advertising preferences';summary.style.cssText='cursor:pointer;text-decoration:underline';control.appendChild(summary);
  const text=document.createElement('p');text.textContent=ro?'Opțional: permite Meta să măsoare vizitele și achizițiile cursului. Refuzul nu afectează înscrierea.':'Optional: let Meta measure course visits and purchases. Declining does not affect enrollment.';text.style.cssText='max-width:430px;font-size:12px;margin:10px 0';control.appendChild(text);
  const status=document.createElement('p');status.setAttribute('role','status');status.style.cssText='font-size:12px;margin:8px 0';status.textContent=choice==='allow'?(ro?'Măsurare permisă.':'Measurement allowed.'):(ro?'Măsurarea este dezactivată.':'Measurement is off.');
  for(const [label,value] of [[ro?'Refuză':'Decline','deny'],[ro?'Permite':'Allow','allow']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='font:inherit;padding:7px 12px;margin-right:8px;border:1px solid #244d3f;border-radius:5px;background:white;color:#244d3f';b.addEventListener('click',()=>save(value));control.appendChild(b);}
  const privacy=document.createElement('a');privacy.href='https://shortsblink.com/ai-evals-course/privacy';privacy.textContent=ro?'Confidențialitate':'Privacy';control.appendChild(privacy);control.appendChild(status);
  const footer=document.querySelector('footer');if(footer)footer.appendChild(control);
  if (!onCheckout) document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href);if(url.origin!=='https://shortsblink.com'||url.pathname!=='/ai-evals-course')return;if(['allow','deny'].includes(choice)||internal){const params=new URLSearchParams({'course-ad-consent':choice||'unset'});if(choice==='allow'&&clickId&&!internal)params.set('fbclid',clickId);if(internal)params.set('course-internal','1');url.hash=params.toString();a.href=url.href;}},true);
  start();
})();
