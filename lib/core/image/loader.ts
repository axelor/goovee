'use client';

import {DEFAULT_IMAGE_QUALITY} from './constants';
import {isVectorImage} from './vector';

/**
 * Addresses every image the image component renders.
 *
 * The component asks for a candidate width per srcset entry; this turns that
 * into a request the route already serving the file can answer, by adding the
 * width and quality to the address the caller gave. The route checks access as
 * it always has and returns a derivative at that width.
 *
 * Configuring this loader turns off the framework's own image optimisation
 * endpoint, so no image is served from a cache that is shared between users.
 *
 * Files under the public directory are not served by a route and ignore the
 * added parameters, so they are returned whole. That is a display of the
 * original rather than a failure, and those assets are committed at the size
 * they are shown.
 */
export default function gooveeImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const [pathname, search] = src.split('?');

  /*
   * A vector image is one file at every size, and is not resized. Asking for a
   * width would only produce a set of candidates that are all the same file, and
   * make the browser preload several of them. The framework leaves these alone
   * too, but only when it is addressing images itself.
   *
   * The loader is what decides the address, so it gives the same answer whether
   * or not a caller asked for the image to be left unoptimized.
   */
  if (isVectorImage(src)) return src;

  const params = new URLSearchParams(search);

  params.set('w', String(width));
  params.set('q', String(quality ?? DEFAULT_IMAGE_QUALITY));

  return `${pathname}?${params}`;
}
