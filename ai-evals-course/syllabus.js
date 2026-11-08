(() => {
 const t=window.courseI18n?.t||((x)=>x),ro=document.documentElement.lang==='ro',locale=ro?'ro-RO':'en-GB';
 const drawer=document.querySelector('#syllabus-drawer'),picker=document.querySelector('#cohort-select'),preview=document.querySelector('#lesson-preview');
 drawer.querySelector('.drawer-calendar').append(document.querySelector('#syllabus .syllabus-calendar').cloneNode(true));
 const calendars=[...document.querySelectorAll('.syllabus-calendar')];let drawerTrigger,previewTrigger;
 function date(week,extra=0){const d=new Date(picker.value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+week*7+extra);return d;}
 function fmt(d,options){return new Intl.DateTimeFormat(locale,{timeZone:'UTC',...options}).format(d);}
 function updateDates(){
  document.querySelectorAll('[data-syllabus-cohort]').forEach(el=>el.value=picker.value);
  document.querySelectorAll('[data-week-range]').forEach(el=>{const i=Number(el.dataset.weekRange);el.textContent=fmt(date(i),{day:'numeric',month:'short'})+' – '+fmt(date(i,6),{day:'numeric',month:'short'});});
  document.querySelectorAll('[data-lecture-date]').forEach(el=>{const d=date(Number(el.dataset.lectureDate));el.replaceChildren();const m=document.createElement('small');m.textContent=fmt(d,{month:'short'});const day=document.createElement('b');day.textContent=fmt(d,{day:'numeric'});el.append(m,day);});
  document.querySelectorAll('[data-lecture-full]').forEach(el=>{el.textContent=fmt(date(Number(el.dataset.lectureFull)),{weekday:'short',day:'numeric',month:'short',year:'numeric'})+' · 10:00–12:00 (UTC+2)';});
  document.querySelector('[data-syllabus-checkout]').href='https://shortsblink.com/ai-evals-course?cohort='+picker.value;
 }
 function updateToggle(calendar){const open=[...calendar.querySelectorAll('details')].every(x=>x.open),button=calendar.querySelector('.calendar-toggle');button.textContent=t(open?'Collapse all':'Expand all');button.setAttribute('aria-expanded',String(open));}
 calendars.forEach(calendar=>{
  calendar.querySelector('[data-syllabus-cohort]').addEventListener('change',event=>{picker.value=event.target.value;picker.dispatchEvent(new Event('change',{bubbles:true}));});
  calendar.querySelector('.calendar-toggle').addEventListener('click',()=>{const open=![...calendar.querySelectorAll('details')].every(x=>x.open);calendar.querySelectorAll('details').forEach(x=>x.open=open);updateToggle(calendar);});
  calendar.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>updateToggle(calendar)));
 });picker.addEventListener('change',updateDates);updateDates();
 document.querySelectorAll('[data-open-syllabus]').forEach(el=>el.addEventListener('click',()=>{drawerTrigger=el;drawer.showModal();document.body.classList.add('drawer-open');drawer.querySelector('.drawer-body').scrollTop=0;drawer.querySelector('.drawer-close').focus();}));
 drawer.querySelector('.drawer-close').addEventListener('click',()=>drawer.close());
 drawer.addEventListener('click',e=>{if(e.target===drawer){const r=drawer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right)drawer.close();}});
 drawer.addEventListener('close',()=>{document.body.classList.remove('drawer-open');drawerTrigger?.focus();});
 document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{previewTrigger=button;const content=preview.querySelector('.lesson-preview-content');content.replaceChildren(document.querySelector('#preview-'+button.dataset.preview).content.cloneNode(true));content.querySelector('h2').id='lesson-preview-title';preview.showModal();preview.querySelector('.preview-close').focus();}));
 preview.querySelectorAll('.preview-close,.preview-back').forEach(button=>button.addEventListener('click',()=>preview.close()));
 preview.addEventListener('close',()=>previewTrigger?.focus());
})();
