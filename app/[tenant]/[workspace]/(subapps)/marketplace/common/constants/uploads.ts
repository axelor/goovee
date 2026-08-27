/* Screenshot limits, kept clear of the product form's schema so the upload
 * policy registry can read them without pulling the icon catalogue in. */

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/* Total screenshots per product, existing and newly picked together. */
export const MAX_IMAGES = 9;

/* Common raster formats only. SVG is intentionally excluded: it can carry
 * embedded scripts/external refs, so serving user-supplied SVG is an XSS
 * vector. Used for the schema refine, the <input accept> attribute and the
 * stage route's policy. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;
