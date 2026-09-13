/**
 * Brand assets in the "Blue Hour Riso" style.
 *
 * Run with: npm run brand
 *
 * 1. Redraws the club's logo files (src/assets/brand/UMI.PNG and PRODUCEUMI.PNG, small JPEGs on flat
 *    navy) as clean transparent masters about 3x larger: umi-logo.png and produceumi-logo.png.
 *    The site imports those. If the club gets vector originals, replace the masters with them.
 * 2. Builds the favicons, home-screen icons and social share images from them.
 *
 * The tiny favicon keeps a simplified "UMI" wordmark (the full logo is unreadable at 16px). It is drawn
 * from Archivo Expanded outlines embedded below, so the output never depends on installed fonts: the
 * variable font's default (600) master, thickened with a stroke to read like the 900 weight.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(root, 'public');
const BRAND = path.join(root, 'src/assets/brand');

const INK = {
  night: '#070b1f',
  navy: '#01114b', // the navy of the logo files
  peri: '#93a3e6',
  cobalt: '#2c52e0',
  orange: '#ff5a2b',
  pink: '#ff7cc2',
  mint: '#9ef0c9',
  sun: '#ffe45e',
  chalk: '#eef1fa',
  mist: '#a9b1d6',
};

/* ---------------------------------------------------------------- wordmark */
// Archivo Expanded glyph outlines in font units (1000 per em, y up), with their advance widths.
const GLYPHS = {
  U: [944, 'M472 -12Q343 -12 259 28Q174 68 133 142Q91 215 91 315L91 687L243 687L243 322Q243 223 303 169Q362 115 472 115Q582 115 642 169Q701 223 701 322L701 687L853 687L853 315Q853 215 812 142Q770 68 686 28Q602 -12 472 -12Z'],
  M: [1112, 'M97 0L97 687L333 687L490 334Q497 318 509 290Q520 261 533 230Q545 198 555 172L562 172Q571 195 583 225Q595 255 607 284Q619 313 627 332L784 687L1015 687L1015 0L863 0L863 420Q863 437 864 458Q864 479 865 500Q866 520 867 535L859 535Q854 520 846 499Q838 478 830 457Q822 436 815 420L628 0L480 0L292 420Q283 440 275 462Q266 483 260 503Q253 522 248 535L240 535Q241 523 242 504Q242 484 243 463Q243 441 243 420L243 0Z'],
  I: [346, 'M97 0L97 687L249 687L249 0Z'],
  B: [895, 'M97 0L97 687L628 687Q683 687 727 666Q770 644 795 606Q820 568 820 517Q820 478 805 446Q790 414 765 393Q739 371 707 360L707 356Q745 348 775 326Q805 303 822 269Q839 234 839 189Q839 125 811 83Q782 41 735 21Q687 0 628 0ZM249 127L597 127Q635 127 659 146Q683 165 683 206Q683 230 673 249Q663 267 643 277Q623 287 591 287L249 287ZM249 411L579 411Q607 411 626 421Q645 430 655 447Q665 464 665 484Q665 522 643 541Q621 560 585 560L249 560Z'],
  C: [946, 'M488 -12Q349 -12 255 29Q161 69 114 149Q67 228 67 344Q67 514 175 607Q283 699 487 699Q603 699 692 666Q780 633 830 571Q879 509 879 421L730 421Q730 471 699 505Q668 538 613 555Q558 572 484 572Q404 572 346 547Q287 521 255 473Q223 425 223 357L223 332Q223 263 255 215Q287 166 346 141Q405 115 485 115Q562 115 618 132Q673 148 704 182Q734 215 734 264L880 264Q880 178 831 116Q782 54 694 21Q606 -12 488 -12Z'],
  S: [850, 'M432 -12Q354 -12 286 -2Q218 7 167 32Q116 56 88 100Q59 144 59 213Q59 215 59 218Q59 221 60 223L210 223Q209 219 209 214Q208 208 208 201Q208 170 235 151Q262 131 312 122Q362 113 429 113Q458 113 488 116Q517 118 544 123Q571 128 593 137Q614 146 627 160Q639 173 639 191Q639 217 616 233Q592 248 552 258Q512 268 462 275Q412 282 359 291Q305 299 255 314Q205 328 165 351Q125 374 102 411Q78 447 78 500Q78 548 101 585Q124 622 169 648Q214 673 280 686Q345 699 430 699Q516 699 580 685Q644 671 686 645Q728 619 749 583Q769 546 769 501L769 485L621 485L621 498Q621 520 597 537Q573 554 532 564Q491 574 439 574Q367 574 322 565Q277 556 256 541Q235 525 235 506Q235 483 259 469Q282 455 322 447Q362 438 412 431Q462 424 516 415Q569 406 619 392Q669 378 709 355Q749 331 773 296Q796 260 796 208Q796 128 750 80Q704 31 622 10Q540 -12 432 -12Z'],
  N: [965, 'M97 0L97 687L240 687L616 326Q629 315 647 296Q665 277 685 257Q704 237 718 221L726 221Q725 243 724 275Q722 306 722 326L722 687L868 687L868 0L728 0L351 365Q324 391 295 423Q265 454 247 473L240 473Q241 460 242 428Q243 395 243 353L243 0Z'],
  T: [814, 'M331 0L331 553L26 553L26 687L788 687L788 553L483 553L483 0Z'],
  A: [908, 'M24 0L368 687L540 687L884 0L717 0L652 133L245 133L180 0ZM305 256L592 256L512 424Q507 435 498 457Q488 478 479 501Q469 523 462 540Q454 556 453 557L445 557Q436 537 425 511Q413 485 403 461Q392 437 385 423Z'],
  V: [864, 'M346 0L18 687L188 687L367 299Q379 274 391 246Q403 217 414 191Q425 165 432 147L440 147Q447 164 458 190Q468 215 481 244Q493 272 505 298L685 687L846 687L518 0Z'],
  E: [866, 'M97 0L97 687L792 687L792 560L249 560L249 413L732 413L732 286L249 286L249 127L800 127L800 0Z'],
  ' ': [320, ''],
};
const BOLD = 50; // stroke, in font units, that takes the 600 outlines to roughly the 900 weight
const TRACKING = -12; // the site's -0.012em display letter-spacing

/** Lays out `text` as SVG paths in font units (y down, baseline at 0) and returns its ink box. */
function wordmark(text) {
  let x = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const paths = [];
  for (const char of text.toUpperCase()) {
    const glyph = GLYPHS[char];
    if (!glyph) throw new Error(`No outline for "${char}". Add it to GLYPHS.`);
    const [advance, d] = glyph;
    if (d) {
      const nums = d.match(/-?\d+/g).map(Number);
      for (let i = 0; i < nums.length; i += 2) {
        minX = Math.min(minX, x + nums[i]);
        maxX = Math.max(maxX, x + nums[i]);
        minY = Math.min(minY, -nums[i + 1]);
        maxY = Math.max(maxY, -nums[i + 1]);
      }
      paths.push(`<path transform="translate(${x} 0) scale(1 -1)" d="${d}"/>`);
    }
    x += advance + BOLD + TRACKING;
  }
  const pad = BOLD / 2;
  return {
    paths: paths.join(''),
    x0: minX - pad,
    x1: maxX + pad,
    y0: minY - pad,
    y1: maxY + pad,
    get width() {
      return this.x1 - this.x0;
    },
    get height() {
      return this.y1 - this.y0;
    },
  };
}

/** Places a wordmark with its ink box's top-left at (left, top), `width` px wide. */
function placeWordmark(mark, { left, top, width, fill, attrs = '' }) {
  const s = width / mark.width;
  const tx = left - mark.x0 * s;
  const ty = top - mark.y0 * s;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})" fill="${fill}" stroke="${fill}" stroke-width="${BOLD}" stroke-linejoin="miter" ${attrs}>${mark.paths}</g>`;
}

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

/** Pixel-sorted colour bars, like the site's GlitchStrip. */
function glitchStrip(y, width, height, seed) {
  const r = rng(seed);
  const colors = [INK.peri, INK.cobalt, INK.orange, INK.pink, INK.mint, INK.chalk, '#5ec8d6'];
  let x = 0;
  let out = '';
  while (x < width) {
    const w = 8 + r() * 90;
    if (r() > 0.28) {
      const h = height * (0.35 + r() * 0.65);
      out += `<rect x="${x.toFixed(1)}" y="${(y + (height - h) * r()).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${colors[Math.floor(r() * colors.length)]}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
    }
    x += w;
  }
  return out;
}

function pngToIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(32, 0);
  entry.writeUInt8(32, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

/* ---------------------------------------------------------------- logos */
// Upscale, soften the JPEG blocks, then split luminance into flat layers with smooth, crisp edges.
const toLinear = (v) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

async function luminanceMap(file, scale, blur) {
  const input = path.join(BRAND, file);
  const { width, height } = await sharp(input).metadata();
  const W = Math.round(width * scale);
  const H = Math.round(height * scale);
  const { data } = await sharp(input).removeAlpha().resize(W, H, { kernel: 'lanczos3' }).blur(blur).raw().toBuffer({ resolveWithObject: true });
  const L = new Float32Array(W * H);
  for (let i = 0, p = 0; i < L.length; i++, p += 3) {
    L[i] = 0.2126 * toLinear(data[p]) + 0.7152 * toLinear(data[p + 1]) + 0.0722 * toLinear(data[p + 2]);
  }
  return { L, W, H };
}

/** Max filter: grows a 0-1 mask by r pixels in every direction. */
function dilate(mask, W, H, r) {
  const rows = new Float32Array(mask.length);
  const out = new Float32Array(mask.length);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(W - 1, x + r); k++) m = Math.max(m, mask[y * W + k]);
      rows[y * W + x] = m;
    }
  }
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      let m = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(H - 1, y + r); k++) m = Math.max(m, rows[k * W + x]);
      out[y * W + x] = m;
    }
  }
  return out;
}

async function writeLogo(rgba, W, H, name) {
  const png = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  await sharp(png).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toFile(path.join(BRAND, name));
}

async function redrawUmiLogo() {
  const scale = 3;
  const { L, W, H } = await luminanceMap('UMI.PNG', scale, 1.6);
  // Keep the clef clear of the lettering (as the original's knockout does), so no periwinkle clings to letter edges.
  const letters = new Float32Array(L.length);
  for (let i = 0; i < L.length; i++) letters[i] = L[i] > 0.3 ? 1 : 0;
  const knockout = dilate(letters, W, H, Math.round(1.8 * scale));
  const clef = [155, 163, 196];
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0, q = 0; i < L.length; i++, q += 4) {
    const white = smoothstep(0.42, 0.62, L[i]);
    const ink = smoothstep(0.1, 0.2, L[i]) * (1 - knockout[i]) * (1 - white);
    const a = white + ink;
    if (a > 0) for (let c = 0; c < 3; c++) rgba[q + c] = Math.round((255 * white + clef[c] * ink) / a);
    rgba[q + 3] = Math.round(a * 255);
  }
  await writeLogo(rgba, W, H, 'umi-logo.png');
}

async function redrawProduceLogo() {
  const { L, W, H } = await luminanceMap('PRODUCEUMI.PNG', 2.5, 1.3);
  const rgba = Buffer.alloc(W * H * 4, 255);
  for (let i = 0, q = 0; i < L.length; i++, q += 4) rgba[q + 3] = Math.round(smoothstep(0.18, 0.42, L[i]) * 255);
  await writeLogo(rgba, W, H, 'produceumi-logo.png');
}

/** A logo centred on a navy square, for home-screen icons. */
async function logoTile(size, fill = 0.82) {
  const inner = await sharp(path.join(BRAND, 'umi-logo.png'))
    .resize({ width: Math.round(size * fill), height: Math.round(size * fill), fit: 'inside' })
    .png()
    .toBuffer();
  const { width, height } = await sharp(inner).metadata();
  return sharp({ create: { width: size, height: size, channels: 4, background: INK.navy } })
    .composite([{ input: inner, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }])
    .png();
}

const dataUri = (buffer, type = 'image/png') => `data:${type};base64,${buffer.toString('base64')}`;

/* ---------------------------------------------------------------- favicon */
// Logo navy tile, white UMI, and a periwinkle marker squiggle for the clef scribble behind the real logo.
function iconSvg({ rounded = true } = {}) {
  const mark = wordmark('UMI');
  const width = 50;
  const height = mark.height * (width / mark.width);
  const top = 29 - height / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rounded ? 13 : 0}" fill="${INK.navy}"/>
  <path d="M9 46.5c5-4 9 3 14-0.5s9-3.5 14 0 10 2.5 18-1.5" fill="none" stroke="${INK.peri}" stroke-width="3.6" stroke-linecap="round"/>
  ${placeWordmark(mark, { left: 7, top, width, fill: '#ffffff' })}
</svg>`;
}

/* ---------------------------------------------------------------- share image */
async function ogSvg(W, H) {
  const logoWidth = 470;
  const logo = await sharp(path.join(BRAND, 'umi-logo.png')).resize({ width: logoWidth }).png().toBuffer();
  const { height: logoHeight } = await sharp(logo).metadata();
  const left = 76;
  const logoTop = 96;

  // A riso print of a placeholder stage photo: grayscale, then mapped to two inks.
  const photo = await sharp(await readFile(path.join(root, 'src/assets/uploads/placeholders/stage-02.jpg')))
    .resize(560, 420, { fit: 'cover' })
    .grayscale()
    .jpeg({ quality: 80 })
    .toBuffer();
  const hex = (c) => [1, 3, 5].map((i) => (parseInt(c.slice(i, i + 2), 16) / 255).toFixed(3));
  const [dr, dg, db] = hex('#0b1650');
  const [lr, lg, lb] = hex('#a9b7f2');

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="field" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>
    <filter id="glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
    <filter id="duo" color-interpolation-filters="sRGB">
      <feComponentTransfer>
        <feFuncR type="table" tableValues="${dr} ${lr}"/>
        <feFuncG type="table" tableValues="${dg} ${lg}"/>
        <feFuncB type="table" tableValues="${db} ${lb}"/>
      </feComponentTransfer>
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.3" fill="${INK.peri}"/></pattern>
    <pattern id="screen" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.9" fill="#070b1f"/></pattern>
  </defs>

  <rect width="${W}" height="${H}" fill="${INK.night}"/>
  <ellipse cx="${W - 180}" cy="90" rx="460" ry="320" fill="${INK.cobalt}" opacity="0.6" filter="url(#field)"/>
  <ellipse cx="230" cy="${H - 40}" rx="380" ry="170" fill="${INK.orange}" opacity="0.26" filter="url(#field)"/>
  <rect width="${W}" height="${H}" fill="url(#dots)" opacity="0.06"/>

  <text x="${left}" y="66" font-family="'IBM Plex Mono', Consolas, 'Courier New', monospace" font-size="19" letter-spacing="3.5" fill="${INK.mist}">STUDENT-RUN MUSIC CLUB AT UBC</text>

  <image x="${left}" y="${logoTop}" width="${logoWidth}" height="${logoHeight}" filter="url(#glow)" opacity="0.45" xlink:href="${dataUri(logo)}"/>
  <image x="${left}" y="${logoTop}" width="${logoWidth}" height="${logoHeight}" xlink:href="${dataUri(logo)}"/>

  <text x="${left}" y="${logoTop + logoHeight + 52}" font-family="'IBM Plex Mono', Consolas, 'Courier New', monospace" font-size="20" letter-spacing="6" fill="${INK.chalk}">( shows ) — ( open mics ) — ( lessons )</text>

  <g transform="translate(${W - 395} 128) rotate(4)">
    <rect x="-14" y="-14" width="${300 + 28}" height="${226 + 28}" fill="${INK.orange}" transform="translate(12 12)"/>
    <rect x="-14" y="-14" width="${300 + 28}" height="${226 + 28}" fill="#eef0f4"/>
    <image x="0" y="0" width="300" height="226" preserveAspectRatio="xMidYMid slice" filter="url(#duo)" xlink:href="data:image/jpeg;base64,${photo.toString('base64')}"/>
    <rect x="0" y="0" width="300" height="226" fill="url(#screen)" opacity="0.28"/>
    <rect x="96" y="-26" width="110" height="30" fill="#f4efe0" opacity="0.82" transform="rotate(-5 151 -11)"/>
    <text x="286" y="212" text-anchor="end" font-family="Consolas, 'Courier New', monospace" font-size="15" fill="#ff8a4c" letter-spacing="1">’26 09 25</text>
  </g>
  <path d="M${W - 430} 430c38-30 96-34 150-12s94 22 128-8" fill="none" stroke="${INK.orange}" stroke-width="5" stroke-linecap="round"/>

  <g>${glitchStrip(H - 22, W, 22, 5)}</g>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.07"/>
</svg>`;
}

/** Share image for the ProduceUMI pages. */
async function produceOgSvg(W, H) {
  const logoWidth = 520;
  const logo = await sharp(path.join(BRAND, 'produceumi-logo.png')).resize({ width: logoWidth }).png().toBuffer();
  const { height: logoHeight } = await sharp(logo).metadata();
  const left = 70;
  const top = Math.round((H - logoHeight) / 2) - 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="field" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="17"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${INK.night}"/>
  <ellipse cx="${left + logoWidth / 2}" cy="${H / 2}" rx="380" ry="300" fill="${INK.cobalt}" opacity="0.55" filter="url(#field)"/>
  <ellipse cx="${W - 160}" cy="${H - 80}" rx="320" ry="160" fill="${INK.orange}" opacity="0.22" filter="url(#field)"/>
  <image x="${left}" y="${top}" width="${logoWidth}" height="${logoHeight}" filter="url(#glow)" opacity="0.5" xlink:href="${dataUri(logo)}"/>
  <image x="${left}" y="${top}" width="${logoWidth}" height="${logoHeight}" xlink:href="${dataUri(logo)}"/>
  <text x="644" y="258" font-family="'IBM Plex Mono', Consolas, 'Courier New', monospace" font-size="18" letter-spacing="3.5" fill="${INK.orange}">A UMI WORKSHOP</text>
  <text x="640" y="322" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="44" fill="${INK.chalk}">Songs by UBC students,</text>
  <text x="640" y="376" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="44" fill="${INK.peri}">produced with UMI.</text>
  <text x="644" y="440" font-family="'IBM Plex Mono', Consolas, 'Courier New', monospace" font-size="18" letter-spacing="3" fill="${INK.mist}">( write ) — ( record ) — ( release )</text>
  <g>${glitchStrip(H - 22, W, 22, 9)}</g>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.07"/>
</svg>`;
}

/* ---------------------------------------------------------------- render */
async function main() {
  await redrawUmiLogo();
  await redrawProduceLogo();

  const favicon = iconSvg();
  await writeFile(path.join(PUBLIC, 'favicon.svg'), favicon);
  const png32 = await sharp(Buffer.from(favicon)).resize(32, 32).png().toBuffer();
  await writeFile(path.join(PUBLIC, 'favicon.ico'), pngToIco(png32));
  // Home-screen icons are big enough for the full logo. iOS and Android mask their own corners.
  await (await logoTile(180)).toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  await (await logoTile(192)).toFile(path.join(PUBLIC, 'icon-192.png'));
  await (await logoTile(512)).toFile(path.join(PUBLIC, 'icon-512.png'));
  await sharp(Buffer.from(await ogSvg(1200, 630))).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(PUBLIC, 'og-default.jpg'));
  await sharp(Buffer.from(await produceOgSvg(1200, 630))).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(PUBLIC, 'og-produceumi.jpg'));
  console.log('wrote src/assets/brand/umi-logo.png, produceumi-logo.png, favicons, home-screen icons, og-default.jpg, og-produceumi.jpg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
