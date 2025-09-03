// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import type {TrackObject} from '../types';
import {TrackObjectSchema} from './validators';

export const isCommentEnabled = ({
  subapp,
  workspace,
}: {
  subapp: SUBAPP_CODES;
  workspace: PortalWorkspace;
}) => {
  const config: Partial<Record<SUBAPP_CODES, boolean>> = {
    [SUBAPP_CODES.events]: workspace.config?.enableEventComment,
    [SUBAPP_CODES.news]: workspace.config?.enableNewsComment,
  };

  if (Object.keys(config).includes(subapp)) {
    return !!(workspace.config?.enableComment && config[subapp]);
  }
  return !!workspace.config?.enableComment;
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
