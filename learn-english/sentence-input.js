/* A sentence with editable missing letters and progressive hints. */
(function (root) {
  'use strict';
  function create(container, onChange, onCheck) {
    let sentence = '', hints = 1, answers = new Map(), hidden = [];
    const isLetter = c => /[A-Za-z]/.test(c);
    function positions() {
      const result = []; let offset = 0;
      for (const token of sentence.match(/[A-Za-z]+(?:['’][A-Za-z]+)*|[^A-Za-z]+/g) || []) {
        let letter = 0, word = /[A-Za-z]/.test(token);
        for (const c of token) { if (word && isLetter(c)) { if (letter >= hints) result.push(offset); letter++; } offset += c.length; }
      }
      return result;
    }
    function render() {
      hidden = positions(); const missing = new Set(hidden); container.replaceChildren(); let offset = 0, wordNumber = 0;
      for (const token of sentence.match(/[A-Za-z]+(?:['’][A-Za-z]+)*|[^A-Za-z]+/g) || []) {
        const word = /[A-Za-z]/.test(token); if (word) wordNumber++;
        const group = document.createElement('span'); group.className = word ? 'practice-word' : 'practice-punctuation';
        let letterNumber = 0;
        for (const c of token) {
          if (word && isLetter(c)) letterNumber++;
          if (missing.has(offset)) {
            const input = document.createElement('input'); input.type = 'text'; input.className = 'letter-input'; input.maxLength = 1; input.autocomplete = 'off'; input.setAttribute('autocapitalize', 'none'); input.setAttribute('autocorrect', 'off'); input.setAttribute('spellcheck', 'false'); input.setAttribute('aria-label', `Word ${wordNumber}, letter ${letterNumber}`); input.dataset.position = String(offset); input.value = answers.get(offset) || ''; group.appendChild(input);
          } else { const span = document.createElement('span'); span.className = 'given-letter'; span.textContent = c; group.appendChild(span); }
          offset += c.length;
        }
        container.appendChild(group);
      }
    }
    function inputs() { return Array.from(container.querySelectorAll('.letter-input')); }
    function focusAt(n) { const el = inputs()[n]; if (el) { el.focus(); if (el.select) el.select(); } }
    container.addEventListener('input', event => {
      const el = event.target; if (!el.classList.contains('letter-input') || event.isComposing) return;
      const chars = Array.from(el.value).filter(isLetter); el.value = chars.length ? chars[chars.length - 1] : '';
      answers.set(Number(el.dataset.position), el.value); el.classList.remove('correct', 'incorrect'); onChange();
      if (el.value) focusAt(inputs().indexOf(el) + 1);
    });
    container.addEventListener('keydown', event => {
      const el = event.target; if (!el.classList.contains('letter-input') || event.isComposing) return;
      const i = inputs().indexOf(el);
      if (event.key === 'Backspace' && !el.value && i > 0) { event.preventDefault(); const prev = inputs()[i - 1]; prev.value = ''; answers.set(Number(prev.dataset.position), ''); prev.classList.remove('correct', 'incorrect'); focusAt(i - 1); onChange(); }
      else if (event.key === 'ArrowLeft' && i > 0) { event.preventDefault(); focusAt(i - 1); }
      else if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); focusAt(i + 1); }
      else if (event.key === 'Enter') { event.preventDefault(); onCheck(); }
    });
    container.addEventListener('paste', event => {
      const el = event.target; if (!el.classList.contains('letter-input')) return;
      const text = event.clipboardData?.getData('text') || ''; const chars = Array.from(text).filter(isLetter); if (!chars.length) return;
      event.preventDefault(); const all = inputs(); const from = all.indexOf(el); let used = 0;
      for (; used < chars.length && from + used < all.length; used++) { const field = all[from + used]; field.value = chars[used]; answers.set(Number(field.dataset.position), field.value); field.classList.remove('correct', 'incorrect'); }
      focusAt(Math.min(from + used, all.length - 1)); onChange();
    });
    return {
      setSentence(text) { sentence = text; hints = 1; answers = new Map(); render(); },
      moreHint() { hints++; render(); },
      reveal() { for (const pos of hidden) answers.set(pos, sentence[pos]); render(); },
      check() {
        let empty = 0, wrong = 0;
        inputs().forEach(field => { const pos = Number(field.dataset.position); const val = field.value; field.classList.remove('correct', 'incorrect'); if (!val) empty++; else if (val.toLowerCase() !== sentence[pos].toLowerCase()) { wrong++; field.classList.add('incorrect'); } else field.classList.add('correct'); });
        return {empty, wrong, total:hidden.length};
      }
    };
  }
  root.SentenceInput = {create};
})(typeof window !== 'undefined' ? window : globalThis);
