// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import type {Cloned} from '@/types/util';
import {CommentConfig} from '@/orm/workspace';

// ---- LOCAL IMPORTS ---- //
import type {TrackObject} from '../types';
import {TrackObjectSchema} from './validators';

export const isCommentEnabled = ({
  subapp,
  config,
}: {
  subapp: SUBAPP_CODES;
  config: CommentConfig | Cloned<CommentConfig>;
}) => {
  const commentBySubapp: Partial<Record<SUBAPP_CODES, boolean>> = {
    [SUBAPP_CODES.events]: config.enableEventComment ?? false,
    [SUBAPP_CODES.news]: config.enableNewsComment ?? false,
  };

  if (Object.keys(commentBySubapp).includes(subapp)) {
    return !!(config.enableComment && commentBySubapp[subapp]);
  }
  return !!config.enableComment;
};

export const parseCommentContent = (
  data: unknown,
): string | TrackObject | null => {
  try {
    if (typeof data !== 'string') return null;
    const parsed = TrackObjectSchema.parse(JSON.parse(data));
    return parsed;
  } catch {
    if (typeof data === 'string') {
      return data;
    }
    return null;
  }
};

export const isTrackObject = (data: unknown): data is TrackObject => {
  return typeof data === 'object' && data !== null;
};
