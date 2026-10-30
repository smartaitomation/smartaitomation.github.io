/* Converts caption cues into short, timed listening exercises. */
(function (root) {
  'use strict';
  function captionText(value) {
    return String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  }
  function toExercises(cues) {
    if (!Array.isArray(cues)) return [];
    // A caption gap is only a proxy for a spoken pause; no audio is analysed here.
    const gap = .3, pad = .12;
    const clean = cues.map(cue => ({text:captionText(cue && cue.text), start:Number(cue && cue.start), duration:Number(cue && cue.duration)}))
      .filter(cue => cue.text && Number.isFinite(cue.start) && cue.start >= 0 && Number.isFinite(cue.duration) && cue.duration > 0)
      .sort((a,b) => a.start - b.start);
    const out = []; let group = [], end = 0, before = null;
    function flush(after) {
      const spoken = group.map(cue => cue.text).join(' ');
      if (before !== null && after >= gap && /[A-Za-z]/.test(spoken) && !group.some(cue => /^\[[^\]]+\]$/.test(cue.text))) {
        out.push({text:spoken, start:Math.max(0, group[0].start - Math.min(pad,before / 2)), end:end + Math.min(pad,after / 2), pauseBounded:true});
      }
      group = [];
    }
    for (const cue of clean) {
      if (!group.length) { group = [cue]; end = cue.start + cue.duration; before = cue.start >= gap ? cue.start : null; continue; }
      const separation = cue.start - end;
      if (separation >= gap) { flush(separation); before = separation; group = [cue]; end = cue.start + cue.duration; }
      else { group.push(cue); end = Math.max(end, cue.start + cue.duration); }
    }
    // The last cue has no following cue from which to infer a pause.
    return out;
  }
  function splitEntry(entry, at) {
    const text = entry.text, breakAt = text.lastIndexOf(' ', at);
    const cut = breakAt > 0 ? breakAt : at;
    const leftText = text.slice(0, cut).trimEnd();
    const rightStart = cut + (text.slice(cut).match(/^\s*/) || [''])[0].length;
    const rightText = text.slice(rightStart);
    if (!leftText || !rightText) return null;
    let boundary = null;
    if (Number.isFinite(entry.start) && Number.isFinite(entry.end) && entry.end > entry.start) {
      const spans = entry.sources || [];
      const source = spans.find(x => cut >= x.from && cut <= x.to);
      if (source && source.end > source.start) boundary = source.start + (source.end - source.start) * Math.max(0, Math.min(1, (cut - source.from) / (source.to - source.from)));
      else { const next = spans.find(x => x.from >= rightStart); if (next) boundary = next.start; }
      if (!Number.isFinite(boundary)) boundary = entry.start + (entry.end - entry.start) * cut / text.length;
      const margin = Math.min(.01, (entry.end - entry.start) / 4);
      boundary = Math.max(entry.start + margin, Math.min(entry.end - margin, boundary));
    }
    const splitSources = (startIndex, endIndex) => (entry.sources || []).filter(x => x.to > startIndex && x.from < endIndex).map(x => {
      const lo = Math.max(startIndex,x.from), hi = Math.min(endIndex,x.to), duration = x.end - x.start, length = x.to - x.from;
      return {from:lo-startIndex, to:hi-startIndex, start:x.start + duration * (lo-x.from)/length, end:x.start + duration * (hi-x.from)/length};
    });
    const left = {text:leftText, start:entry.start, end:boundary, sources:splitSources(0,cut), answers:{}};
    const right = {text:rightText, start:boundary, end:entry.end, sources:splitSources(rightStart,text.length), answers:{}};
    for (const [key,value] of Object.entries(entry.answers || {})) { const i = Number(key); if (i < cut) left.answers[i] = value; else if (i >= rightStart) right.answers[i-rightStart] = value; }
    return [left,right];
  }
  root.TranscriptUtils = { toExercises, splitEntry };
})(typeof window !== 'undefined' ? window : globalThis);
