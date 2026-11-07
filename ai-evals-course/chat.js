(() => {
  const root=document.createElement('div');root.className='course-chat';
  root.innerHTML=`<button class="chat-launcher" aria-controls="course-chat-panel" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 1 1 19 0Z" stroke="currentColor" stroke-width="1.7"/><path d="M7 9h9M7 13h6" stroke="currentColor" stroke-width="1.7"/></svg><span>Ask a question</span></button>
  <section id="course-chat-panel" class="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-title" hidden>
   <header class="chat-heading"><div><strong id="chat-title">Questions about the course?</strong><small>A person will get back to you.</small></div><button class="chat-close" aria-label="Close chat">×</button></header>
   <div class="chat-content">
    <div class="chat-question-step"><p class="chat-bubble">Hi! What would you like to know?</p><div class="chat-options"><button>Is this course right for me?</button><button>What will I learn?</button><button>Can my team join?</button><button>What if I miss a live session?</button></div><form class="chat-question-form"><label for="chat-question">Or write your question</label><textarea id="chat-question" maxlength="2000" rows="2" required placeholder="Your question…"></textarea><button class="chat-primary">Continue →</button></form></div>
    <div class="chat-contact-step" hidden><div class="chat-selected"><p></p><button class="chat-edit" type="button">Edit question</button></div><p class="chat-intro">How can we reach you?</p><form class="chat-contact-form"><label for="chat-name">Name<input id="chat-name" name="name" autocomplete="name" maxlength="100" required></label><label for="chat-phone">Phone<input id="chat-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="40" placeholder="+373 …" required></label><label for="chat-email">Email<input id="chat-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@company.com" required></label><label class="chat-trap" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label><label class="chat-consent"><input name="consent" type="checkbox" required><span>Contact me by email or phone about this question. <a href="https://shortsblink.com/ai-evals-course/privacy" target="_blank" rel="noopener">Privacy</a></span></label><p class="chat-error" role="alert" hidden></p><button class="chat-primary chat-submit">Send my question →</button></form><p class="chat-footnote">Your details go to our team. No newsletter signup.</p></div>
    <div class="chat-success" hidden role="status"><span class="chat-check" aria-hidden="true">✓</span><h3>Thanks — your question is saved.</h3><p>A person from our team will contact you by email or phone.</p><button class="chat-another">Ask another question</button></div>
   </div>
  </section>`;
  document.body.append(root);
  const $=s=>root.querySelector(s), panel=$('.chat-panel'),launcher=$('.chat-launcher');
  const testing=['codex_test','owner_test'].includes(new URLSearchParams(location.search).get('traffic'));
  const endpoint=location.hostname==='127.0.0.1'?'http://127.0.0.1:8842/ai-evals-course/chat':'https://shortsblink.com/ai-evals-course/chat';
  let question='',requestId='',submitted=false,remaining=20000,clock=null,started=0;
  const dismissed=()=>{try{return sessionStorage.getItem('course-chat-seen')==='1';}catch{return false;}};
  function remember(){try{sessionStorage.setItem('course-chat-seen','1');}catch{}}
  function fit(){const v=window.visualViewport;root.style.setProperty('--chat-height',Math.max(240,(v?.height||innerHeight)-28)+'px');root.style.setProperty('--chat-bottom',Math.max(0,innerHeight-((v?.offsetTop||0)+(v?.height||innerHeight)))+'px');}
  function show(manual=false){panel.hidden=false;launcher.hidden=true;launcher.setAttribute('aria-expanded','true');remember();clearTimeout(clock);fit();if(manual)panel.querySelector('button').focus();}
  function hide(){panel.hidden=true;launcher.hidden=false;launcher.setAttribute('aria-expanded','false');remember();launcher.focus();}
  launcher.onclick=()=>panel.hidden?show(true):hide();$('.chat-close').onclick=hide;
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)hide();});
  window.visualViewport?.addEventListener('resize',fit);window.visualViewport?.addEventListener('scroll',fit);window.addEventListener('resize',fit);
  function timer(){clearTimeout(clock);if(document.hidden||dismissed())return;started=Date.now();clock=setTimeout(()=>{remaining=0;if(document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){remaining=1500;timer();return;}show();},remaining);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden){remaining=Math.max(0,remaining-(Date.now()-started));clearTimeout(clock);}else timer();});timer();
  function contact(value){question=value.trim();if(!question)return;$('.chat-selected p').textContent=question;$('.chat-question-step').hidden=true;$('.chat-contact-step').hidden=false;$('.chat-success').hidden=true;$('.chat-content').scrollTop=0;requestId=crypto.randomUUID().replaceAll('-','');$('#chat-name').focus();}
  $('.chat-options').addEventListener('click',e=>{if(e.target.tagName==='BUTTON'){contact(e.target.textContent);}});
  $('.chat-question-form').onsubmit=e=>{e.preventDefault();contact($('#chat-question').value);};
  $('.chat-edit').onclick=()=>{$('.chat-contact-step').hidden=true;$('.chat-question-step').hidden=false;$('#chat-question').value=question;$('#chat-question').focus();};
  $('.chat-another').onclick=()=>{question='';submitted=false;$('.chat-question-step').hidden=false;$('.chat-success').hidden=true;$('#chat-question').value='';$('.chat-contact-form').reset();};
  $('.chat-contact-form').onsubmit=async e=>{
    e.preventDefault();if(submitted)return;
    const form=e.currentTarget,b=$('.chat-submit'),error=$('.chat-error');error.hidden=true;
    const data=Object.fromEntries(new FormData(form));data.question=question;data.request_id=requestId;data.consent=form.elements.consent.checked;
    if(!/^[+0-9() .-]+$/.test(data.phone)||data.phone.replace(/\D/g,'').length<7||data.phone.replace(/\D/g,'').length>15){error.textContent='Please include a valid phone number and country code.';error.hidden=false;$('#chat-phone').focus();return;}
    b.disabled=true;b.textContent='Sending…';
    try{
      const r=await fetch(endpoint+'/token'+(testing?'?traffic=codex_test':''),{credentials:'omit',signal:AbortSignal.timeout(20000)});
      const token=await r.json().catch(()=>({error:'Unable to connect. Please try again.'}));if(!r.ok||!token.token)throw new Error(token.error||'Unable to connect. Please try again.');
      const response=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json','X-Chat-Token':token.token},body:JSON.stringify(data),signal:AbortSignal.timeout(20000)});
      const result=await response.json().catch(()=>({error:'Unable to save. Please try again or email imosnoi@smartaitomation.com.'}));if(!response.ok||!result.saved)throw new Error(result.error||'Unable to save. Please try again.');
      submitted=true;$('.chat-contact-step').hidden=true;$('.chat-success').hidden=false;$('.chat-content').scrollTop=0;
    }catch(e){error.textContent=e.name==='TimeoutError'?'The connection timed out. Try again; your question is still here.':(e.message==='Failed to fetch'?'Unable to connect. Try again, or email imosnoi@smartaitomation.com.':e.message);error.hidden=false;}
    finally{b.disabled=false;b.textContent='Send my question →';}
  };
})();
