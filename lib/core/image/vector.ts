/**
 * Whether an address names a vector image.
 *
 * A vector image is one file at every size, so it is neither resized nor asked
 * for at a width, and the loader answers such an address unchanged. The image
 * component has to be told the same thing through `unoptimized`: a loader that
 * hands back the address it was given otherwise looks to it like a loader that
 * ignores the width it asked for, and it says so on every page that shows one.
 */
export function isVectorImage(src: string): boolean {
  const [pathname] = src.split('?');
  return pathname.toLowerCase().endsWith('.svg');
}
