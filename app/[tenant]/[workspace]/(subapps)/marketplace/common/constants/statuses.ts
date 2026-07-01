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
