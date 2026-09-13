/**
 * Generates atmospheric placeholder imagery (flash-lit gig photos, portraits,
 * album-cover art). Favicons and the share image come from generate-brand.mjs.
 *
 * Run with: npm run placeholders
 *
 * Everything is procedural SVG rendered by sharp, so there are no third-party
 * photos to license. Replace the images through the CMS when real photos exist.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'src/assets/uploads/placeholders');

/* ---------------------------------------------------------------- helpers */
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Number(n.toFixed(1));
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

const NEON = ['#ff4a3d', '#52e394', '#ffd23f', '#ff8b1f', '#6fe3ff'];
const CASTS = {
  amber: { key: '#ffb45c', glow: '#ff7a1a', shadow: '#1d1006', grade: [1.1, 0.97, 0.76] },
  green: { key: '#8dffc0', glow: '#23c872', shadow: '#03140c', grade: [0.8, 1.06, 0.88] },
  red: { key: '#ff7466', glow: '#ff2d20', shadow: '#1d0605', grade: [1.12, 0.84, 0.82] },
  teal: { key: '#7fe6ff', glow: '#16a9cc', shadow: '#02131a', grade: [0.8, 0.98, 1.08] },
  yellow: { key: '#ffe486', glow: '#ffbf1a', shadow: '#191206', grade: [1.07, 1.02, 0.78] },
};

function defs(W, _H, cast, seed) {
  const [gr, gg, gb] = cast.grade;
  return `<defs>
  <filter id="bxl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(W / 30)}"/></filter>
  <filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(W / 75)}"/></filter>
  <filter id="bm" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(W / 220)}"/></filter>
  <filter id="bs" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${f(W / 700)}"/></filter>
  <filter id="grade" x="0" y="0" width="100%" height="100%">
    <feColorMatrix type="matrix" values="${gr} 0.04 0 0 0.012  0 ${gg} 0.03 0 0.01  0.02 0 ${gb} 0 0.014  0 0 0 1 0"/>
  </filter>
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${W > 1400 ? 0.85 : 0.95}" numOctaves="2" seed="${seed}"/>
    <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1"/>
  </filter>
  <radialGradient id="vignette" cx="50%" cy="48%" r="72%">
    <stop offset="52%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.82"/>
  </radialGradient>
  <radialGradient id="flash" cx="50%" cy="42%" r="58%">
    <stop offset="0%" stop-color="#fff6e4" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="#fff6e4" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="leak" x1="0" y1="0" x2="1" y2="0.35">
    <stop offset="0" stop-color="#ff4e12" stop-opacity="0.62"/>
    <stop offset="0.3" stop-color="#ff9a3c" stop-opacity="0.2"/>
    <stop offset="0.55" stop-color="#ff9a3c" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${cast.key}" stop-opacity="0.8"/>
    <stop offset="1" stop-color="${cast.key}" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${cast.shadow}"/>
    <stop offset="1" stop-color="#030202"/>
  </linearGradient>
</defs>`;
}

function finish(W, H, r, { flash = r() > 0.55, leak = r() > 0.35 } = {}) {
  const flip = r() > 0.5 ? ` transform="translate(${W} 0) scale(-1 1)"` : '';
  return `
  ${flash ? `<rect width="${W}" height="${H}" fill="url(#flash)" style="mix-blend-mode:screen"/>` : ''}
  ${leak ? `<rect width="${W}" height="${H}" fill="url(#leak)" style="mix-blend-mode:screen"${flip}/>` : ''}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.16" style="mix-blend-mode:overlay"/>`;
}

function svg(W, H, cast, seed, body, opts) {
  const r = rng(seed * 7 + 3);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${defs(W, H, cast, seed)}
  <g filter="url(#grade)">
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    ${body}
  </g>
  ${finish(W, H, r, opts)}
</svg>`;
}

/* ---------------------------------------------------------- scene parts */
function bokeh(W, H, r, { count = 20, colors = NEON, minR = 8, maxR = 60, y0 = 0, y1 = 1, o0 = 0.25, o1 = 0.8, blur = 'bm' } = {}) {
  let s = `<g filter="url(#${blur})" style="mix-blend-mode:screen">`;
  for (let i = 0; i < count; i++) {
    s += `<circle cx="${f(r() * W)}" cy="${f((y0 + r() * (y1 - y0)) * H)}" r="${f(minR + r() * (maxR - minR))}" fill="${pick(r, colors)}" fill-opacity="${(o0 + r() * (o1 - o0)).toFixed(2)}"/>`;
  }
  return s + '</g>';
}

function beams(W, H, r, n = 3) {
  let s = `<g filter="url(#bl)" style="mix-blend-mode:screen">`;
  for (let i = 0; i < n; i++) {
    const x = W * (0.12 + r() * 0.76);
    const spread = W * (0.1 + r() * 0.16);
    const tilt = (r() - 0.5) * W * 0.4;
    s += `<polygon points="${f(x - 10)},-20 ${f(x + 10)},-20 ${f(x + tilt + spread)},${H} ${f(x + tilt - spread)},${H}" fill="url(#beam)" opacity="${(0.3 + r() * 0.35).toFixed(2)}"/>`;
  }
  return s + '</g>';
}

function haze(cx, cy, rx, ry, color, o = 0.4) {
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${color}" opacity="${o}" filter="url(#bxl)" style="mix-blend-mode:screen"/>`;
}

function bust(cx, groundY, h, { color = '#070505', rim = '#ffd9a0', hair = 0, rimO = 0.55 } = {}) {
  const hr = h * 0.078;
  const hy = groundY - h + hr * 1.15;
  const sy = hy + hr * 2.3;
  const body = `M ${f(cx - hr * 3.4)} ${f(groundY + 4)} L ${f(cx - hr * 3.15)} ${f(sy + hr * 1.5)} Q ${f(cx - hr * 2.9)} ${f(sy)} ${f(cx - hr * 0.95)} ${f(sy - hr * 0.25)} L ${f(cx - hr * 0.58)} ${f(hy + hr * 1.15)} L ${f(cx + hr * 0.58)} ${f(hy + hr * 1.15)} L ${f(cx + hr * 0.95)} ${f(sy - hr * 0.25)} Q ${f(cx + hr * 2.9)} ${f(sy)} ${f(cx + hr * 3.15)} ${f(sy + hr * 1.5)} L ${f(cx + hr * 3.4)} ${f(groundY + 4)} Z`;
  const hairShapes = [
    `<ellipse cx="${f(cx)}" cy="${f(hy - hr * 0.2)}" rx="${f(hr * 1.02)}" ry="${f(hr * 1.08)}"/>`,
    `<circle cx="${f(cx + hr * 0.2)}" cy="${f(hy - hr * 1.35)}" r="${f(hr * 0.55)}"/>`,
    `<path d="M ${f(cx - hr * 1.05)} ${f(hy - hr * 0.1)} Q ${f(cx - hr * 1.3)} ${f(sy + hr * 0.8)} ${f(cx - hr * 1.9)} ${f(sy + hr * 1.6)} L ${f(cx + hr * 1.9)} ${f(sy + hr * 1.6)} Q ${f(cx + hr * 1.3)} ${f(sy + hr * 0.8)} ${f(cx + hr * 1.05)} ${f(hy - hr * 0.1)} Z"/>`,
    [0, 1, 2, 3, 4, 5, 6].map((k) => `<circle cx="${f(cx + Math.cos((k / 6) * Math.PI + Math.PI) * hr * 0.9)}" cy="${f(hy - hr * 0.35 + Math.sin((k / 6) * Math.PI + Math.PI) * hr * 0.8)}" r="${f(hr * 0.48)}"/>`).join(''),
  ];
  const head = `<ellipse cx="${f(cx)}" cy="${f(hy)}" rx="${f(hr * 0.93)}" ry="${f(hr * 1.14)}"/>`;
  const shape = `${hairShapes[hair % hairShapes.length]}${head}<path d="${body}"/>`;
  // Backlight: a blurred, rim-coloured copy of the silhouette glows around its edges.
  const halo = rimO > 0 ? `<g fill="${rim}" opacity="${rimO}" filter="url(#bm)" style="mix-blend-mode:screen" transform="translate(0 ${f(-hr * 0.12)})">${shape}</g>` : '';
  return `${halo}<g fill="${color}">${shape}</g>`;
}

function crowd(W, H, r, { count = 16, base = H, scale = 1, color = '#050404', phones = 3, blur = '' } = {}) {
  let s = `<g fill="${color}"${blur ? ` filter="url(#${blur})"` : ''}>`;
  const heads = [];
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.5) / count) * W + (r() - 0.5) * (W / count) * 0.9;
    const hr = (30 + r() * 18) * scale;
    const y = base - hr * 2.4 - r() * hr * 1.3;
    s += `<ellipse cx="${f(x)}" cy="${f(y + hr * 3)}" rx="${f(hr * 2.3)}" ry="${f(hr * 1.7)}"/>`;
    s += `<rect x="${f(x - hr * 0.45)}" y="${f(y + hr * 0.6)}" width="${f(hr * 0.9)}" height="${f(hr * 1.8)}"/>`;
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(hr)}" ry="${f(hr * 1.12)}"/>`;
    heads.push([x, y, hr]);
  }
  s += `<rect x="0" y="${f(base)}" width="${W}" height="${f(H - base + 20)}"/></g>`;
  for (let k = 0; k < phones; k++) {
    const [x, y, hr] = pick(r, heads);
    const ang = f((r() - 0.5) * 34);
    const len = hr * 4.4;
    s += `<g transform="translate(${f(x + hr * 1.1)} ${f(y + hr * 1.6)}) rotate(${ang})">
      <rect x="${f(-hr * 0.28)}" y="${f(-len)}" width="${f(hr * 0.56)}" height="${f(len)}" rx="${f(hr * 0.28)}" fill="${color}"/>
      <rect x="${f(-hr * 0.6)}" y="${f(-len - hr * 1.5)}" width="${f(hr * 1.2)}" height="${f(hr * 1.8)}" fill="#cfe7ff" opacity="0.4" filter="url(#bm)" style="mix-blend-mode:screen"/>
      <rect x="${f(-hr * 0.36)}" y="${f(-len - hr * 1.2)}" width="${f(hr * 0.72)}" height="${f(hr * 1.2)}" rx="${f(hr * 0.1)}" fill="#e8f4ff" opacity="0.9"/>
    </g>`;
  }
  return s;
}

function micStand(x, topY, bottomY, s = 1, color = '#050404') {
  return `<g stroke="${color}" stroke-linecap="round" fill="${color}">
    <line x1="${f(x)}" y1="${f(bottomY)}" x2="${f(x)}" y2="${f(topY)}" stroke-width="${f(9 * s)}"/>
    <line x1="${f(x)}" y1="${f(topY)}" x2="${f(x - 80 * s)}" y2="${f(topY - 34 * s)}" stroke-width="${f(7 * s)}"/>
    <rect x="${f(x - 128 * s)}" y="${f(topY - 62 * s)}" width="${f(62 * s)}" height="${f(28 * s)}" rx="${f(14 * s)}" transform="rotate(-22 ${f(x - 97 * s)} ${f(topY - 48 * s)})" stroke="none"/>
  </g>`;
}

/* ---------------------------------------------------------------- scenes */
const scenes = {
  mic(W, H, r, c) {
    return `${beams(W, H, r, 3)}
    ${haze(W * 0.55, H * 0.35, W * 0.4, H * 0.3, c.glow, 0.35)}
    ${bokeh(W, H, r, { count: 26, y1: 0.55, maxR: 40, blur: 'bm' })}
    ${bust(W * 0.58, H + 30, H * 0.8, { rim: c.key, hair: Math.floor(r() * 4), rimO: 0.7 })}
    ${micStand(W * 0.47, H * 0.42, H + 20, H / 1000, '#020101')}
    ${crowd(W, H, r, { count: 7, base: H + 90, scale: 2.6, phones: 0, blur: 'bl' })}`;
  },
  crowd(W, H, r, c) {
    return `${haze(W * 0.5, H * 0.42, W * 0.5, H * 0.3, c.glow, 0.55)}
    ${beams(W, H, r, 4)}
    ${bokeh(W, H, r, { count: 16, y1: 0.22, minR: 10, maxR: 34, o0: 0.5, o1: 1, blur: 'bs', colors: [c.key, '#ffffff', c.key] })}
    <rect x="0" y="${f(H * 0.62)}" width="${W}" height="${f(H * 0.08)}" fill="#0b0806"/>
    ${bust(W * 0.42, H * 0.63, H * 0.27, { rim: c.key, hair: 2 })}
    ${bust(W * 0.61, H * 0.63, H * 0.24, { rim: c.key, hair: 0 })}
    ${micStand(W * 0.39, H * 0.46, H * 0.63, H / 3400)}
    ${crowd(W, H, r, { count: 15, base: H * 1.02, scale: H / 800, phones: 3 })}`;
  },
  keys(W, H, r, c) {
    const keyW = W / 17;
    let white = '';
    let black = '';
    for (let i = 0; i < 24; i++) {
      const x = i * keyW;
      white += `<rect x="${f(x + 2)}" y="0" width="${f(keyW - 4)}" height="${f(H * 0.62)}" rx="6" fill="url(#ivory)"/>`;
      const n = i % 7;
      if (n !== 2 && n !== 6) black += `<rect x="${f(x + keyW * 0.68)}" y="0" width="${f(keyW * 0.62)}" height="${f(H * 0.38)}" rx="5" fill="#080606"/>`;
    }
    return `<defs><linearGradient id="ivory" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b645a"/><stop offset="0.7" stop-color="#d9d0bf"/><stop offset="1" stop-color="#f3eadb"/></linearGradient></defs>
    ${haze(W * 0.2, H * 0.3, W * 0.45, H * 0.4, c.glow, 0.55)}
    <g transform="translate(${f(-W * 0.12)} ${f(H * 0.3)}) rotate(-9) skewX(-24)">
      <g filter="url(#bs)">${white}${black}</g>
      <rect x="0" y="${f(H * 0.62)}" width="${f(keyW * 24)}" height="${f(H * 0.5)}" fill="#0c0908"/>
    </g>
    ${bokeh(W, H, r, { count: 14, y1: 0.35, maxR: 80, blur: 'bl' })}
    ${haze(W * 0.85, H * 0.9, W * 0.3, H * 0.2, c.key, 0.3)}`;
  },
  amp(W, H, r, c) {
    const x = W * 0.2;
    const y = H * 0.16;
    const w = W * 0.5;
    const h = H * 0.76;
    let grille = '';
    for (let gx = 0; gx < 34; gx++) {
      for (let gy = 0; gy < 20; gy++) {
        grille += `<circle cx="${f(x + w * 0.08 + gx * (w * 0.84 / 33))}" cy="${f(y + h * 0.24 + gy * (h * 0.66 / 19))}" r="${f(w / 180)}" fill="#000" opacity="0.55"/>`;
      }
    }
    let knobs = '';
    for (let k = 0; k < 7; k++) {
      const kx = x + w * 0.16 + k * (w * 0.68 / 6);
      knobs += `<circle cx="${f(kx)}" cy="${f(y + h * 0.105)}" r="${f(w * 0.028)}" fill="#0d0b09" stroke="${c.key}" stroke-opacity="0.45" stroke-width="3"/>`;
    }
    return `<rect x="0" y="0" width="${W}" height="${H}" fill="#0b0907"/>
    ${haze(W * 0.9, H * 0.3, W * 0.35, H * 0.5, c.glow, 0.5)}
    <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="18" fill="#17120e"/>
    <rect x="${f(x + w * 0.05)}" y="${f(y + h * 0.2)}" width="${f(w * 0.9)}" height="${f(h * 0.74)}" rx="10" fill="#2a231c"/>
    ${grille}
    <circle cx="${f(x + w * 0.5)}" cy="${f(y + h * 0.57)}" r="${f(h * 0.28)}" fill="none" stroke="#000" stroke-opacity="0.35" stroke-width="10"/>
    ${knobs}
    <rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="18" fill="none" stroke="${c.key}" stroke-opacity="0.35" stroke-width="4" filter="url(#bs)"/>
    <path d="M ${f(x + w * 0.9)} ${f(y + h)} C ${f(W * 0.8)} ${f(H * 1.02)}, ${f(W * 0.86)} ${f(H * 0.7)}, ${f(W * 1.05)} ${f(H * 0.82)}" fill="none" stroke="#040303" stroke-width="16"/>
    ${bokeh(W, H, r, { count: 10, y0: 0.05, y1: 0.4, x: 0, maxR: 50, blur: 'bl' })}`;
  },
  neon(W, H, r, c) {
    let streaks = '';
    for (let i = 0; i < 20; i++) {
      const x = r() * W;
      const y = H * (0.12 + r() * 0.7);
      const rad = 10 + r() * 46;
      const col = pick(r, NEON);
      for (let k = 0; k < 5; k++) {
        streaks += `<circle cx="${f(x - k * rad * 0.9)}" cy="${f(y)}" r="${f(rad)}" fill="${col}" fill-opacity="${(0.75 - k * 0.14).toFixed(2)}"/>`;
      }
    }
    let signs = '';
    for (let i = 0; i < 5; i++) {
      const sx = r() * W;
      const sy = H * (0.05 + r() * 0.3);
      const col = pick(r, NEON);
      const sw = 40 + r() * 70;
      const sh = 160 + r() * 260;
      signs += `<rect x="${f(sx)}" y="${f(sy)}" width="${f(sw)}" height="${f(sh)}" rx="10" fill="none" stroke="${col}" stroke-width="7" opacity="0.85"/>
      <rect x="${f(sx)}" y="${f(sy)}" width="${f(sw)}" height="${f(sh)}" rx="10" fill="none" stroke="${col}" stroke-width="30" opacity="0.4" filter="url(#bm)"/>`;
    }
    let rain = '';
    for (let i = 0; i < 70; i++) {
      const rx = r() * W;
      const ry = r() * H;
      rain += `<line x1="${f(rx)}" y1="${f(ry)}" x2="${f(rx - 26)}" y2="${f(ry + 90)}" stroke="#dcecff" stroke-opacity="0.09" stroke-width="2"/>`;
    }
    let walker = '';
    for (let k = 3; k >= 0; k--) {
      walker += `<g opacity="${(1 - k * 0.24).toFixed(2)}">${bust(W * 0.52 - k * W * 0.035, H + 20, H * 0.72, { color: '#050507', rim: c.key, hair: 2, rimO: 0.35 })}</g>`;
    }
    return `<g style="mix-blend-mode:screen" filter="url(#bl)">${streaks}</g>
    <g style="mix-blend-mode:screen">${signs}</g>
    ${haze(W * 0.5, H * 0.5, W * 0.6, H * 0.35, c.glow, 0.25)}
    <g filter="url(#bs)">${walker}</g>
    ${rain}`;
  },
  drums(W, H, r, c) {
    const rimS = `stroke="${c.key}" stroke-opacity="0.5" stroke-width="5"`;
    return `${beams(W, H, r, 3)}
    ${haze(W * 0.5, H * 0.3, W * 0.45, H * 0.25, c.glow, 0.4)}
    ${bokeh(W, H, r, { count: 18, y1: 0.25, maxR: 30, blur: 'bs', o0: 0.5, o1: 1 })}
    <g stroke="#050404" stroke-width="8">
      <line x1="${f(W * 0.22)}" y1="${f(H * 0.36)}" x2="${f(W * 0.25)}" y2="${H}"/>
      <line x1="${f(W * 0.8)}" y1="${f(H * 0.33)}" x2="${f(W * 0.76)}" y2="${H}"/>
    </g>
    <ellipse cx="${f(W * 0.22)}" cy="${f(H * 0.36)}" rx="${f(W * 0.1)}" ry="${f(H * 0.02)}" fill="${c.key}" opacity="0.55" filter="url(#bs)"/>
    <ellipse cx="${f(W * 0.8)}" cy="${f(H * 0.33)}" rx="${f(W * 0.11)}" ry="${f(H * 0.022)}" fill="${c.key}" opacity="0.6" filter="url(#bs)"/>
    <circle cx="${f(W * 0.5)}" cy="${f(H * 0.84)}" r="${f(H * 0.26)}" fill="#0a0807" ${rimS}/>
    <circle cx="${f(W * 0.5)}" cy="${f(H * 0.84)}" r="${f(H * 0.2)}" fill="#120e0b"/>
    <rect x="${f(W * 0.4)}" y="${f(H * 0.5)}" width="${f(W * 0.085)}" height="${f(H * 0.13)}" fill="#0b0908" ${rimS}/>
    <ellipse cx="${f(W * 0.4425)}" cy="${f(H * 0.5)}" rx="${f(W * 0.0425)}" ry="${f(H * 0.025)}" fill="#1a1411" ${rimS}/>
    <rect x="${f(W * 0.515)}" y="${f(H * 0.49)}" width="${f(W * 0.095)}" height="${f(H * 0.14)}" fill="#0b0908" ${rimS}/>
    <ellipse cx="${f(W * 0.5625)}" cy="${f(H * 0.49)}" rx="${f(W * 0.0475)}" ry="${f(H * 0.027)}" fill="#1a1411" ${rimS}/>
    <rect x="${f(W * 0.24)}" y="${f(H * 0.66)}" width="${f(W * 0.1)}" height="${f(H * 0.1)}" fill="#0b0908" ${rimS}/>
    <ellipse cx="${f(W * 0.29)}" cy="${f(H * 0.66)}" rx="${f(W * 0.05)}" ry="${f(H * 0.024)}" fill="#1a1411" ${rimS}/>
    <rect x="${f(W * 0.66)}" y="${f(H * 0.64)}" width="${f(W * 0.12)}" height="${f(H * 0.22)}" fill="#0b0908" ${rimS}/>
    <ellipse cx="${f(W * 0.72)}" cy="${f(H * 0.64)}" rx="${f(W * 0.06)}" ry="${f(H * 0.028)}" fill="#1a1411" ${rimS}/>
    ${[0, 1, 2].map((k) => `<rect x="${f(W * 0.44 - k * 26)}" y="${f(H * 0.18)}" width="10" height="${f(H * 0.3)}" rx="5" fill="#d9cdb6" opacity="${(0.7 - k * 0.22).toFixed(2)}" transform="rotate(${-28 - k * 6} ${f(W * 0.44)} ${f(H * 0.48)})"/>`).join('')}`;
  },
  guitar(W, H, r, c) {
    let frets = '';
    let pos = W * 0.12;
    for (let i = 0; i < 16; i++) {
      frets += `<line x1="${f(pos)}" y1="${f(H * 0.44)}" x2="${f(pos)}" y2="${f(H * 0.56)}" stroke="#cbbfa9" stroke-opacity="0.65" stroke-width="6"/>`;
      if ([2, 4, 6, 8, 11].includes(i)) frets += `<circle cx="${f(pos + W * 0.035)}" cy="${f(H * 0.5)}" r="9" fill="#e6dccb" opacity="0.5"/>`;
      pos += W * (0.085 - i * 0.003);
    }
    let strings = '';
    for (let s = 0; s < 6; s++) {
      strings += `<line x1="${f(-W * 0.05)}" y1="${f(H * (0.452 + s * 0.019))}" x2="${f(W * 1.1)}" y2="${f(H * (0.452 + s * 0.019))}" stroke="#f1e8d8" stroke-opacity="0.75" stroke-width="${f(1.6 + s * 0.5)}"/>`;
    }
    return `${haze(W * 0.75, H * 0.2, W * 0.4, H * 0.3, c.glow, 0.55)}
    <g transform="rotate(-18 ${f(W / 2)} ${f(H / 2)})">
      <rect x="${f(-W * 0.1)}" y="${f(H * 0.43)}" width="${f(W * 1.3)}" height="${f(H * 0.14)}" fill="#1d130c"/>
      <rect x="${f(-W * 0.1)}" y="${f(H * 0.43)}" width="${f(W * 1.3)}" height="${f(H * 0.02)}" fill="${c.key}" opacity="0.35" filter="url(#bs)"/>
      ${frets}${strings}
    </g>
    ${bokeh(W, H, r, { count: 12, maxR: 90, blur: 'bl', o0: 0.2, o1: 0.5 })}`;
  },
  hall(W, H, r, c) {
    let folds = '';
    for (let i = 0; i < 26; i++) {
      folds += `<rect x="${f((i / 26) * W)}" y="0" width="${f(W / 52)}" height="${f(H * 0.62)}" fill="#000" opacity="${(0.25 + r() * 0.25).toFixed(2)}"/>`;
    }
    let seats = '';
    for (let row = 0; row < 3; row++) {
      const y = H * (0.84 + row * 0.07);
      const n = 11 + row * 2;
      for (let i = 0; i < n; i++) {
        const sw = W / n;
        seats += `<rect x="${f(i * sw + sw * 0.06)}" y="${f(y)}" width="${f(sw * 0.88)}" height="${f(H * 0.2)}" rx="${f(sw * 0.2)}" fill="#050404"/>`;
      }
    }
    return `<rect x="0" y="0" width="${W}" height="${f(H * 0.62)}" fill="#2a0e0b"/>${folds}
    <rect x="0" y="${f(H * 0.6)}" width="${W}" height="${f(H * 0.4)}" fill="#120b07"/>
    ${haze(W * 0.5, H * 0.66, W * 0.22, H * 0.08, c.key, 0.8)}
    ${beams(W, H, r, 1)}
    ${micStand(W * 0.5, H * 0.46, H * 0.66, H / 2200)}
    ${seats}`;
  },
};

function portrait(W, H, seed, castName) {
  const r = rng(seed);
  const c = CASTS[castName];
  const hair = Math.floor(r() * 4);
  const cx = W * (0.46 + r() * 0.08);
  return svg(W, H, c, seed, `
    <rect width="${W}" height="${H}" fill="${c.glow}" opacity="0.28"/>
    ${haze(W * 0.5, H * 0.38, W * 0.45, H * 0.35, c.key, 0.7)}
    <g opacity="0.5" filter="url(#bl)" transform="translate(${f(W * 0.07)} ${f(H * 0.035)})">${bust(cx, H + 20, H * 0.78, { color: '#000', rimO: 0, hair })}</g>
    ${bust(cx, H + 20, H * 0.78, { color: '#0d0907', rim: '#fff3dc', hair, rimO: 0.45 })}
  `);
}

function cover(W, seed, variant) {
  const r = rng(seed);
  const c = CASTS[pick(r, Object.keys(CASTS))];
  const H = W;
  const bodies = {
    sun: `<rect width="${W}" height="${H}" fill="#120806"/>
      <circle cx="${W / 2}" cy="${f(H * 0.46)}" r="${f(W * 0.28)}" fill="${c.key}"/>
      ${[0, 1, 2, 3, 4, 5, 6].map((k) => `<rect x="0" y="${f(H * 0.5 + k * k * 7)}" width="${W}" height="${f(6 + k * 3)}" fill="#120806"/>`).join('')}
      ${haze(W / 2, H * 0.46, W * 0.4, W * 0.4, c.glow, 0.5)}`,
    smear: (() => {
      let s = `<rect width="${W}" height="${H}" fill="#050506"/><g style="mix-blend-mode:screen" filter="url(#bm)">`;
      for (let i = 0; i < 14; i++) {
        const y = H * (0.1 + r() * 0.8);
        const x = r() * W;
        const col = pick(r, NEON);
        for (let k = 0; k < 7; k++) s += `<rect x="${f(x - k * 38)}" y="${f(y)}" width="${f(60 + r() * 80)}" height="${f(10 + r() * 26)}" rx="12" fill="${col}" opacity="${(0.85 - k * 0.11).toFixed(2)}"/>`;
      }
      return s + '</g>';
    })(),
    halftone: (() => {
      let s = `<rect width="${W}" height="${H}" fill="${c.shadow}"/>`;
      const step = W / 38;
      for (let gx = 0; gx < 39; gx++) {
        for (let gy = 0; gy < 39; gy++) {
          const dx = gx * step - W * 0.55;
          const dy = gy * step - H * 0.45;
          const d = Math.sqrt(dx * dx + dy * dy) / (W * 0.55);
          const rad = Math.max(0, (1 - d) * step * 0.55);
          if (rad > 0.4) s += `<circle cx="${f(gx * step)}" cy="${f(gy * step)}" r="${f(rad)}" fill="${c.key}"/>`;
        }
      }
      return s;
    })(),
    stripes: `<rect width="${W}" height="${H}" fill="#ece3d1"/>
      <g transform="rotate(-35 ${W / 2} ${H / 2})">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((k) => `<rect x="${f(-W * 0.3)}" y="${f(-H * 0.3 + k * H * 0.16)}" width="${f(W * 1.6)}" height="${f(H * 0.07)}" fill="${k % 3 === 0 ? '#ff4a3d' : '#141210'}"/>`).join('')}</g>
      <rect x="${f(W * 0.62)}" y="${f(H * 0.68)}" width="${f(W * 0.26)}" height="${f(H * 0.14)}" fill="#ffd23f" transform="rotate(-6 ${f(W * 0.75)} ${f(H * 0.75)})"/>`,
    flash: `<rect width="${W}" height="${H}" fill="#060505"/>
      ${haze(W * 0.5, H * 0.45, W * 0.2, W * 0.2, '#ffffff', 0.9)}
      <circle cx="${W / 2}" cy="${f(H * 0.45)}" r="${f(W * 0.05)}" fill="#fffaf0"/>
      ${bust(W * 0.5, H + 10, H * 0.55, { color: '#050404', rim: '#ffffff', hair: 1, rimO: 0.5 })}`,
    grid: (() => {
      let s = `<rect width="${W}" height="${H}" fill="#0a0908"/>`;
      const cell = W / 3;
      for (let i = 0; i < 9; i++) {
        const col = pick(r, [...NEON, '#efe8da', '#1d1a16']);
        s += `<rect x="${f((i % 3) * cell + 10)}" y="${f(Math.floor(i / 3) * cell + 10)}" width="${f(cell - 20)}" height="${f(cell - 20)}" fill="${col}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
      }
      return s;
    })(),
  };
  return svg(W, H, c, seed, bodies[variant], { flash: variant === 'flash', leak: r() > 0.5 });
}

/* ---------------------------------------------------------------- render */
async function render(name, svgString, { quality = 82 } = {}) {
  const file = path.join(OUT, `${name}.jpg`);
  await sharp(Buffer.from(svgString)).jpeg({ quality, mozjpeg: true }).toFile(file);
  console.log('  wrote', path.relative(root, file));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const W = 1800;
  const H = 1200;
  const stage = [
    ['stage-01', 'mic', 'amber', 11],
    ['stage-02', 'crowd', 'red', 12],
    ['stage-03', 'neon', 'green', 13],
    ['stage-04', 'keys', 'teal', 14],
    ['stage-05', 'amp', 'amber', 15],
    ['stage-06', 'drums', 'yellow', 16],
    ['stage-07', 'guitar', 'red', 17],
    ['stage-08', 'hall', 'amber', 18],
    ['stage-09', 'mic', 'green', 19],
    ['stage-10', 'crowd', 'teal', 20],
    ['stage-11', 'neon', 'red', 21],
    ['stage-12', 'mic', 'red', 22],
  ];
  for (const [name, scene, cast, seed] of stage) {
    const r = rng(seed);
    await render(name, svg(W, H, CASTS[cast], seed, scenes[scene](W, H, r, CASTS[cast])));
  }

  const casts = ['amber', 'green', 'red', 'teal', 'yellow'];
  for (let i = 1; i <= 10; i++) {
    await render(`portrait-${String(i).padStart(2, '0')}`, portrait(1080, 1350, 100 + i, casts[i % casts.length]));
  }

  const variants = ['sun', 'smear', 'halftone', 'stripes', 'flash', 'grid'];
  for (let i = 0; i < variants.length; i++) {
    await render(`cover-${String(i + 1).padStart(2, '0')}`, cover(1200, 300 + i, variants[i]));
  }
  // Favicons and the social share image live in generate-brand.mjs.
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
