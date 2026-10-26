(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('#motion-toggle');
  let manuallyPaused = false;
  const syncMotion = () => {
    const paused = manuallyPaused || reduced.matches;
    document.documentElement.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.querySelector('.motion-label').textContent = reduced.matches ? 'Reduced motion' : paused ? 'Play motion' : 'Pause motion';
    motionButton.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    motionButton.disabled = reduced.matches;
    window.dispatchEvent(new CustomEvent('smartai-motion', {detail:{paused}}));
  };
  motionButton.addEventListener('click', () => {manuallyPaused = !manuallyPaused; syncMotion();});
  reduced.addEventListener('change', syncMotion);
  syncMotion();
  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), {threshold:0.08});
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  function closeMenu(restoreFocus = false) {
    menu.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open menu');
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); menu.hidden = !open;
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {if (event.key === 'Escape' && !menu.hidden) closeMenu(true);});
  document.addEventListener('click', event => {if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();});
  matchMedia('(min-width: 801px)').addEventListener('change', event => {if(event.matches) closeMenu();});
  const tabs = [...document.querySelectorAll('[role=tab]')];
  function selectTab(tab, focus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active)); item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if(event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if(event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if(event.key === 'Home') next = 0;
      if(event.key === 'End') next = tabs.length - 1;
      if(next !== undefined) {event.preventDefault();selectTab(tabs[next], true);}
    });
  });
  document.querySelector('.people-grid').replaceChildren(...Array.from({length:60}, () => document.createElement('i')));
  document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('tab-hidden', document.hidden));
})();
