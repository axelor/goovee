export const MARKETPLACE_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Under Review',
  approved: 'Approved',
  published: 'Published',
  rejected: 'Rejected',
};

export const SORT_OPTIONS = [
  {label: 'Newest', value: 'newest'},
  {label: 'Price: Low to High', value: 'price_asc'},
  {label: 'Price: High to Low', value: 'price_desc'},
  {label: 'Name A-Z', value: 'name_asc'},
] as const;
