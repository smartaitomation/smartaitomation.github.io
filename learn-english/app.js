(() => {
  const $ = s => document.querySelector(s);
  const categories = ['All', 'Conversation', 'Vocabulary', 'Pronunciation', 'Grammar', 'Listening'];
  const storeKey = 'smartai-english-watched-v1';
  const notesKey = 'smartai-english-dictation-v1';
  let notes = {};
  try { notes = JSON.parse(localStorage.getItem(notesKey) || '{}'); if (!notes || typeof notes !== 'object' || Array.isArray(notes)) notes = {}; } catch (_) { notes = {}; }
  let videos = [], selected = 'All', current = null, watched = [];
  try { watched = JSON.parse(localStorage.getItem(storeKey) || '[]'); if (!Array.isArray(watched)) watched = []; } catch (_) { watched = []; }
  const save = () => { try { localStorage.setItem(storeKey, JSON.stringify(watched)); } catch (_) {} };
  const escapeText = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const query = $('#search').value.trim().toLowerCase();
    const filtered = videos.filter(v => (selected === 'All' || v.category === selected) && `${v.title} ${v.category} ${v.channel}`.toLowerCase().includes(query));
    $('#filters').innerHTML = categories.map(c => `<button type="button" class="filter${c === selected ? ' active' : ''}" data-category="${c}" aria-pressed="${c === selected}">${c}</button>`).join('');
    $('#results').textContent = `${filtered.length} ${filtered.length === 1 ? 'lesson' : 'lessons'} ${selected === 'All' ? 'to explore' : 'in ' + selected}`;
    $('#progress-count').textContent = `${videos.filter(v => watched.includes(v.id)).length} of ${videos.length} watched`;
    $('#cards').innerHTML = filtered.map(v => `<article class="card"><button class="thumb" type="button" data-video="${v.id}" aria-label="Play ${escapeText(v.title)}"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy"><span class="play" aria-hidden="true">▶</span>${watched.includes(v.id) ? '<span class="watched-badge">✓ Watched</span>' : ''}</button><p class="card-category">${escapeText(v.category)}</p><h3><button type="button" data-video="${v.id}">${escapeText(v.title)}</button></h3><p class="channel">${escapeText(v.channel)} · YouTube</p></article>`).join('');
    $('#empty').hidden = filtered.length !== 0;
  }
  function openVideo(id) {
    current = videos.find(v => v.id === id); if (!current) return;
    $('#dictation').value = notes[id] || ''; updateWordCount();
    $('#player-category').textContent = current.category + ' · BBC Learning English';
    $('#player-title').textContent = current.title;
    $('#youtube-link').href = `https://www.youtube.com/watch?v=${current.id}`;
    $('#player').src = `https://www.youtube-nocookie.com/embed/${current.id}?rel=0`;
    $('#mark').textContent = watched.includes(id) ? '✓  Mark as unwatched' : '✓  Mark as watched';
    $('#player-dialog').showModal();
  }
  function updateWordCount() { const text = $('#dictation').value.trim(); const count = text ? text.split(/\s+/).length : 0; $('#word-count').textContent = `${count} ${count === 1 ? 'word' : 'words'}`; }
  function saveNotes() { if (!current) return; notes[current.id] = $('#dictation').value; try { localStorage.setItem(notesKey, JSON.stringify(notes)); } catch (_) {} updateWordCount(); }
  $('#dictation').addEventListener('input', saveNotes);
  $('#clear-notes').addEventListener('click', () => { $('#dictation').value = ''; saveNotes(); $('#dictation').focus(); });
  $('#filters').addEventListener('click', e => { const b = e.target.closest('[data-category]'); if (b) { selected = b.dataset.category; render(); } });
  $('#cards').addEventListener('click', e => { const b = e.target.closest('[data-video]'); if (b) openVideo(b.dataset.video); });
  $('#search').addEventListener('input', render);
  $('#close').addEventListener('click', () => $('#player-dialog').close());
  $('#player-dialog').addEventListener('close', () => { $('#player').src = ''; current = null; });
  $('#mark').addEventListener('click', () => { if (!current) return; watched = watched.includes(current.id) ? watched.filter(id => id !== current.id) : [...watched, current.id]; save(); $('#mark').textContent = watched.includes(current.id) ? '✓  Mark as unwatched' : '✓  Mark as watched'; render(); });
  $('#clear-progress').addEventListener('click', () => { if (!watched.length || confirm('Reset your watched lessons on this device?')) { watched = []; save(); render(); } });
  fetch('videos.json').then(r => { if (!r.ok) throw Error('Unable to load lessons'); return r.json(); }).then(data => { videos = data; render(); }).catch(() => { $('#results').textContent = 'The lessons could not be loaded. Please refresh the page.'; });
})();
