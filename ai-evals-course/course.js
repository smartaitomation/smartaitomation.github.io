(() => {
  const navLinks = [...document.querySelectorAll('.section-links a')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.filter(item => item.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!entry) return;
      navLinks.forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, {rootMargin: '-80px 0px -55% 0px', threshold: 0});
    navLinks.forEach(link => observer.observe(document.querySelector(link.hash)));
  }
  // Dates are fixed in the page; no rolling "starts in two weeks" countdown.
})();

(() => {
 const drawer=document.getElementById('syllabus-drawer');
 const target=drawer.querySelector('.drawer-document');
 target.append(document.querySelector('#syllabus .syllabus-paper').cloneNode(true));
 let trigger;
 document.querySelectorAll('[data-open-syllabus]').forEach(button=>button.addEventListener('click',()=>{trigger=button;drawer.showModal();document.body.classList.add('drawer-open');drawer.querySelector('.drawer-body').scrollTop=0;drawer.querySelector('.drawer-close').focus();}));
 drawer.querySelector('.drawer-close').addEventListener('click',()=>drawer.close());
 drawer.addEventListener('click',event=>{if(event.target===drawer){const r=drawer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right)drawer.close();}});
 drawer.addEventListener('close',()=>{document.body.classList.remove('drawer-open');trigger?.focus();});
})();

(() => {
 const ro=window.courseI18n?.ro;
 const picker=document.getElementById('cohort-select');
 const options={'2026-11-21':{price:'€500',date:'21 Nov'},'2026-12-19':{price:'€1,000',date:'19 Dec'}};
 const requested=new URLSearchParams(location.search).get('cohort');if(options[requested])picker.value=requested;
 function select(){const c=options[picker.value];const price=ro?new Intl.NumberFormat('ro-RO').format(Number(c.price.replace(/[^0-9]/g,''))):c.price;document.querySelector('[data-course-price]').innerHTML=price+' <small>EUR</small>';document.querySelector('[data-mobile-price]').innerHTML=price+' <small>EUR</small>';document.querySelector('[data-mobile-date]').textContent=(ro?'4 săptămâni · începe pe ':'4 weeks · starts ')+(ro?c.date.replace('Nov','nov.').replace('Dec','dec.'):c.date);const a=document.querySelector('[data-checkout]');a.href='https://shortsblink.com/ai-evals-course?cohort='+picker.value;a.textContent=(ro?'Înscriere · ':'Enroll · ')+price+' EUR ↗';}
 picker.addEventListener('change',select);select();
})();
