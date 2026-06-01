import type {ProductSeed, SeedData, VersionSeed} from './validators';
import {slugify} from '../../utils/slugify';

/* Cross-field validations that JSON Schema / Zod can't express:
 *   - `published` versions must carry both submittedAt and releasedAt;
 *     `draft` versions must carry neither.
 *   - submittedAt ≤ releasedAt for any version that has both.
 *   - Within a product, semver ordering and releasedAt ordering must
 *     agree — a higher version number must have a later release date.
 *
 * All violations are collected and reported in one error so the author
 * can fix several rows in a single pass instead of fail-one-fix-one. */
export function validateCrossFieldRules(data: SeedData) {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  for (const product of data.products) {
    if (seenSlugs.has(slugify(product.name))) {
      errors.push(`Duplicate product slug '${slugify(product.name)}'.`);
    }
    seenSlugs.add(slugify(product.name));
    validateProductVersions(product, errors);
    validateProductReviews(product, errors);
  }

  if (errors.length) {
    const err = new Error(
      `Seed validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):\n  • ${errors.join('\n  • ')}`,
    );
    err.name = 'SeedValidationError';
    throw err;
  }
}

function validateProductVersions(product: ProductSeed, errors: string[]) {
  const seenVersionNumbers = new Set<string>();
  for (const version of product.versions) {
    if (seenVersionNumbers.has(version.versionNumber)) {
      errors.push(
        `${slugify(product.name)}: duplicate version '${version.versionNumber}'.`,
      );
    }
    seenVersionNumbers.add(version.versionNumber);
    validateVersionDates(slugify(product.name), version, errors);
  }
  validateMonotonicReleaseOrder(product, errors);
}

function validateVersionDates(
  productCode: string,
  version: VersionSeed,
  errors: string[],
) {
  const hasSubmitted = !!version.submittedAt;
  const hasReleased = !!version.releasedAt;

  if (version.status === 'draft') {
    if (hasSubmitted || hasReleased) {
      errors.push(
        `${productCode} v${version.versionNumber}: draft versions must not have submittedAt or releasedAt.`,
      );
    }
    return;
  }
  // status === 'published'
  if (!hasSubmitted || !hasReleased) {
    errors.push(
      `${productCode} v${version.versionNumber}: published versions require both submittedAt and releasedAt.`,
    );
    return;
  }
  const submitted = new Date(version.submittedAt!).getTime();
  const released = new Date(version.releasedAt!).getTime();
  if (submitted > released) {
    errors.push(
      `${productCode} v${version.versionNumber}: submittedAt (${version.submittedAt}) is after releasedAt (${version.releasedAt}).`,
    );
  }
}

/* Higher semver → later release date. We sort the published versions by
 * semver ascending and check `releasedAt` is non-decreasing. */
function validateMonotonicReleaseOrder(product: ProductSeed, errors: string[]) {
  const published = product.versions
    .filter(v => v.status === 'published' && v.releasedAt)
    .map(v => ({
      versionNumber: v.versionNumber,
      releasedAt: new Date(v.releasedAt!).getTime(),
      tuple: parseSemver(v.versionNumber),
    }))
    .sort((a, b) => compareSemver(a.tuple, b.tuple));

  for (let i = 1; i < published.length; i++) {
    const prev = published[i - 1];
    const curr = published[i];
    if (curr.releasedAt < prev.releasedAt) {
      errors.push(
        `${slugify(product.name)}: v${curr.versionNumber} (released ${new Date(curr.releasedAt).toISOString()}) is older than v${prev.versionNumber} (released ${new Date(prev.releasedAt).toISOString()}). Higher semver must be released later.`,
      );
    }
  }
}

function parseSemver(v: string): [number, number, number] {
  const [maj, min, patch] = v.split('.').map(n => parseInt(n, 10));
  return [maj, min, patch];
}

function compareSemver(
  a: [number, number, number],
  b: [number, number, number],
) {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function validateProductReviews(product: ProductSeed, errors: string[]) {
  if (!product.reviews) return;
  const seenAuthors = new Set<string>();
  const versionNumbers = new Set(product.versions.map(v => v.versionNumber));
  for (const review of product.reviews) {
    if (seenAuthors.has(review.authorEmail)) {
      errors.push(
        `${slugify(product.name)}: duplicate review author '${review.authorEmail}'.`,
      );
    }
    seenAuthors.add(review.authorEmail);
    if (
      review.reviewedVersionNumber &&
      !versionNumbers.has(review.reviewedVersionNumber)
    ) {
      errors.push(
        `${slugify(product.name)}: review references unknown version 'v${review.reviewedVersionNumber}'.`,
      );
    }
  }
}
