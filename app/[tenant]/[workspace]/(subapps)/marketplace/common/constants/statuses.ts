import type {StatusKey} from '@/ui/components';

export enum MARKETPLACE_VERSION_STATUS {
  DRAFT = 'draft',
  IN_REVIEW = 'inReview',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  UNPUBLISHED = 'unpublished',
}

/* Publisher access request states (integer-backed, workflow order). Approving a
 * request sets the partner's `isMarketplacePublisher` flag, which — with the
 * workspace's `allowToPublish` — is what actually gates publishing. */
export enum PUBLISHER_REQUEST_STATUS {
  REQUESTED = 1,
  REJECTED = 2,
  APPROVED = 3,
  BANNED = 4,
}

/* Untranslated display labels; translate at the call site (`i18n.t` on the
 * client, `t` on the server). */
export const MARKETPLACE_VERSION_STATUS_LABELS: Record<string, string> = {
  [MARKETPLACE_VERSION_STATUS.DRAFT]: 'Draft',
  [MARKETPLACE_VERSION_STATUS.IN_REVIEW]: 'In review',
  [MARKETPLACE_VERSION_STATUS.PUBLISHED]: 'Published',
  [MARKETPLACE_VERSION_STATUS.REJECTED]: 'Rejected',
  [MARKETPLACE_VERSION_STATUS.UNPUBLISHED]: 'Unpublished',
};

/* Design-system tone for each version status, so a status reads the same
 * wherever it is shown. */
export const MARKETPLACE_VERSION_STATUS_TONES: Record<string, StatusKey> = {
  [MARKETPLACE_VERSION_STATUS.DRAFT]: 'draft',
  [MARKETPLACE_VERSION_STATUS.IN_REVIEW]: 'pending',
  [MARKETPLACE_VERSION_STATUS.PUBLISHED]: 'delivered',
  [MARKETPLACE_VERSION_STATUS.REJECTED]: 'rejected',
  [MARKETPLACE_VERSION_STATUS.UNPUBLISHED]: 'expired',
} satisfies Record<MARKETPLACE_VERSION_STATUS, StatusKey>;

/* Admin moderation of a product. Integer-backed, mirroring the back-office
   selection: 1 active / 2 frozen / 3 taken down. */
export const PRODUCT_MODERATION_STATUS = {
  ACTIVE: 1,
  FROZEN: 2,
  TAKEN_DOWN: 3,
} as const;

/* No entry for ACTIVE: a product that is neither frozen nor taken down shows
 * its latest version's status in place of a moderation label. */
export const PRODUCT_MODERATION_STATUS_LABELS: Record<number, string> = {
  [PRODUCT_MODERATION_STATUS.FROZEN]: 'Frozen',
  [PRODUCT_MODERATION_STATUS.TAKEN_DOWN]: 'Taken down',
};

export const PRODUCT_MODERATION_STATUS_TONES: Record<number, StatusKey> = {
  [PRODUCT_MODERATION_STATUS.FROZEN]: 'overdue',
  [PRODUCT_MODERATION_STATUS.TAKEN_DOWN]: 'cancelled',
};

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
