/**
 * City lights drifting past a slow shutter, with soft motion trails. Runs at 30fps with
 * time-based movement, so it glides at the same speed on any screen. Renders at half
 * resolution (soft bokeh for free), pauses off-screen or in background tabs, and draws a
 * single still frame for reduced motion or data-saver users.
 */
// Blue-hour city lights: periwinkle, cobalt and cyan with orange/pink taillights.
const COLORS = ['#93a3e6', '#2c52e0', '#5ec8d6', '#ff5a2b', '#ff7cc2', '#eef1fa'];
const FPS = 30;
// Light speeds were tuned per 12fps frame; scale by elapsed time so the pace doesn't change.
const BASE_FRAME_MS = 1000 / 12;
// Trail fade per frame, chosen so trails last as long as they did at 12fps with a 0.3 fade.
const FADE = 1 - Math.pow(0.7, 12 / FPS);

interface Light {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  sprite: HTMLCanvasElement;
  depth: number;
  phase: number;
}

function makeSprite(color: string) {
  const size = 128;
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = size;
  const g = sprite.getContext('2d')!;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `${color}ff`);
  grad.addColorStop(0.22, `${color}d0`);
  grad.addColorStop(0.55, `${color}40`);
  grad.addColorStop(1, `${color}00`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return sprite;
}

export function mountHeroCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const still = reduceMotion || saveData;
  const scale = 0.5;
  const sprites = COLORS.map(makeSprite);

  let width = 0;
  let height = 0;
  let lights: Light[] = [];
  let pointerX = 0;
  let pointerY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let visible = true;
  let raf = 0;
  let last = 0;

  const seedLights = () => {
    const count = width > 480 ? 28 : 16;
    lights = Array.from({ length: count }, () => {
      const depth = Math.random();
      return {
        x: Math.random() * width,
        y: height * (0.08 + Math.random() * 0.84),
        r: 6 + depth * depth * Math.min(width, 900) * 0.07,
        vx: (0.8 + depth * 3.2) * (width / 700),
        vy: (Math.random() - 0.5) * 0.3,
        a: 0.3 + Math.random() * 0.55,
        sprite: sprites[Math.floor(Math.random() * sprites.length)],
        depth,
        phase: Math.random() * Math.PI * 2,
      };
    });
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width * scale));
    height = Math.max(1, Math.round(rect.height * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#070b1f';
    ctx.fillRect(0, 0, width, height);
    seedLights();
    if (still) {
      for (let i = 0; i < 14; i++) step(i * 0.6);
    }
  };

  /** Advance one frame. `k` is the elapsed time in 12fps frames (1 = one twelfth of a second). */
  const step = (t: number, k = 1, fade = 0.3) => {
    // Fade the previous frame instead of clearing: the leftover light becomes the smear.
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(7, 11, 31, ${fade})`;
    ctx.fillRect(0, 0, width, height);

    const ease = 1 - Math.pow(1 - 0.18, k);
    offsetX += (pointerX - offsetX) * ease;
    offsetY += (pointerY - offsetY) * ease;

    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      l.x += l.vx * k;
      l.y += l.vy * k;
      if (l.x - l.r * 3 > width) {
        l.x = -l.r * 2;
        l.y = height * (0.08 + Math.random() * 0.84);
      }
      // Dim lights passing behind the headline (left) so text keeps its contrast.
      const falloff = 0.28 + 0.72 * Math.min(1, Math.max(0, l.x / width) * 1.35);
      const twinkle = 0.82 + Math.sin(t * 1.7 + l.phase) * 0.18;
      const px = l.x + offsetX * (0.3 + l.depth) * 18;
      const py = l.y + offsetY * (0.3 + l.depth) * 12;
      const size = l.r * 2;
      for (let k = 0; k < 3; k++) {
        ctx.globalAlpha = l.a * falloff * twinkle * (1 - k * 0.3);
        ctx.drawImage(l.sprite, px - k * l.vx * 2.4 - l.r, py - l.r, size, size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const elapsed = now - last;
    if (elapsed < 1000 / FPS - 2) return;
    last = now;
    // Cap long gaps (a busy main thread, a tab coming back) so lights never jump.
    step(now / 1000, Math.min(elapsed, 100) / BASE_FRAME_MS, FADE);
  };

  const start = () => {
    if (still || raf || !visible || document.hidden) return;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();
  new ResizeObserver(() => resize()).observe(canvas);

  if (still) return;

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start();
    else stop();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener(
      'pointermove',
      (event) => {
        pointerX = event.clientX / window.innerWidth - 0.5;
        pointerY = event.clientY / window.innerHeight - 0.5;
      },
      { passive: true },
    );
  }

  start();
}
