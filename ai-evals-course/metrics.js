(() => {
  'use strict';
  // Fixed codes only. Never send form values, link URLs, questions or email addresses.
  const root = location.hostname === '127.0.0.1' ? 'http://127.0.0.1:8842' : 'https://shortsblink.com';
  const endpoint = root + '/ai-evals-course/metrics';
  const params = new URLSearchParams(location.search);
  let internal = ['codex_test','owner_test'].includes(params.get('traffic')) || params.get('qa') === '1' || navigator.webdriver === true;
  try { internal ||= Number(localStorage.getItem('smartai_course_internal_v1') || 0) > Date.now(); } catch (_) {}
  const sections = ['overview','included','outcomes','syllabus','assignments','schedule','audience','instructor','resources','reviews','teams','faq','join'];
  const lang = document.documentElement.lang === 'ro' ? 'ro' : 'en';
  const device = innerWidth <= 600 ? 'mobile' : innerWidth <= 1024 ? 'tablet' : 'desktop';
  function source() {
    const utm = (params.get('utm_source') || '').toLowerCase();
    const known = {ig:'instagram',instagram:'instagram',fb:'facebook',facebook:'facebook',linkedin:'linkedin',google:'google'};
    if (known[utm]) return known[utm];
    let host=''; try { host=new URL(document.referrer).hostname; } catch (_) {}
    for (const site of ['instagram','facebook','linkedin','google']) if (host===site+'.com'||host.endsWith('.'+site+'.com')) return site;
    return !host || host===location.hostname ? 'direct' : 'other';
  }
  let token='', queue=[], sending=false, enabled=true, active=0, lastTick=Date.now(), lastReported=0, wasVisible=!document.hidden;
  const once = new Set();
  function record(kind,target,value=0) {
    if (!enabled || queue.length>=150) return;
    if (kind !== 'click' && kind !== 'engagement') {const key=kind+':'+target;if(once.has(key))return;once.add(key);}
    queue.push({id:crypto.randomUUID(),kind,target,value});
    if (kind==='click' || queue.length>=20) void flush();
  }
  async function flush() {
    if (!token || sending || !queue.length || !enabled) return;
    sending=true;
    const batch=queue.splice(0,25);
    try {
      const response=await fetch(endpoint+'/events',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,events:batch}),keepalive:true});
      if (!response.ok) {
        if (response.status===403 || response.status===400) enabled=false;
        else queue=[...batch,...queue].slice(0,150);
      }
    } catch (_) {queue=[...batch,...queue].slice(0,150);}
    finally {sending=false;}
  }
  window.courseMetrics={context:()=>token||undefined};
  record('page_view','course');
  const query=new URLSearchParams({lang,device,source:source()});if(internal)query.set('traffic','codex_test');
  fetch(endpoint+'/token?'+query,{credentials:'omit',signal:AbortSignal.timeout(15000)})
    .then(r=>r.ok?r.json():null).then(data=>{if(data?.token){token=data.token;void flush();}}).catch(()=>{});
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
    if(el.matches('.chat-launcher'))return 'chat_open';
    if(el.closest('.chat-options'))return 'chat_topic';
    if(el.matches('.chat-send'))return 'chat_question';
    if(el.matches('.chat-submit'))return 'chat_submit';
    if(el.matches('[data-open-syllabus]'))return 'syllabus_open';
    if(el.matches('.lesson-preview'))return 'lesson_preview';
    if(el.matches('.course-form-submit'))return el.closest('dialog')?.dataset.metricsMode==='updates'?'updates_submit':'resource_submit';
    if(el.matches('.course-modal-download'))return 'resource_download';
    if(el.tagName!=='A')return;
    if(el.closest('.mobile-enroll'))return 'enroll_mobile';
    let u;try{u=new URL(el.href);}catch(_){return;}
    if(u.protocol==='mailto:')return 'contact_email';
    if(u.hostname==='www.linkedin.com'||u.hostname==='linkedin.com')return 'contact_linkedin';
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
    if(el.closest('[aria-label="Page language"],[aria-label="Limba paginii"],.language-switch'))return u.pathname.includes('/ro/')?'language_ro':'language_en';
    if(u.pathname.includes('/production-ai/workshop'))return 'workshop';
    if(u.origin===location.origin&&sections.includes(u.hash.slice(1)))return 'nav_'+u.hash.slice(1);
  }
  document.addEventListener('click',e=>{const el=e.target.closest('a,button');if(!el)return;const code=clickCode(el);if(code)record('click',code);},true);
  function tick(force=false) {
    const now=Date.now();if(wasVisible)active+=Math.min(6000,now-lastTick);lastTick=now;wasVisible=!document.hidden;
    const seconds=Math.min(1800,Math.floor(active/1000));
    if(seconds-lastReported>=15||(force&&seconds>lastReported)){record('engagement','visible',seconds);lastReported=seconds;}
    void flush();
  }
  setInterval(()=>tick(),5000);
  document.addEventListener('visibilitychange',()=>{tick(true);lastTick=Date.now();if(!document.hidden)depth();});
  addEventListener('pagehide',()=>tick(true));
})();
