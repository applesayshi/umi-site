/**
 * ProduceUMI song snippets. Every play button ([data-snippet]) shares one <audio>, so starting a snippet
 * stops whichever one was playing. The button and its closest [data-snippet-root] (the card, row or record
 * around it) get .is-loading / .is-playing / .is-paused / .has-error, and the button gets --progress
 * (0 to 1) for its progress ring. Clicks are delegated, so buttons work anywhere on the page.
 */
type State = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

const audio = new Audio();
audio.preload = 'none';
let current: HTMLButtonElement | null = null;
let frame = 0;
let live: HTMLElement | null = null;

function paint(button: HTMLButtonElement, state: State) {
  const active = state === 'loading' || state === 'playing';
  for (const el of [button, button.closest<HTMLElement>('[data-snippet-root]')]) {
    if (!el) continue;
    el.classList.toggle('is-playing', active);
    el.classList.toggle('is-loading', state === 'loading');
    el.classList.toggle('is-paused', state === 'paused');
    el.classList.toggle('has-error', state === 'error');
  }
  button.setAttribute('aria-pressed', String(active));
  if (state === 'idle' || state === 'error') button.style.setProperty('--progress', '0');
}

function announce(message: string) {
  if (!live) {
    live = document.createElement('p');
    live.className = 'visually-hidden';
    live.setAttribute('aria-live', 'polite');
    document.body.append(live);
  }
  live.textContent = message;
}

function showProgress() {
  if (current && audio.duration) current.style.setProperty('--progress', Math.min(1, audio.currentTime / audio.duration).toFixed(4));
}

function tick() {
  showProgress();
  frame = requestAnimationFrame(tick);
}

function reset() {
  cancelAnimationFrame(frame);
  audio.pause();
  if (current) paint(current, 'idle');
  current = null;
}

function fail(button: HTMLButtonElement) {
  if (button === current) reset();
  paint(button, 'error');
  announce(`Sorry, the snippet of ${button.dataset.snippetTitle ?? 'this song'} couldn't play.`);
  window.setTimeout(() => button !== current && paint(button, 'idle'), 2500);
}

function start(button: HTMLButtonElement) {
  reset();
  current = button;
  paint(button, 'loading');
  audio.src = button.dataset.snippet ?? '';
  if ('mediaSession' in navigator && 'MediaMetadata' in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: button.dataset.snippetTitle ?? '',
      artist: button.dataset.snippetArtist ?? '',
      album: 'ProduceUMI (snippet)',
    });
  }
  // AbortError only means another snippet was started before this one began.
  audio.play().catch((error: DOMException) => error.name !== 'AbortError' && fail(button));
}

audio.addEventListener('playing', () => {
  if (!current) return;
  paint(current, 'playing');
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(tick);
});
audio.addEventListener('waiting', () => current && !audio.paused && paint(current, 'loading'));
// Also fires for pauses from headphones or the lock screen. The paused check skips the stale event
// a switch between snippets leaves behind.
audio.addEventListener('pause', () => {
  if (!current || !audio.paused || audio.ended) return;
  cancelAnimationFrame(frame);
  paint(current, 'paused');
});
// Animation frames pause in background tabs; timeupdate keeps the ring roughly right regardless.
audio.addEventListener('timeupdate', showProgress);
audio.addEventListener('ended', reset);
audio.addEventListener('error', () => current && fail(current));

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  // Opening a full Spotify/SoundCloud/YouTube player stops the snippet.
  if (target?.closest('[data-embed] button')) reset();
  const button = target?.closest<HTMLButtonElement>('button[data-snippet]');
  if (!button) return;
  if (button !== current) start(button);
  else if (audio.paused) audio.play().catch(() => fail(button));
  else audio.pause();
});

window.addEventListener('pagehide', reset);
