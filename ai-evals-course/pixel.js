(() => {
  'use strict';
  const pixel = '251383929491305', key = 'smartai_course_ads_v1';
  const onCheckout = location.hostname === 'shortsblink.com' || location.hostname === 'dev.shortsblink.com' || location.hostname === 'localhost';
  const internal = new URLSearchParams(location.search).get('traffic') === 'codex_test' || location.hostname === 'dev.shortsblink.com' || location.hostname === 'localhost';
  const ro = document.documentElement.lang.toLowerCase().startsWith('ro');
  const purchase = window.smartaiCoursePurchase || null;
  let choice = null, clickId = '';
  try { choice = localStorage.getItem(key); } catch (_) {}
  if (onCheckout && location.hash.startsWith('#course-ad-consent=')) {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.get('course-ad-consent') === 'allow' && /^https:\/\/(www\.)?smartaitomation\.com\//.test(document.referrer)) {
      choice = 'allow';
      clickId = params.get('fbclid') || '';
      try { localStorage.setItem(key, choice); } catch (_) {}
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
    if (value === 'allow') start();
    else {
      if (started && window.fbq) window.fbq('consent','revoke');
      for (const n of ['_fbp','_fbc']) {
        document.cookie = n + '=; Max-Age=0; Path=/; SameSite=Lax; Secure';
        document.cookie = n + '=; Max-Age=0; Path=/; Domain=.' + location.hostname + '; SameSite=Lax; Secure';
      }
    }
    banner.hidden = true;
  }
  const banner = document.createElement('aside'); banner.setAttribute('aria-label',ro?'Preferințe publicitate':'Advertising preferences');
  banner.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;z-index:2147483647;max-width:640px;margin:auto;background:#fff;border:1px solid #b7cabb;border-radius:10px;padding:16px;box-shadow:0 3px 20px #0003;font:14px/1.5 system-ui;color:#17291f';
  const text = document.createElement('p'); text.style.margin='0 0 12px'; text.textContent=ro?'Cu acordul tău, Meta măsoară vizitele și plățile cursului pentru reclame. Poți refuza sau schimba alegerea.':'With your permission, Meta measures course visits and purchases for advertising. You can decline or change your choice.';
  const privacy = document.createElement('a'); privacy.href='https://shortsblink.com/ai-evals-course/privacy'; privacy.textContent=ro?' Confidențialitate':' Privacy'; text.appendChild(privacy); banner.appendChild(text);
  for (const [label,value] of [[ro?'Refuză':'Decline','deny'],[ro?'Acceptă':'Accept','allow']]) { const b=document.createElement('button'); b.type='button'; b.textContent=label; b.style.cssText='padding:9px 16px;margin-right:8px;border:1px solid #244d3f;border-radius:5px;background:'+(value==='allow'?'#244d3f;color:white':'white;color:#244d3f')+';cursor:pointer'; b.addEventListener('click',()=>save(value)); banner.appendChild(b); }
  document.body.appendChild(banner); banner.hidden = internal || choice === 'allow' || choice === 'deny';
  const control=document.createElement('button');control.type='button';control.textContent=ro?'Preferințe publicitate':'Advertising preferences';control.style.cssText='border:0;background:none;text-decoration:underline;cursor:pointer;font:inherit;color:inherit';control.addEventListener('click',()=>{banner.hidden=false});const footer=document.querySelector('footer');if(footer)footer.appendChild(control);
  if (!onCheckout) document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href);if(url.origin!=='https://shortsblink.com'||url.pathname!=='/ai-evals-course')return;if(choice==='allow'){const params=new URLSearchParams({'course-ad-consent':'allow'});if(clickId)params.set('fbclid',clickId);url.hash=params.toString();a.href=url.href;}},true);
  start();
})();
