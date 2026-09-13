/**
 * Scroll reveals and the photo "flash develop" effect.
 * Flashes are queued at least 400ms apart site-wide so the page never exceeds
 * three flashes per second (WCAG 2.3.1), and they're skipped entirely for reduced motion.
 */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function revealAll() {
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
}

if (!('IntersectionObserver' in window) || reduceMotion.matches) {
  revealAll();
} else {
  /*
   * Chrome's IntersectionObserver honours the target's own clip-path, and "stutter"
   * reveals start fully clipped, so they would never intersect. Observe their
   * parent instead and reveal every child that is waiting on it.
   */
  const waiting = new Map<Element, Element[]>();
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        waiting.get(entry.target)?.forEach((el) => el.classList.add('is-in'));
        waiting.delete(entry.target);
        revealObserver.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0 },
  );
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    const target = el.dataset.reveal === 'stutter' ? (el.parentElement ?? el) : el;
    const list = waiting.get(target);
    if (list) list.push(el);
    else {
      waiting.set(target, [el]);
      revealObserver.observe(target);
    }
  });

  const queue: Element[] = [];
  let lastFlash = 0;
  let timer = 0;
  const drain = () => {
    timer = 0;
    const next = queue.shift();
    if (!next) return;
    next.classList.add('is-flashed');
    lastFlash = performance.now();
    if (queue.length) timer = window.setTimeout(drain, 400);
  };

  const flashObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        flashObserver.unobserve(entry.target);
        queue.push(entry.target);
      }
      if (queue.length && !timer) {
        const wait = Math.max(0, 400 - (performance.now() - lastFlash));
        timer = window.setTimeout(drain, wait);
      }
    },
    { threshold: 0.35 },
  );
  document.querySelectorAll('[data-flash]').forEach((el) => flashObserver.observe(el));
}

// If the visitor switches on reduced motion mid-visit, settle everything immediately.
reduceMotion.addEventListener?.('change', (event) => {
  if (event.matches) revealAll();
});
