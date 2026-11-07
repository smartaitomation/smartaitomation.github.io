(() => {
  const weeks = [...document.querySelectorAll('details.week')];
  const expand = document.getElementById('expand-syllabus');
  function updateExpansion() {
    const allOpen = weeks.every(week => week.open);
    expand.setAttribute('aria-expanded', String(allOpen));
    expand.innerHTML = allOpen ? 'Collapse all <span aria-hidden="true">−</span>' : 'Expand all <span aria-hidden="true">+</span>';
  }
  expand.addEventListener('click', () => {
    const open = !weeks.every(week => week.open);
    weeks.forEach(week => { week.open = open; });
    updateExpansion();
  });
  weeks.forEach(week => week.addEventListener('toggle', updateExpansion));
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
 const target=drawer.querySelector('.drawer-weeks');
 document.querySelectorAll('#syllabus .week').forEach(week=>{const copy=week.cloneNode(true); copy.open=true; target.append(copy);});
 let trigger;
 document.querySelectorAll('[data-open-syllabus]').forEach(button=>button.addEventListener('click',()=>{trigger=button;drawer.showModal();document.body.classList.add('drawer-open');drawer.querySelector('.drawer-body').scrollTop=0;drawer.querySelector('.drawer-close').focus();}));
 drawer.querySelector('.drawer-close').addEventListener('click',()=>drawer.close());
 drawer.addEventListener('click',event=>{if(event.target===drawer){const r=drawer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right)drawer.close();}});
 drawer.addEventListener('close',()=>{document.body.classList.remove('drawer-open');trigger?.focus();});
})();
