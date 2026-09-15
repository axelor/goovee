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

/* Staged-upload purpose under which a product's version bundle is pre-uploaded
 * (registered in lib/core/upload/staged-upload.ts) and redeemed when the
 * version is created. */
export const MARKETPLACE_BUNDLE_PURPOSE = 'marketplace:bundle';

/* Staged-upload purpose under which product screenshots are pre-uploaded
 * (registered in lib/core/upload/staged-upload.ts) and redeemed when the
 * product is saved. */
export const MARKETPLACE_SCREENSHOT_PURPOSE = 'marketplace:screenshot';
