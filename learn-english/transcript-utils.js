/* Converts caption cues into short, timed listening exercises. */
(function (root) {
  'use strict';
  function captionText(value) {
    return String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  }
  function toExercises(cues) {
    if (!Array.isArray(cues)) return [];
    const out = []; let text = '', start = null, lastEnd = null;
    function flush() { if (text && /[A-Za-z]/.test(text)) out.push({text: text.trim(), start, end: lastEnd !== null && lastEnd > start ? lastEnd : null}); text = ''; start = null; lastEnd = null; }
    cues.forEach(cue => {
      const chunk = captionText(cue && cue.text); const time = Number(cue && cue.start); const duration = Number(cue && cue.duration);
      if (!chunk || !Number.isFinite(time) || time < 0 || /^\s*\[[^\]]+\]\s*$/.test(chunk)) return;
      if (text && lastEnd !== null && time - lastEnd > 1.5) flush();
      if (!text) start = time;
      text += (text ? ' ' : '') + chunk;
      lastEnd = Math.max(lastEnd === null ? time : lastEnd, time + (Number.isFinite(duration) && duration > 0 ? duration : 0));
      if (/[.!?]["'’”)]*$/.test(chunk) || text.split(/\s+/).length >= 16 || lastEnd - start >= 12) flush();
    });
    flush(); return out;
  }
  root.TranscriptUtils = { toExercises };
})(typeof window !== 'undefined' ? window : globalThis);
