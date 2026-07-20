/* Slug for a marketplace product. Lower-cases, replaces non-alphanum runs
 * with `-`, trims, caps at 80 chars. Falls back to `product-<timestamp>`
 * when the input has no alphanum at all. */
export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `product-${Date.now()}`
  );
}
