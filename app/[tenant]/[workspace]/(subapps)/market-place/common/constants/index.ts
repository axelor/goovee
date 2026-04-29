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

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const SORT_OPTIONS = [
  {label: 'Newest', value: 'newest'},
  {label: 'Price: Low to High', value: 'price_asc'},
  {label: 'Price: High to Low', value: 'price_desc'},
  {label: 'Name A-Z', value: 'name_asc'},
] as const;
