/**
 * Whether `url` lands on `base`'s origin, for deciding if an address supplied
 * with a request may be redirected to.
 *
 * A relative `url` is resolved against `base` and so is always on it. Anything
 * neither absolute nor resolvable — `base` not being an absolute URL included —
 * counts as a different origin, so an unreadable address is refused rather than
 * followed.
 *
 * Compares the whole origin — scheme and port included — so the same host
 * reached over `http`, or on another port, is not the `https` deployment.
 */
export function isSameOrigin(url: string, base: string): boolean {
  try {
    const target = new URL(url, base);
    const baseUrl = new URL(base);
    return target.origin === baseUrl.origin;
  } catch {
    return false;
  }
}
