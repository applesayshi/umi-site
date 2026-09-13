/** Deterministic pseudo-random numbers, so decorative "hand-placed" details
 * (tape angles, torn edges) are stable between builds and never cause hydration drift. */
export function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seeded(seed: string | number) {
  let t = typeof seed === 'number' ? seed >>> 0 : hash(seed);
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random number in [min, max) from a seeded generator. */
export const between = (rand: () => number, min: number, max: number) => min + rand() * (max - min);
