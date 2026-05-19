import {MARKETPLACE_TYPE} from './marketplace-types';

/**
 * URL segment values for marketplace types.
 * Routes use plural slugs ("skills", "apps"); the ORM uses singular enum
 * values ("skill", "app") from {@link MARKETPLACE_TYPE}.
 */
export enum MARKETPLACE_TYPE_SEGMENT {
  SKILLS = 'skills',
  APPS = 'apps',
}

export const MARKETPLACE_TYPE_BY_SEGMENT: Record<
  MARKETPLACE_TYPE_SEGMENT,
  MARKETPLACE_TYPE
> = {
  [MARKETPLACE_TYPE_SEGMENT.SKILLS]: MARKETPLACE_TYPE.SKILL,
  [MARKETPLACE_TYPE_SEGMENT.APPS]: MARKETPLACE_TYPE.APP,
};

export const DEFAULT_MARKETPLACE_TYPE_SEGMENT = MARKETPLACE_TYPE_SEGMENT.SKILLS;
