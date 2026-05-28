export type MarketplaceLink = {
  id: number;
  title: string;
  /** Sub-segment after `…/marketplace/`. Empty string targets the root. */
  segment: string;
  requiresAuth?: boolean;
};

export const MARKETPLACE_LINKS: MarketplaceLink[] = [
  {id: 1, title: 'Products', segment: ''},
  {
    id: 2,
    title: 'My contributions',
    segment: 'my-contributions',
    requiresAuth: true,
  },
  {
    id: 3,
    title: 'My purchases',
    segment: 'my-purchases',
    requiresAuth: true,
  },
];
