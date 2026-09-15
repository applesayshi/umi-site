/**
 * Page backdrop art from the club's graphics: the "Brechella" xerox pieces and the event photo collage.
 *
 * Run with: npm run art            (every piece)
 *           npm run art -- umi-event-art   (just the named pieces)
 *
 * The Brechella originals in src/assets/Art/ are small black-and-white halftones (three are about 200px),
 * so blowing them up in the browser would blur them. This upscales each one, softens the dots slightly and
 * re-thresholds, so it stays a crisp photocopy at any size, then saves it as a white-on-transparent
 * stencil in src/assets/backdrops/. Photo art works the same way at a smaller scale: parts brighter than
 * its grey canvas become ink, fading smoothly through `edge`. The ArtBackdrop component tints the stencils
 * with CSS masks, so the same file can print in any ink colour. Add or replace art: drop the image in
 * src/assets/Art/, add it to PIECES below and to ArtBackdrop.astro, and run this again.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'src/assets/Art');
const OUT = path.join(root, 'src/assets/backdrops');

/**
 * trim: pixels cut from each edge of the original (the scans have thin light borders that would print as lines),
 *   or { top, right, bottom, left } for different amounts, e.g. to cut off a photo's white margins.
 * scale: upscale factor. soften: blur radius in output pixels before thresholding. edge: the grey range that ramps from clear to ink.
 * circle: optional [inner, outer] radius (as a share of the width) to cut a round piece out of its square scan.
 * feather: [inner, outer] radius of the round fade baked into the "-soft" copy, which the Gallery blends into one big print.
 * softSize: longest side of the "-soft" copy, for art that fills the whole screen on its own (default SOFT_SIZE).
 */
const PIECES = [
  { file: 'Brechella1.PNG', name: 'brechella-desk', trim: 4, scale: 6, soften: 2.2, edge: [0.4, 0.6], feather: [0.14, 0.5] },
  { file: 'Brechella2.PNG', name: 'brechella-crowd', trim: 4, scale: 6, soften: 2.2, edge: [0.4, 0.6], feather: [0.14, 0.5] },
  { file: 'Brechella3.PNG', name: 'brechella-guitar', trim: 4, scale: 6, soften: 2.2, edge: [0.4, 0.6], feather: [0.14, 0.5] },
  // The disc's scratches make a busy mask, so it stays under 1000px to keep the file small.
  { file: 'Brechella4.PNG', name: 'brechella-disc', trim: 6, scale: 1.7, soften: 0.7, edge: [0.32, 0.62], circle: [0.47, 0.5], feather: [0.3, 0.5] },
  // The Events page blend. The collage is a 3300×4200 photo montage on a grey canvas (about 43% brightness).
  { file: 'UMI event art.png', name: 'umi-event-art', trim: 0, scale: 1 / 3, soften: 0.6, edge: [0.47, 0.9], feather: [0.36, 0.72], softSize: 1000 },
  // Blue and magenta duotone photos (2160×1620) with white bars top and bottom: a jam session and a studio control room.
  { file: 'IMG_9487.png', name: 'umi-jam-session', trim: { top: 96, right: 4, bottom: 96, left: 4 }, scale: 0.5, soften: 0.6, edge: [0.22, 0.8], feather: [0.3, 0.62], softSize: 900 },
  { file: 'IMG_9487 2.png', name: 'umi-studio', trim: { top: 88, right: 6, bottom: 106, left: 4 }, scale: 0.5, soften: 0.6, edge: [0.1, 0.5], feather: [0.3, 0.62], softSize: 900 },
];

/** Longest side of the "-soft" copies: they print large but faint through a 3px dot screen, so they don't need full detail. */
const SOFT_SIZE = 680;

const smoothstep = (lo, hi, x) => {
  const t = Math.min(1, Math.max(0, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
};

await mkdir(OUT, { recursive: true });

const only = process.argv.slice(2);
for (const piece of PIECES.filter((p) => only.length === 0 || only.includes(p.name))) {
  const meta = await sharp(path.join(SOURCE, piece.file)).metadata();
  const trim = typeof piece.trim === 'number' ? { top: piece.trim, right: piece.trim, bottom: piece.trim, left: piece.trim } : piece.trim;
  const crop = { left: trim.left, top: trim.top, width: meta.width - trim.left - trim.right, height: meta.height - trim.top - trim.bottom };
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
    .resize({ width: piece.softSize ?? SOFT_SIZE, height: piece.softSize ?? SOFT_SIZE, fit: 'inside' })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, `${piece.name}-soft.png`));
  console.log(`${piece.name}-soft.png  ${softResult.width}×${softResult.height}  ${Math.round(softResult.size / 1024)} KB`);
}
