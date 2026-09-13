/**
 * Headline fitting for the expanded display face.
 *
 * Archivo at 125% width runs close to 1em per capital, so a CMS title with one long word
 * ("PRODUCTION", "MISTLETOE") can outgrow a narrow column at its design size and break mid-word.
 * fitStyle() measures the widest unbreakable word in em; the heading then caps its size to its
 * container, so short titles stay big and long words shrink just enough to fit:
 *
 *   <h2 class="title display" style={fitStyle(title)}>…</h2>
 *   .column { container-type: inline-size; }
 *   .title { font-size: min(var(--display-xl), 100cqi / var(--fit, 0.01)); }
 *
 * Advances were measured in Chrome from the self-hosted font at weight 900 (800 is about 1% narrower),
 * uppercase, with the .display letter-spacing included.
 */
const ADVANCE: Record<string, number> = {
  A: 0.942, B: 0.918, C: 0.927, D: 0.921, E: 0.848, F: 0.795, G: 1, H: 0.997, I: 0.383, J: 0.752, K: 0.976, L: 0.774, M: 1.166,
  N: 0.995, O: 0.996, P: 0.853, Q: 0.996, R: 0.931, S: 0.87, T: 0.865, U: 0.977, V: 0.926, W: 1.218, X: 0.949, Y: 0.954, Z: 0.865,
  '0': 0.799, '1': 0.719, '2': 0.797, '3': 0.801, '4': 0.807, '5': 0.801, '6': 0.803, '7': 0.734, '8': 0.816, '9': 0.803,
  '&': 1.053, "'": 0.312, '’': 0.312, '!': 0.379, '?': 0.731, '.': 0.369, ',': 0.369, ':': 0.359, ';': 0.369, '-': 0.404,
  '–': 0.613, '—': 1.238, '/': 0.297, '(': 0.377, ')': 0.377, '#': 0.761, '+': 0.738, '@': 1.228, '$': 0.735, '%': 1.154, '*': 0.419,
};

/** Width of the widest word in `text` set in display caps, in em. Lines may break after hyphens and dashes. */
export function widestWord(text: string): number {
  const words = text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .split(/\s+|(?<=[-–—])/);
  let widest = 0;
  for (const word of words) {
    let width = 0;
    // Unknown glyphs count as a wide capital, so the estimate errs towards smaller type.
    for (const char of word) width += ADVANCE[char] ?? 1;
    widest = Math.max(widest, width);
  }
  return widest;
}

/** Inline style exposing --fit (widest word in em, plus 3% for kerning and rounding) to a display heading. */
export function fitStyle(text: string): string {
  return `--fit:${Math.max(1, widestWord(text) * 1.03).toFixed(2)}`;
}
