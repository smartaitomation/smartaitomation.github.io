(() => {
  'use strict';
  // Fixed event codes and bounded campaign tags. No form values, full URLs or click IDs.
  const root = location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8842' : 'https://shortsblink.com';
  const endpoint = root + '/ai-evals-course/metrics';
  const params = new URLSearchParams(location.search);
  let internal = ['codex_test','owner_test'].includes(params.get('traffic')) || params.get('qa') === '1' || navigator.webdriver === true;
  try { internal ||= Number(localStorage.getItem('smartai_course_internal_v1') || 0) > Date.now(); } catch (_) {}
  const sections = ['overview','included','outcomes','syllabus','assignments','schedule','audience','instructor','resources','reviews','teams','faq','join'];
  const previewKeys=['orientation','module_1','module_2','module_3','module_4','lab_1','lab_2','lab_3','lab_4'];
  const faqKeys=['when','time','lifetime','recordings','engineer','not_for','no_data','outcome','tools','security','certificate','company','self_study','affiliation'];
  let session='';try {session=sessionStorage.getItem('smartai_course_session_v2')||'';} catch (_) {}
  let visitor='';try {const saved=JSON.parse(localStorage.getItem('smartai_course_visitor_v3')||'null');if(saved?.expires>Date.now())visitor=saved.token;else localStorage.removeItem('smartai_course_visitor_v3');} catch (_) {}
  function saveVisitor(data){if(typeof data.visitor==='string'){visitor=data.visitor;try{localStorage.setItem('smartai_course_visitor_v3',JSON.stringify({token:visitor,expires:data.visitor_expires}));}catch(_){}}}
  function saveSession(value){if(typeof value==='string'){session=value;try{sessionStorage.setItem('smartai_course_session_v2',value);}catch(_){}}}
  const lang = document.documentElement.lang === 'ro' ? 'ro' : 'en';
  const device = innerWidth <= 600 ? 'mobile' : innerWidth <= 1024 ? 'tablet' : 'desktop';
  function source() {
    const utm = (params.get('utm_source') || '').toLowerCase();
    const known = {ig:'instagram',instagram:'instagram',fb:'facebook',facebook:'facebook',linkedin:'linkedin',google:'google',meta:'meta',msg:'messenger',an:'audience_network',tiktok:'tiktok',email:'email',newsletter:'email'};
    if (known[utm]) return known[utm];
    let host=''; try { host=new URL(document.referrer).hostname; } catch (_) {}
    for (const site of ['instagram','facebook','linkedin','google']) if (host===site+'.com'||host.endsWith('.'+site+'.com')) return site;
    return !host || host===location.hostname ? 'direct' : 'other';
  }
  let token='', queue=[], sending=false, enabled=true, active=0, lastTick=Date.now(), lastReported=0, wasVisible=!document.hidden;
  let previewKey='', lastContext=null;
  const times=new Map(),reported=new Map();
  const once = new Set();
  function record(kind,target,value=0) {
    if (!enabled || queue.length>=150) return;
    if (['page_view','scroll','section'].includes(kind)) {const key=kind+':'+target;if(once.has(key))return;once.add(key);}
    queue.push({id:crypto.randomUUID(),kind,target,value});
    if (kind==='click' || queue.length>=20) void flush();
  }
  async function flush() {
    if (!token || sending || !queue.length || !enabled) return;
    sending=true;let drained=false;
    const batch=queue.splice(0,25);
    try {
      const response=await fetch(endpoint+'/events',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,events:batch}),keepalive:true});
      if (!response.ok) {
        if (response.status===403 || response.status===400) enabled=false;
        else queue=[...batch,...queue].slice(0,150);
      } else {const data=await response.json();if(data.token)token=data.token;saveSession(data.session);drained=true;}
    } catch (_) {queue=[...batch,...queue].slice(0,150);}
    finally {sending=false;if(drained&&queue.length)void flush();}
  }
  window.courseMetrics={context:()=>token||undefined};
  record('page_view','course');
  const query=new URLSearchParams({lang,device,source:source(),v:'3'});if(internal)query.set('traffic','codex_test');
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_id','campaign_id','adset_id','ad_id','campaign_name','adset_name','ad_name','placement']){
    const value=params.get(key);if(value&&value.length<=100&&/^[\p{L}\p{N}_ .|+\-]+$/u.test(value))query.set(key,value);
  }
  // Presence is enough for an unknown-ad hint; never forward individual click identifiers.
  if(params.has('fbclid'))query.set('click_hint','meta');else if(params.has('gclid'))query.set('click_hint','google');else if(params.has('ttclid'))query.set('click_hint','tiktok');
  const headers={};if(session)headers['X-Course-Session']=session;if(visitor)headers['X-Course-Visitor']=visitor;
  fetch(endpoint+'/token?'+query,{credentials:'omit',headers,signal:AbortSignal.timeout(15000)})
    .then(r=>r.ok?r.json():null).then(data=>{if(data?.token){token=data.token;saveSession(data.session);saveVisitor(data);void flush();}}).catch(()=>{});
  function depth() {
    if (document.hidden) return;
    const h=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);
    const pct=Math.min(100,Math.floor((scrollY+innerHeight+2)/h*100));
    for(const level of [25,50,75,90,100])if(pct>=level)record('scroll',String(level));
  }
  let scrolling=false;
  addEventListener('scroll',()=>{if(!scrolling){scrolling=true;requestAnimationFrame(()=>{depth();scrolling=false;});}},{passive:true});
  addEventListener('resize',depth);addEventListener('load',depth);depth();
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&!document.hidden){record('section',e.target.dataset.metricsSection);observer.unobserve(e.target);}}, {threshold:0.5});
    for(const id of sections){const section=document.getElementById(id);const heading=section?.querySelector('h2,h3,.eyebrow')||section?.firstElementChild;if(heading){heading.dataset.metricsSection=id;observer.observe(heading);}}
  }
  function clickCode(el) {
    if(el.matches('.drawer-close'))return 'syllabus_close';
    if(el.matches('.preview-close,.preview-back'))return previewKey?'preview_'+previewKey+'_close':undefined;
    if(el.matches('.calendar-toggle'))return el.getAttribute('aria-expanded')==='true'?'syllabus_collapse':'syllabus_expand';
    if(el.tagName==='SUMMARY'){
      const details=el.parentElement,state=details.open?'close':'open';
      if(details.matches('.calendar-lesson')){const group=[...details.closest('.syllabus-calendar').querySelectorAll('.calendar-lesson')];const i=group.indexOf(details)+1;if(i<=4)return 'module_'+i+'_'+state;}
      if(details.closest('#faq')){const i=[...document.querySelectorAll('#faq details')].indexOf(details);if(faqKeys[i])return 'faq_'+faqKeys[i]+'_'+state;}
      if(details.matches('.ad-preferences'))return 'advertising_preferences';
    }
    if(el.matches('.chat-launcher'))return 'chat_open';
    if(el.matches('.chat-close'))return 'chat_close';
    if(el.matches('.chat-edit'))return 'chat_edit';
    if(el.matches('.course-modal-close'))return 'form_close';
    if(el.matches('.course-copy-email'))return 'employer_copy';
    if(el.closest('.chat-options'))return 'chat_topic';
    if(el.matches('.chat-send'))return 'chat_question';
    if(el.matches('.chat-submit'))return 'chat_submit';
    if(el.matches('[data-open-syllabus]'))return 'syllabus_open';
    if(el.matches('.lesson-preview')){const key=el.dataset.preview?.replaceAll('-','_');if(previewKeys.includes(key)){previewKey=key;return 'preview_'+key;}return 'lesson_preview';}
    if(el.matches('.course-form-submit'))return el.closest('dialog')?.dataset.metricsMode==='updates'?'updates_submit':'resource_submit';
    if(el.matches('.course-modal-download'))return 'resource_download';
    if(el.tagName!=='A')return;
    if(el.closest('.mobile-enroll'))return 'enroll_mobile';
    let u;try{u=new URL(el.href);}catch(_){return;}
    if(u.protocol==='mailto:')return 'contact_email';
    if(u.hostname==='www.linkedin.com'||u.hostname==='linkedin.com')return el.closest('#instructor')?'trainer_linkedin':el.closest('.header-links')?'trainer_header':'contact_linkedin';
    if(el.closest('.hero')&&u.hash==='#instructor')return 'trainer_hero';
    if(u.hostname==='shortsblink.com'&&u.pathname==='/ai-evals-course'){
      if(el.closest('.mobile-enroll'))return 'enroll_mobile';
      if(el.closest('.cohort-options'))return 'enroll_cohort';
      if(u.searchParams.has('seats'))return 'enroll_team';
      return el.matches('[data-checkout]')?'enroll_card':'enroll_cohort';
    }
    if(u.pathname.endsWith('/syllabus.pdf'))return 'syllabus_pdf';
    if(u.pathname.endsWith('/employer-reimbursement-email.txt'))return 'employer_template';
    if(u.pathname.startsWith('/ai-evals-course/resources/')){const slug=u.pathname.split('/').pop();return ['checklist','flashcards'].includes(slug)?'resource_'+slug:'resource_other';}
    if(u.pathname==='/ai-evals-course/updates')return 'updates_open';
    if(u.pathname==='/ai-evals-course/privacy')return 'privacy';
    if(u.pathname==='/ai-evals-course/terms')return 'terms';
    if(el.closest('[aria-label="Page language"],[aria-label="Limba paginii"],.language-switch'))return u.pathname.includes('/ro/')?'language_ro':'language_en';
    if(u.pathname.includes('/production-ai/workshop'))return 'workshop';
    if(u.origin===location.origin&&sections.includes(u.hash.slice(1)))return 'nav_'+u.hash.slice(1);
    if(u.origin===location.origin&&u.pathname==='/')return 'home';
  }
  document.addEventListener('click',e=>{const el=e.target.closest('a,button,summary');if(!el)return;tick(true);const code=clickCode(el);if(code)record('click',code);queueMicrotask(()=>tick());},true);
  document.addEventListener('change',e=>{const el=e.target;if(!el.matches('#cohort-select,[data-syllabus-cohort]'))return;const date=el.value?.replaceAll('-','_');if(!['2026_11_21','2026_12_19'].includes(date))return;if(el.id==='cohort-select'&&!e.isTrusted)return;record('click','cohort_'+date+'_'+(el.id==='cohort-select'?'card':'syllabus'));},true);
  function context() {
    if(document.querySelector('#lesson-preview[open]')&&previewKey)return ['preview_time',previewKey];
    if(document.querySelector('#syllabus-drawer[open]'))return ['section_time','syllabus'];
    if(document.querySelector('dialog[open]')||document.querySelector('.chat-panel:not([hidden])'))return null;
    let best=null,area=0;
    for(const id of sections){const el=document.getElementById(id);if(!el)continue;const r=el.getBoundingClientRect();const h=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(80,r.top));const score=h*r.width;if(score>area){area=score;best=id;}}
    return best?['section_time',best]:null;
  }
  function tick(force=false) {
    const now=Date.now(),delta=Math.max(0,Math.min(6000,now-lastTick));
    if(wasVisible){active+=delta;if(lastContext){const key=lastContext.join(':');times.set(key,(times.get(key)||0)+delta);}}
    lastTick=now;wasVisible=!document.hidden;lastContext=context();
    const seconds=Math.min(14400,Math.floor(active/1000));
    if(seconds-lastReported>=15||(force&&seconds>lastReported)){record('engagement','visible',seconds);lastReported=seconds;}
    for(const [key,ms] of times){const value=Math.min(14400,Math.floor(ms/1000)),old=reported.get(key)||0;if(value-old>=15||(force&&value>old)){const [kind,target]=key.split(':');record(kind,target,value);reported.set(key,value);}}
    void flush();
  }
  document.querySelectorAll('dialog').forEach(el=>el.addEventListener('close',()=>tick(true)));
  lastContext=context();
  setInterval(()=>tick(),5000);
  document.addEventListener('visibilitychange',()=>{tick(true);lastTick=Date.now();if(!document.hidden)depth();});
  addEventListener('pagehide',()=>tick(true));
})();
