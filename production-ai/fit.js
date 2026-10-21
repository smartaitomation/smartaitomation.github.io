/* Keep old fit-check links working after moving the quiz to ShortsBlink. */
(() => {
  const target = new URL('https://shortsblink.com/book-ai-call');
  const offer = new URLSearchParams(location.search).get('offer');
  if (['workshop', 'core', 'development'].includes(offer)) target.searchParams.set('offer', offer);
  location.replace(target.href);
})();
