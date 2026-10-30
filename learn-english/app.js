(() => {
  const $ = s => document.querySelector(s);
  const categories = ['All', 'Friends', 'House M.D.', 'Prison Break', 'Conversation', 'Vocabulary', 'Pronunciation', 'Grammar', 'Listening'];
  const storeKey = 'smartai-english-watched-v1', transcriptKey = 'smartai-english-transcripts-v1';
  let videos = [], selected = 'All', current = null, watched = [], savedTranscripts = {}, sentences = [], allSentences = [], index = 0, hintLevel = 1, ytPlayer = null;
  const automaticCache = new Map(); let transcriptRequest = 0, playerGeneration = 0, playerReady = false, looping = false, playbackArmed = false, firstAutoplayPending = false, correctAttempts = 0, totalAttempts = 0, playbackState = -1, lastPracticeWidth = 0;
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
      const m = lines[t].match(/(\d{1,2}:\d\d(?::\d\d)?[.,]\d+)\s*-->\s*(\d{1,2}:\d\d(?::\d\d)?[.,]\d+)/);
      if (!m) return;
      const text = lines.slice(t + 1).join(' ').replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').replace(/&amp;/g,'&').trim();
      if (text) { const start = parseTime(m[1]), end = parseTime(m[2]); cues.push({text, start, duration:Math.max(0, end - start)}); }
    });
    if (!cues.length) return normalized.split(/(?<=[.!?])\s+|\n+/).map(text => ({text:text.trim(), start:null})).filter(x => /[a-z]/i.test(x.text));
    return TranscriptUtils.toExercises(cues);
  }
  function updateAccuracy() {
    const percentage = totalAttempts ? `${Math.round(100 * correctAttempts / totalAttempts)}%` : '—';
    $('#accuracy').textContent = `Accuracy ${percentage} · ${totalAttempts} ${totalAttempts === 1 ? 'attempt' : 'attempts'}`;
  }
  const sentenceInput = SentenceInput.create($('#hint'), event => {
    const attempts = event?.attempts || [];
    totalAttempts += attempts.length; correctAttempts += attempts.filter(Boolean).length;
    updateAccuracy(); $('#feedback').textContent = '';
  }, () => $('#check').click());
  function saveCurrentAnswers() { if (sentences[index]) sentences[index].answers = sentenceInput.getAnswers(); }
  function fitPauseBoundedSentences(preferred) {
    // Do not split timed speech at an estimated point just to make it fit.
    sentences = allSentences.filter(s => {
      if (!s.pauseBounded) return true;
      sentenceInput.setSentence(s.text, s.answers);
      return sentenceInput.splitAfterRows(2) === null;
    });
    if (!sentences.length) {
      $('#exercise').hidden = true; $('#import-panel').hidden = false;
      $('#auto-status').textContent = 'No short caption segments with gaps on both sides were found for this screen. Try another video or add a transcript.';
      if (playerReady && ytPlayer && typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
      return false;
    }
    const originalIndex = preferred ? allSentences.indexOf(preferred) : 0;
    index = Math.max(0, sentences.indexOf(preferred));
    if (preferred && !sentences.includes(preferred)) {
      const next = sentences.findIndex(s => allSentences.indexOf(s) > originalIndex);
      index = next < 0 ? sentences.length - 1 : next;
    }
    return true;
  }
  function updateSentence() {
    let s = sentences[index]; if (!s) return;
    sentenceInput.setSentence(s.text, s.answers); $('#feedback').textContent = '';
    // Measure real letter boxes before painting, and split at a word boundary when a third row appears.
    for (let attempts = 0; !s.pauseBounded && attempts < 50; attempts++) {
      const at = sentenceInput.splitAfterRows(2);
      if (!Number.isFinite(at) || at <= 0 || at >= s.text.length) break;
      s.answers = sentenceInput.getAnswers();
      const parts = TranscriptUtils.splitEntry(s, at); if (!parts) break;
      sentences.splice(index, 1, ...parts); s = parts[0]; sentenceInput.setSentence(s.text, s.answers);
    }
    lastPracticeWidth = $('#hint').clientWidth;
    $('#sentence-count').textContent = `Line ${index + 1} of ${sentences.length}`;
    $('#line-progress').max = sentences.length; $('#line-progress').value = index + 1;
    $('#previous').disabled = index === 0; $('#next').disabled = index === sentences.length - 1;
    const timed = Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start;
    $('#replay').disabled = !timed; $('#loop').disabled = !timed; $('#toggle-play').disabled = !timed;
    $('#timing-note').textContent = timed ? 'Caption gaps suggest a pause on each side; actual speech timing may vary.' : 'This line has no complete timestamps.';
    positionOrAutoplay();
  }
  function bounds() {
    const s = sentences[index];
    return current && s && Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start ? {videoId:current.id, startSeconds:s.start, endSeconds:s.end} : null;
  }
  function cueSentence() {
    const segment = bounds(); playbackArmed = false;
    if (segment && playerReady && ytPlayer && typeof ytPlayer.cueVideoById === 'function') {
      try { ytPlayer.cueVideoById(segment); } catch (_) { $('#feedback').textContent = 'Could not position the video. Use its controls to seek.'; }
    }
  }
  function disableCaptions() {
    if (!playerReady || !ytPlayer || typeof ytPlayer.setOption !== 'function') return;
    try { ytPlayer.setOption('captions', 'track', {}); } catch (_) {}
  }
  function positionOrAutoplay() {
    const segment = bounds();
    if (!segment || !playerReady || !ytPlayer) return;
    disableCaptions();
    if (firstAutoplayPending) {
      firstAutoplayPending = false; playbackArmed = false;
      try { ytPlayer.loadVideoById(segment); disableCaptions(); return; }
      catch (_) { $('#feedback').textContent = 'Tap Play sentence to start.'; }
    }
    cueSentence();
  }
  function setupPlayer() {
    if (!current || ytPlayer || !window.YT || !YT.Player) return;
    const generation = playerGeneration;
    try {
      ytPlayer = new YT.Player('player', {events:{
        onReady: event => { if (generation !== playerGeneration || !current) return; ytPlayer = event.target; playerReady = true; disableCaptions(); positionOrAutoplay(); },
        onApiChange: event => { if (generation === playerGeneration && event.target === ytPlayer) disableCaptions(); },
        onAutoplayBlocked: () => { if (generation === playerGeneration && current) $('#feedback').textContent = 'Autoplay was blocked. Tap Play sentence to start.'; },
        onStateChange: event => {
          if (generation !== playerGeneration || !current || event.target !== ytPlayer) return;
          playbackState = event.data; $('#toggle-play').textContent = event.data === 1 ? 'Ⅱ Pause' : '▶ Play';
          if (event.data === 1) { playbackArmed = true; disableCaptions(); }
          if (event.data === 0 && playbackArmed) {
            playbackArmed = false;
            const segment = bounds();
            if (looping && segment) { try { ytPlayer.loadVideoById(segment); disableCaptions(); } catch (_) { $('#feedback').textContent = 'Could not replay the sentence.'; } }
          }
        }
      }});
    } catch (_) { ytPlayer = null; }
  }
  function makeExercise() {
    const raw = $('#transcript').value.trim(); const parsed = parseTranscript(raw);
    if (!parsed.length) { $('#import-status').textContent = 'Add a transcript or caption file first.'; return; }
    allSentences = parsed; sentences = parsed; index = 0; hintLevel = 1;
    savedTranscripts[current.id] = raw;
    try { localStorage.setItem(transcriptKey, JSON.stringify(savedTranscripts)); $('#import-status').textContent = ''; }
    catch (_) { $('#import-status').textContent = 'Practice loaded, but it could not be saved on this device.'; }
    $('#import-panel').hidden = true; $('#exercise').hidden = false;
    if (fitPauseBoundedSentences()) updateSentence();
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
      allSentences = entries.map(entry => ({...entry, sources:(entry.sources || []).map(source => ({...source}))})); index = 0; hintLevel = 1; $('#import-panel').hidden = true; $('#exercise').hidden = false;
      if (fitPauseBoundedSentences()) {
        status.textContent = `English captions loaded automatically · ${sentences.length} short clips with caption gaps. Captions can contain mistakes.`;
        updateSentence();
      }
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
    $('#player').src = `https://www.youtube-nocookie.com/embed/${current.id}?rel=0&controls=0&disablekb=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
    playerGeneration++; ytPlayer = null; playerReady = false; playbackArmed = false; firstAutoplayPending = true; looping = false; playbackState = -1; correctAttempts = 0; totalAttempts = 0; updateAccuracy(); $('#toggle-play').textContent = '▶ Play'; $('#loop').setAttribute('aria-pressed', 'false'); $('#loop').textContent = '↻ Loop off';
    sentences = []; allSentences = []; setupPlayer();
    $('#mark').textContent = watched.includes(id) ? '✓  Mark as unwatched' : '✓  Mark as watched';
    $('#transcript').value = savedTranscripts[id] || ''; $('#import-status').textContent = '';
    $('#import-panel').hidden = true; $('#exercise').hidden = true;
    const requestId = ++transcriptRequest;
    $('#player-dialog').showModal();
    syncPracticeViewport();
    loadAutomaticTranscript(id, requestId);
  }
  // iOS can shrink only the visual viewport when the keyboard appears.
  const practiceDialog = $('#player-dialog');
  function syncPracticeViewport() {
    if (!practiceDialog.open || !window.matchMedia('(max-width: 650px)').matches) return;
    const viewport = window.visualViewport;
    if (viewport) {
      practiceDialog.style.setProperty('--practice-viewport-height', `${viewport.height}px`);
      practiceDialog.style.setProperty('--practice-viewport-top', `${viewport.offsetTop}px`);
    }
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (!practiceDialog.open || !active || !active.classList.contains('letter-input')) return;
      const field = active.getBoundingClientRect(), player = practiceDialog.querySelector('.video-wrap').getBoundingClientRect(), dialog = practiceDialog.getBoundingClientRect();
      const sentence = $('#hint').getBoundingClientRect();
      const bottom = Math.min(dialog.bottom, viewport ? viewport.offsetTop + viewport.height : window.innerHeight) - 8;
      const top = player.bottom + 6;
      // Keep the whole line visible when it fits; for longer lines, keep the active letter visible.
      if (sentence.height <= bottom - (dialog.top + player.height + 6)) {
        if (sentence.bottom > bottom) practiceDialog.scrollBy({top: sentence.bottom - bottom, behavior:'instant'});
        else if (sentence.top < top) practiceDialog.scrollBy({top: sentence.top - top, behavior:'instant'});
      } else if (field.bottom > bottom) practiceDialog.scrollBy({top: field.bottom - bottom, behavior:'instant'});
      else if (field.top < top) practiceDialog.scrollBy({top: field.top - top, behavior:'instant'});
    });
  }
  practiceDialog.addEventListener('focusin', event => {
    if (event.target.classList.contains('letter-input')) { practiceDialog.classList.add('keyboard-open'); syncPracticeViewport(); }
  });
  practiceDialog.addEventListener('focusout', () => requestAnimationFrame(() => {
    if (!document.activeElement?.classList.contains('letter-input')) { practiceDialog.classList.remove('keyboard-open'); syncPracticeViewport(); }
  }));
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncPracticeViewport);
    window.visualViewport.addEventListener('scroll', syncPracticeViewport);
  }
  window.addEventListener('resize', () => {
    syncPracticeViewport();
    if (practiceDialog.open && !$('#exercise').hidden && sentences[index] && $('#hint').clientWidth !== lastPracticeWidth) {
      saveCurrentAnswers(); const preferred = sentences[index];
      if (!allSentences.some(s => s.pauseBounded) || fitPauseBoundedSentences(preferred)) updateSentence();
    }
  });
  window.onYouTubeIframeAPIReady = setupPlayer;
  const api = document.createElement('script'); api.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(api);
  $('#filters').addEventListener('click', e => { const b = e.target.closest('[data-category]'); if (b) { selected = b.dataset.category; render(); } });
  $('#cards').addEventListener('click', e => { const b = e.target.closest('[data-video]'); if (b) openVideo(b.dataset.video); });
  $('#search').addEventListener('input', render);
  $('#close').addEventListener('click', () => $('#player-dialog').close());
  $('#player-dialog').addEventListener('close', () => { practiceDialog.classList.remove('keyboard-open'); practiceDialog.style.removeProperty('--practice-viewport-height'); practiceDialog.style.removeProperty('--practice-viewport-top'); transcriptRequest++; playerGeneration++; playerReady = false; playbackArmed = false; firstAutoplayPending = false; $('#player').src = ''; current = null; ytPlayer = null; });
  $('#mark').addEventListener('click', () => { if (!current) return; watched = watched.includes(current.id) ? watched.filter(id => id !== current.id) : [...watched, current.id]; save(); $('#mark').textContent = watched.includes(current.id) ? '✓  Mark as unwatched' : '✓  Mark as watched'; render(); });
  $('#clear-progress').addEventListener('click', () => { if (!watched.length || confirm('Reset your watched lessons on this device?')) { watched = []; save(); render(); } });
  $('#caption-file').addEventListener('change', async e => { const file = e.target.files[0]; if (!file) return; if (file.size > 2_000_000) { $('#import-status').textContent = 'Please choose a caption file smaller than 2 MB.'; return; } $('#transcript').value = await file.text(); $('#import-status').textContent = 'Caption file loaded. Select Create practice.'; e.target.value = ''; });
  $('#make-exercise').addEventListener('click', makeExercise);
  $('#edit-transcript').addEventListener('click', () => { transcriptRequest++; $('#auto-status').textContent = ''; $('#import-panel').hidden = false; $('#exercise').hidden = true; });
  $('#previous').addEventListener('click', () => { if (index > 0) { saveCurrentAnswers(); index--; hintLevel = 1; updateSentence(); } });
  $('#next').addEventListener('click', () => { if (index < sentences.length - 1) { saveCurrentAnswers(); index++; hintLevel = 1; updateSentence(); } });
  $('#more-hint').addEventListener('click', () => { sentenceInput.moreHint(); $('#feedback').textContent = ''; });
  $('#reveal').addEventListener('click', () => { sentenceInput.reveal(); $('#feedback').textContent = 'Answer revealed.'; });
  $('#check').addEventListener('click', () => {
    const {empty, wrong, total} = sentenceInput.check();
    $('#feedback').textContent = !total ? 'No missing letters in this line.' : empty ? `Fill in the ${empty} remaining ${empty === 1 ? 'letter' : 'letters'}.` : wrong ? 'Not quite. Check the highlighted letters and listen again.' : 'Correct! Nice listening.';
  });
  $('#loop').addEventListener('click', () => { looping = !looping; $('#loop').setAttribute('aria-pressed', String(looping)); $('#loop').textContent = looping ? '↻ Loop on' : '↻ Loop off'; });
  $('#toggle-play').addEventListener('click', () => {
    if (!playerReady || !ytPlayer) { $('#feedback').textContent = 'Player is not ready. Try again.'; return; }
    try {
      if (playbackState === 1) ytPlayer.pauseVideo();
      else if (playbackState === 0) { const segment = bounds(); if (segment) ytPlayer.loadVideoById(segment); }
      else ytPlayer.playVideo();
      disableCaptions();
    } catch (_) { $('#feedback').textContent = 'Use the video player controls to play or pause.'; }
  });
  $('#fullscreen').addEventListener('click', async () => {
    try {
      const frame = ytPlayer && typeof ytPlayer.getIframe === 'function' ? ytPlayer.getIframe() : $('#player');
      if (typeof frame.requestFullscreen === 'function') await frame.requestFullscreen();
      else if (typeof frame.webkitRequestFullscreen === 'function') frame.webkitRequestFullscreen();
      else throw new Error('Fullscreen unavailable');
    } catch (_) { $('#feedback').textContent = 'Use the fullscreen control in the YouTube player.'; }
  });
  $('#replay').addEventListener('click', () => {
    const segment = bounds(); if (!segment) return;
    if (playerReady && ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
      try { playbackArmed = false; ytPlayer.loadVideoById(segment); disableCaptions(); return; } catch (_) {}
    }
    $('#feedback').textContent = `Player is not ready. Try again or seek to ${Math.floor(segment.startSeconds / 60)}:${String(Math.floor(segment.startSeconds % 60)).padStart(2, '0')}.`;
  });
  fetch('videos.json').then(r => { if (!r.ok) throw Error('Unable to load videos'); return r.json(); }).then(data => { videos = data; render(); }).catch(() => { $('#results').textContent = 'The videos could not be loaded. Please refresh the page.'; });
})();
