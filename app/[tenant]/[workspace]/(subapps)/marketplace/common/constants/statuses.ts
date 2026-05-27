export enum MARKETPLACE_VERSION_STATUS {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  UNPUBLISHED = 'unpublished',
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
