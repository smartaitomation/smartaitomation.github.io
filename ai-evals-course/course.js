(() => {
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function activate(tab) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs.at(-1);
      if (target) { event.preventDefault(); activate(target); target.focus(); }
    });
  });
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
