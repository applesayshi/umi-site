/**
 * Pre-renders the film grain and xerox paper speckle as small tiling WebP images.
 * Raster tiles are far cheaper for browsers to paint than live SVG noise filters,
 * which matters on low-end phones. Run with: npm run textures
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/textures');

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

async function grain(size = 180) {
  // Mid-grey luminance noise, fully opaque; the page fades it with CSS opacity.
  const r = rng(42);
  const px = Buffer.alloc(size * size);
  for (let i = 0; i < px.length; i++) {
    const n = (r() + r() + r()) / 3; // soft gaussian-ish
    px[i] = Math.round(40 + n * 175);
  }
  await sharp(px, { raw: { width: size, height: size, channels: 1 } })
    .webp({ quality: 60 })
    .toFile(path.join(out, 'grain.webp'));
}

async function paper(size = 256) {
  // Transparent tile with sparse dark toner specks and faint blotches.
  const r = rng(7);
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    px[o] = 22;
    px[o + 1] = 19;
    px[o + 2] = 15;
    const v = r();
    px[o + 3] = v > 0.985 ? 90 + r() * 110 : v > 0.94 ? 18 + r() * 30 : r() * 10;
  }
  await sharp(px, { raw: { width: size, height: size, channels: 4 } })
    .blur(0.45)
    .webp({ quality: 70, alphaQuality: 70 })
    .toFile(path.join(out, 'paper.webp'));
}

await mkdir(out, { recursive: true });
await grain();
await paper();
console.log('textures written to public/textures');
