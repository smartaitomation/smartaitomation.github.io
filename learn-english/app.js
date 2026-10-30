(() => {
  const $ = s => document.querySelector(s);
  const categories = ['All', 'Friends', 'House M.D.', 'Prison Break', 'Conversation', 'Vocabulary', 'Pronunciation', 'Grammar', 'Listening'];
  const storeKey = 'smartai-english-watched-v1', transcriptKey = 'smartai-english-transcripts-v1';
  let videos = [], selected = 'All', current = null, watched = [], savedTranscripts = {}, sentences = [], index = 0, hintLevel = 1, ytPlayer = null;
  const automaticCache = new Map(); let transcriptRequest = 0;
  try { watched = JSON.parse(localStorage.getItem(storeKey) || '[]'); if (!Array.isArray(watched)) watched = []; } catch (_) { watched = []; }
  try { savedTranscripts = JSON.parse(localStorage.getItem(transcriptKey) || '{}'); if (!savedTranscripts || Array.isArray(savedTranscripts)) savedTranscripts = {}; } catch (_) { savedTranscripts = {}; }
  const save = () => { try { localStorage.setItem(storeKey, JSON.stringify(watched)); } catch (_) {} };
  const escapeText = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render() {
    const query = $('#search').value.trim().toLowerCase();
    const filtered = videos.filter(v => (selected === 'All' || v.category === selected) && `${v.title} ${v.category} ${v.channel}`.toLowerCase().includes(query));
    $('#filters').innerHTML = categories.map(c => `<button type="button" class="filter${c === selected ? ' active' : ''}" data-category="${escapeText(c)}" aria-pressed="${c === selected}">${escapeText(c)}</button>`).join('');
    $('#results').textContent = `${filtered.length} ${filtered.length === 1 ? 'video' : 'videos'} ${selected === 'All' ? 'to explore' : 'in ' + selected}`;
    $('#progress-count').textContent = `${videos.filter(v => watched.includes(v.id)).length} of ${videos.length} watched`;
    $('#cards').innerHTML = filtered.map(v => `<article class="card"><button class="thumb" type="button" data-video="${v.id}" aria-label="Play ${escapeText(v.title)}"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" loading="lazy"><span class="play" aria-hidden="true">▶</span>${watched.includes(v.id) ? '<span class="watched-badge">✓ Watched</span>' : ''}</button><p class="card-category">${escapeText(v.category)}</p><h3><button type="button" data-video="${v.id}">${escapeText(v.title)}</button></h3><p class="channel">${escapeText(v.channel)} · YouTube</p></article>`).join('');
    $('#empty').hidden = filtered.length !== 0;
  }
  function parseTime(s) { const parts = s.replace(',', '.').split(':').map(Number); return parts.reduce((a, b) => a * 60 + b, 0); }
  function parseTranscript(raw) {
    const normalized = raw.replace(/\r/g, '').trim();
    const blocks = normalized.split(/\n\s*\n/), cues = [];
    blocks.forEach(block => {
      const lines = block.split('\n'); const t = lines.findIndex(line => /\d{1,2}:\d\d(?::\d\d)?[.,]\d+\s*-->/.test(line));
      if (t < 0) return;
      const m = lines[t].match(/(\d{1,2}:\d\d(?::\d\d)?[.,]\d+)\s*-->/);
      const text = lines.slice(t + 1).join(' ').replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').replace(/&amp;/g,'&').trim();
      if (text) cues.push({text, start:parseTime(m[1])});
    });
    if (!cues.length) return normalized.split(/(?<=[.!?])\s+|\n+/).map(text => ({text:text.trim(), start:null})).filter(x => /[a-z]/i.test(x.text));
    // Combine subtitle fragments into sentences and retain the first cue's timestamp.
    let out = [], buffer = '', start = null;
    cues.forEach(c => {
      if (!buffer) start = c.start;
      buffer += (buffer ? ' ' : '') + c.text;
      let match;
      while ((match = buffer.match(/^(.+?[.!?])(?:\s+|$)/))) {
        out.push({text:match[1].trim(), start}); buffer = buffer.slice(match[0].length); start = buffer ? c.start : null;
      }
    });
    if (buffer.trim()) out.push({text:buffer.trim(), start});
    return out.filter(x => /[a-z]/i.test(x.text));
  }
  function mask(text) { return text.replace(/[A-Za-z]+(?:'[A-Za-z]+)?/g, word => [...word].map((ch,i) => ch === "'" || i < hintLevel ? ch : '·').join('')); }
  function updateSentence() {
    const s = sentences[index]; if (!s) return;
    $('#sentence-count').textContent = `Sentence ${index + 1} of ${sentences.length}`;
    $('#hint').textContent = mask(s.text); $('#answer').value = ''; $('#feedback').textContent = '';
    $('#previous').disabled = index === 0; $('#next').disabled = index === sentences.length - 1;
    $('#replay').disabled = s.start === null;
    $('#timing-note').textContent = s.start === null ? 'This transcript has no timestamps. Use the video controls to find and replay the sentence.' : 'Play sentence jumps to its caption timestamp. Use the player to pause or replay.';
  }
  function makeExercise() {
    const raw = $('#transcript').value.trim(); const parsed = parseTranscript(raw);
    if (!parsed.length) { $('#import-status').textContent = 'Add a transcript or caption file first.'; return; }
    sentences = parsed; index = 0; hintLevel = 1;
    savedTranscripts[current.id] = raw;
    try { localStorage.setItem(transcriptKey, JSON.stringify(savedTranscripts)); $('#import-status').textContent = ''; }
    catch (_) { $('#import-status').textContent = 'Practice loaded, but it could not be saved on this device.'; }
    $('#import-panel').hidden = true; $('#exercise').hidden = false; updateSentence();
  }
  async function loadAutomaticTranscript(videoId, requestId) {
    const status = $('#auto-status');
    status.textContent = 'Loading English captions…';
    try {
      let entries = automaticCache.get(videoId);
      if (!entries) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        let response;
        try { response = await fetch(`https://api.freetranscriptapi.com/v1/transcript?video_url=${encodeURIComponent(videoId)}&lang=en`, {signal: controller.signal}); }
        finally { clearTimeout(timeout); }
        if (response.status === 429) throw new Error('The free caption service is temporarily rate-limited. Try again later.');
        if (!response.ok) throw new Error('English captions are unavailable for this video.');
        const data = await response.json();
        if (!/^en(?:-|$)/i.test(data.language || '')) throw new Error('No English captions were found for this video.');
        entries = TranscriptUtils.toExercises(data.transcript);
        if (!entries.length) throw new Error('No usable English captions were found for this video.');
        automaticCache.set(videoId, entries);
      }
      if (requestId !== transcriptRequest || !current || current.id !== videoId) return;
      sentences = entries; index = 0; hintLevel = 1; $('#import-panel').hidden = true; $('#exercise').hidden = false;
      status.textContent = `English captions loaded automatically · ${entries.length} practice lines. Captions can contain mistakes.`;
      updateSentence();
    } catch (error) {
      if (requestId !== transcriptRequest || !current || current.id !== videoId) return;
      status.textContent = error.name === 'AbortError' ? 'Caption loading timed out. Try again later or add a transcript below.' : `${error.message || 'Could not load captions.'} You can add a transcript below.`;
      if (savedTranscripts[videoId]) { $('#transcript').value = savedTranscripts[videoId]; makeExercise(); status.textContent += ' Your saved transcript is available.'; }
      else { $('#import-panel').hidden = false; $('#exercise').hidden = true; }
    }
  }
  function openVideo(id) {
    current = videos.find(v => v.id === id); if (!current) return;
    $('#player-category').textContent = current.category + ' · ' + current.channel; $('#player-title').textContent = current.title;
    $('#youtube-link').href = `https://www.youtube.com/watch?v=${current.id}`;
    $('#player').src = `https://www.youtube-nocookie.com/embed/${current.id}?rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    ytPlayer = null; if (window.YT && YT.Player) { try { ytPlayer = new YT.Player('player'); } catch (_) {} }
    $('#mark').textContent = watched.includes(id) ? '✓  Mark as unwatched' : '✓  Mark as watched';
    $('#transcript').value = savedTranscripts[id] || ''; $('#import-status').textContent = '';
    $('#import-panel').hidden = true; $('#exercise').hidden = true;
    const requestId = ++transcriptRequest;
    $('#player-dialog').showModal();
    loadAutomaticTranscript(id, requestId);
  }
  window.onYouTubeIframeAPIReady = () => { if (current && !ytPlayer) { try { ytPlayer = new YT.Player('player'); } catch (_) {} } };
  const api = document.createElement('script'); api.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(api);
  $('#filters').addEventListener('click', e => { const b = e.target.closest('[data-category]'); if (b) { selected = b.dataset.category; render(); } });
  $('#cards').addEventListener('click', e => { const b = e.target.closest('[data-video]'); if (b) openVideo(b.dataset.video); });
  $('#search').addEventListener('input', render);
  $('#close').addEventListener('click', () => $('#player-dialog').close());
  $('#player-dialog').addEventListener('close', () => { transcriptRequest++; $('#player').src = ''; current = null; ytPlayer = null; });
  $('#mark').addEventListener('click', () => { if (!current) return; watched = watched.includes(current.id) ? watched.filter(id => id !== current.id) : [...watched, current.id]; save(); $('#mark').textContent = watched.includes(current.id) ? '✓  Mark as unwatched' : '✓  Mark as watched'; render(); });
  $('#clear-progress').addEventListener('click', () => { if (!watched.length || confirm('Reset your watched lessons on this device?')) { watched = []; save(); render(); } });
  $('#caption-file').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; if (file.size > 2_000_000) { $('#import-status').textContent = 'Please choose a caption file smaller than 2 MB.'; return; } $('#transcript').value = await file.text(); $('#import-status').textContent = 'Caption file loaded. Select Create practice.'; e.target.value = ''; });
  $('#make-exercise').addEventListener('click', makeExercise);
  $('#edit-transcript').addEventListener('click', () => { transcriptRequest++; $('#auto-status').textContent = ''; $('#import-panel').hidden = false; $('#exercise').hidden = true; });
  $('#previous').addEventListener('click', () => { if (index > 0) { index--; hintLevel = 1; updateSentence(); } });
  $('#next').addEventListener('click', () => { if (index < sentences.length - 1) { index++; hintLevel = 1; updateSentence(); } });
  $('#more-hint').addEventListener('click', () => { hintLevel++; $('#hint').textContent = mask(sentences[index].text); });
  $('#reveal').addEventListener('click', () => { $('#feedback').textContent = `Answer: ${sentences[index].text}`; });
  const normalize = s => s.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  $('#check').addEventListener('click', () => { const answer = $('#answer').value; $('#feedback').textContent = !answer.trim() ? 'Type what you hear first.' : normalize(answer) === normalize(sentences[index].text) ? 'Correct! Nice listening.' : 'Not quite. Listen again or reveal another letter.'; });
  $('#answer').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#check').click(); } });
  $('#replay').addEventListener('click', () => { const time = sentences[index].start; if (time === null) return; if (ytPlayer && typeof ytPlayer.seekTo === 'function') { try { ytPlayer.seekTo(time, true); ytPlayer.playVideo(); return; } catch (_) {} } $('#feedback').textContent = `Use the player to seek to ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}.`; });
  fetch('videos.json').then(r => { if (!r.ok) throw Error('Unable to load videos'); return r.json(); }).then(data => { videos = data; render(); }).catch(() => { $('#results').textContent = 'The videos could not be loaded. Please refresh the page.'; });
})();
