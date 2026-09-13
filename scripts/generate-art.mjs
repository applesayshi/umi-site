/**
 * Page backdrop art from the club's "Brechella" xerox graphics.
 *
 * Run with: npm run art
 *
 * The originals in src/assets/Art/ are small black-and-white halftones (three are about 200px), so
 * blowing them up in the browser would blur them. This upscales each one, softens the dots slightly and
 * re-thresholds, so it stays a crisp photocopy at any size, then saves it as a white-on-transparent
 * stencil in src/assets/backdrops/. The ArtBackdrop component tints the stencils with CSS masks, so the
 * same file can print in any ink colour. Add or replace art: drop the PNG in src/assets/Art/, add it to
 * PIECES below and to ArtBackdrop.astro, and run this again.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'src/assets/Art');
const OUT = path.join(root, 'src/assets/backdrops');

/**
 * trim: pixels cut from each edge of the original (the scans have thin light borders that would print as lines).
 * scale: upscale factor. soften: blur radius in output pixels before thresholding. edge: the grey range that ramps from clear to ink.
 * circle: optional [inner, outer] radius (as a share of the width) to cut a round piece out of its square scan.
 * feather: [inner, outer] radius of the round fade baked into the "-soft" copy, which the Gallery blends into one big print.
 */
const PIECES = [
  { file: 'Brechella1.PNG', name: 'brechella-desk', trim: 4, scale: 6, soften: 2.2, edge: [0.4, 0.6], feather: [0.14, 0.5] },
  { file: 'Brechella2.PNG', name: 'brechella-crowd', trim: 4, scale: 6, soften: 2.2, edge: [0.4, 0.6], feather: [0.14, 0.5] },
  { file: 'Brechella3.PNG', name: 'brechella-guitar', trim: 4, scale: 6, soften: 2.2, edge: [0.4, 0.6], feather: [0.14, 0.5] },
  // The disc's scratches make a busy mask, so it stays under 1000px to keep the file small.
  { file: 'Brechella4.PNG', name: 'brechella-disc', trim: 6, scale: 1.7, soften: 0.7, edge: [0.32, 0.62], circle: [0.47, 0.5], feather: [0.3, 0.5] },
];

/** Longest side of the "-soft" copies: they print large but faint through a 3px dot screen, so they don't need full detail. */
const SOFT_SIZE = 680;

const smoothstep = (lo, hi, x) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

await mkdir(OUT, { recursive: true });

for (const piece of PIECES) {
  const meta = await sharp(path.join(SOURCE, piece.file)).metadata();
  const crop = { left: piece.trim, top: piece.trim, width: meta.width - piece.trim * 2, height: meta.height - piece.trim * 2 };
  const width = Math.round(crop.width * piece.scale);
  const height = Math.round(crop.height * piece.scale);
  const { data, info } = await sharp(path.join(SOURCE, piece.file))
    .extract(crop)
    .flatten({ background: '#000000' })
    .toColourspace('b-w')
    .resize(width, height, { kernel: 'lanczos3' })
    .blur(piece.soften)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const stencil = Buffer.alloc(info.width * info.height * 4);
  const soft = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = Math.hypot((i % info.width) / info.width - 0.5, Math.floor(i / info.width) / info.height - 0.5);
    let alpha = smoothstep(piece.edge[0], piece.edge[1], data[i * info.channels] / 255);
    if (piece.circle) alpha *= 1 - smoothstep(piece.circle[0], piece.circle[1], r);
    const faded = alpha * (1 - smoothstep(piece.feather[0], piece.feather[1], r));
    for (const [buffer, value] of [
      [stencil, alpha],
      [soft, faded],
    ]) {
      buffer[i * 4] = 255;
      buffer[i * 4 + 1] = 255;
      buffer[i * 4 + 2] = 255;
      buffer[i * 4 + 3] = Math.round(value * 255);
    }
  }

  const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
  const result = await sharp(stencil, raw).png({ compressionLevel: 9 }).toFile(path.join(OUT, `${piece.name}.png`));
  console.log(`${piece.name}.png  ${info.width}×${info.height}  ${Math.round(result.size / 1024)} KB`);
  const softResult = await sharp(soft, raw)
    .resize({ width: SOFT_SIZE, height: SOFT_SIZE, fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${piece.name}-soft.png`));
  console.log(`${piece.name}-soft.png  ${softResult.width}×${softResult.height}  ${Math.round(softResult.size / 1024)} KB`);
}
