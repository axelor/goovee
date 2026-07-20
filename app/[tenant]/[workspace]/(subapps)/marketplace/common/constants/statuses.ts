export enum MARKETPLACE_VERSION_STATUS {
  DRAFT = 'draft',
  IN_REVIEW = 'inReview',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  UNPUBLISHED = 'unpublished',
}

/* Publisher access request states (integer-backed, workflow order). Approving a
 * request sets the partner's `isMarketplacePublisher` flag, which — with the
 * workspace master switch — is what actually gates publishing. */
export enum PUBLISHER_REQUEST_STATUS {
  REQUESTED = 1,
  REJECTED = 2,
  APPROVED = 3,
  BANNED = 4,
}

// Untranslated display labels for each status value. Translate at runtime
// with the appropriate translate function (`i18n.t` client / `t` server).
export const MARKETPLACE_VERSION_STATUS_LABELS: Record<string, string> = {
  [MARKETPLACE_VERSION_STATUS.DRAFT]: 'Draft',
  [MARKETPLACE_VERSION_STATUS.IN_REVIEW]: 'In review',
  [MARKETPLACE_VERSION_STATUS.PUBLISHED]: 'Published',
  [MARKETPLACE_VERSION_STATUS.REJECTED]: 'Rejected',
  [MARKETPLACE_VERSION_STATUS.UNPUBLISHED]: 'Unpublished',
};

/* Admin moderation of a product. Integer-backed, mirroring the back-office
   selection: 1 active / 2 frozen / 3 taken down. */
export const PRODUCT_MODERATION_STATUS = {
  ACTIVE: 1,
  FROZEN: 2,
  TAKEN_DOWN: 3,
} as const;

/* Moderation state of a review. A review is visible when authored; an admin can
 * hide a violation from the back-office. Mirrors the integer selection
 * portal.marketplace.review.moderation.status.select on the backend. */
export const REVIEW_MODERATION_STATUS = {
  VISIBLE: 1,
  HIDDEN: 2,
} as const;

/* State of a review report. A report is pending until an admin resolves it (by
 * hiding the review or dismissing its reports). Mirrors the integer selection
 * portal.marketplace.review.report.status.select on the backend. */
export const REVIEW_REPORT_STATUS = {
  PENDING: 1,
  RESOLVED: 2,
} as const;
