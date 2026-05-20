import {MARKETPLACE_TYPE_SEGMENT} from './route-types';

export type MarketplaceLink = {
  id: number;
  title: string;
  segment: string;
  requiresAuth?: boolean;
};

export const MARKETPLACE_LINKS: MarketplaceLink[] = [
  {id: 1, title: 'Skills', segment: MARKETPLACE_TYPE_SEGMENT.SKILLS},
  {id: 2, title: 'Apps Studio', segment: MARKETPLACE_TYPE_SEGMENT.APPS},
  {
    id: 3,
    title: 'My contributions',
    segment: 'my-contributions',
    requiresAuth: true,
  },
  {
    id: 4,
    title: 'My purchases',
    segment: 'my-purchases',
    requiresAuth: true,
  },
];
