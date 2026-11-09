(() => {
  const draftTab = document.getElementById('draft-tab');
  const fixedTab = document.getElementById('fixed-tab');
  const draft = document.getElementById('draft-output');
  const fixed = document.getElementById('fixed-output');
  const reveal = document.getElementById('reveal-errors');
  const notes = document.getElementById('error-notes');
  const note = document.getElementById('version-note');
  const reasons = {
    optional: 'Docker este opțional în cerințe. Anunțul îl transformă într-o cerință obligatorie.',
    hybrid: 'Cerințele spun două zile pe săptămână la birou, nu complet remote.',
    internal: 'Nota este marcată ca internă și nu trebuie publicată.'
  };
  function showErrors(show) {
    draft.classList.toggle('show-errors', show);
    notes.hidden = !show;
    reveal.setAttribute('aria-expanded', String(show));
    reveal.textContent = show ? 'Ascunde explicațiile ↑' : 'Arată cele 3 greșeli ↗';
    draft.querySelectorAll('[data-error]').forEach(el => {
      el.tabIndex = show ? 0 : -1;
      if (show) { el.title = reasons[el.dataset.error]; el.setAttribute('aria-label', el.textContent + '. ' + el.title); }
      else { el.removeAttribute('title'); el.removeAttribute('aria-label'); }
    });
  }
  function selectVersion(corrected) {
    draftTab.setAttribute('aria-pressed', String(!corrected));
    fixedTab.setAttribute('aria-pressed', String(corrected));
    draft.hidden = corrected;
    fixed.hidden = !corrected;
    reveal.hidden = corrected;
    showErrors(false);
    note.textContent = corrected ? 'Acum verifici fiecare regulă.' : 'Un text fluent poate fi greșit.';
  }
  reveal.addEventListener('click', () => showErrors(reveal.getAttribute('aria-expanded') !== 'true'));
  draftTab.addEventListener('click', () => selectVersion(false));
  fixedTab.addEventListener('click', () => selectVersion(true));
})();
