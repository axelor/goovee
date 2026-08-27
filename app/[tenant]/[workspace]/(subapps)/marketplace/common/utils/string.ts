/* Stable 32-bit string hash. Same input always produces the same number,
 * which lets callers deterministically pick from a fixed-size list (e.g.
 * a color palette keyed by an arbitrary code). */
export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h);
}
