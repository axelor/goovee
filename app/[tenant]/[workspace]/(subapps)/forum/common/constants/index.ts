// ---- CORE IMPORTS ---- //
import {ORDER_BY} from '@/constants';

export const PUBLISHING = 'Publishing...';
export const CLICK_HERE_DRAG_DROP =
  'Click here to select your image or drag & drop';
export const CLICK_HERE_DRAG_DROP_FILE =
  'Click here to select your file or drag & drop';
export const SUPPORTED_FILE_JPG_PNG = 'Supported format: jpg,png..';
export const SUPPORTED_FILE_PDF_DOC = 'Supported format: pdf, doc, xlsx';
export const ALERTNATE_TEXT = 'Alternate Text';
export const OUT_OF = 'out of';
export const UPLOAD = 'Upload';
export const FILE_TITLE = 'File Title';

export const MENU = [
  {id: 1, name: 'Homepage', link: ''},
  {
    id: 2,
    name: 'Forum notifications',
    link: '/manage-notifications',
  },
];

export const NOTIFICATION_VALUES = {
  ALL: 'all',
  ALL_ON_MY_POST: 'allOnMyPost',
  NEW_COMMENTS_ON_MY_POST: 'newCommentsOnMyPost',
  NONE: 'none',
} as const;

export type NotificationValue =
  (typeof NOTIFICATION_VALUES)[keyof typeof NOTIFICATION_VALUES];

export const NOTIFICATIONS_OPTIONS: {
  id: number;
  title: string;
  value: NotificationValue;
}[] = [
  {
    id: 1,
    title: 'All new posts and new comments',
    value: NOTIFICATION_VALUES.ALL,
  },
  {
    id: 2,
    title: 'All new posts and new comments on my posts',
    value: NOTIFICATION_VALUES.ALL_ON_MY_POST,
  },
  {
    id: 3,
    title: 'Only new comments on my posts',
    value: NOTIFICATION_VALUES.NEW_COMMENTS_ON_MY_POST,
  },
  {
    id: 4,
    title: 'No notifications',
    value: NOTIFICATION_VALUES.NONE,
  },
];

export const GROUPS_ORDER_BY = {
  isPin: ORDER_BY.DESC,
  forumGroup: {
    name: ORDER_BY.ASC,
  },
};

export const MAX_IMAGES_BEFORE_OVERLAY = 3;

export const COMMENTS_PER_LOAD = 3;

export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/* Max attachments per post. A post carries either images or documents (not
 * both), so this caps whichever type is in use. Enforced client-side at pick
 * time and server-side when the post is created. */
export const MAX_FORUM_ATTACHMENTS = 10;

/* Staged-upload purpose under which forum post attachments (images and documents) are pre-uploaded (registered in lib/core/upload/staged-upload.ts) and redeemed when the post is created. */
export const FORUM_POST_ATTACHMENT_PURPOSE = 'forum:post:attachment';

/* Document MIME types accepted as forum post attachments (alongside any
 * image/*). Single source of truth: enforced client-side at pick time by the
 * file picker and server-side by the upload purpose policy. */
export const FORUM_ATTACHMENT_DOC_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
