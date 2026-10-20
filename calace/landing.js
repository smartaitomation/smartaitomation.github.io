(() => {
  const cfg=window.calaceLandingContext || {internal:false,source:{}};
  let visit;
  try {const saved=JSON.parse(sessionStorage.getItem('calace_bridge_visit_v1')||'null');visit=saved&&Date.now()-saved.at<1800000?saved.id:crypto.randomUUID();sessionStorage.setItem('calace_bridge_visit_v1',JSON.stringify({id:visit,at:Date.now()}));} catch (_) {visit=crypto.randomUUID();}
  const started=performance.now();
  window.calaceBridgeTrack=(kind,choice='')=>fetch('https://shortsblink.com/calace/free-guide/bridge-event',{method:'POST',mode:'cors',credentials:'omit',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({event_id:crypto.randomUUID(),visit_id:visit,kind,choice,elapsed_ms:Math.min(86400000,Math.round(performance.now()-started)),source:cfg.source,internal:cfg.internal})}).catch(()=>{});
  window.calaceBridgeTrack('bridge_view');
  document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>window.calaceBridgeTrack('bridge_answer',b.dataset.answer)));
  document.querySelectorAll('a[href*="shortsblink.com/calace/free-guide"]').forEach(a=>{const u=new URL(a.href);Object.entries(cfg.source).forEach(([k,v])=>u.searchParams.set(k,v));if(cfg.internal)u.searchParams.set('traffic','codex_test');a.href=u.href;});
  addEventListener('pagehide',()=>window.calaceBridgeTrack('page_exit'));
})();
document.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>{document.getElementById('quiz-result').textContent=(b.dataset.answer==='no'?'Correct. ':'Look at the lane sign. ')+'STRAIGHT ONLY prohibits the planned right turn. Choose a permitted route. Your answer is recorded anonymously to improve the quiz.';}));

(()=>{const destination='https://apps.apple.com/us/app/dmv-practice-test-ca-calace/id6773815994';const key='calace_app_handoff_v1';let handled=false;try{handled=sessionStorage.getItem(key)==='handled'}catch(e){}const notice=document.getElementById('redirect-notice');const mark=()=>{try{sessionStorage.setItem(key,'handled')}catch(e){}};let timer;if(!handled){timer=setTimeout(()=>{window.calaceBridgeTrack('app_redirect');mark();location.assign(destination)},2000)}else notice.hidden=true;document.getElementById('stay-on-page').onclick=()=>{window.calaceBridgeTrack('stay_click');clearTimeout(timer);mark();notice.hidden=true};document.querySelectorAll('.store-link').forEach(a=>a.addEventListener('click',()=>{window.calaceBridgeTrack('app_store_click');clearTimeout(timer);mark()}));document.querySelectorAll('a[href*="shortsblink.com/calace/free-guide"],a[href="#quiz"]').forEach(a=>a.addEventListener('click',()=>{window.calaceBridgeTrack('quiz_link_click');clearTimeout(timer);mark()}));})();
