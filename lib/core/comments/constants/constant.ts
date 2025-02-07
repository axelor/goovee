export const MAX_FILE_SIZE = 20000000; // 20 MB
export const COMMENT = 'Comment';
export const COMMENTS = 'Comments';
export const DISABLED_COMMENT_PLACEHOLDER =
  'You need to log in to comment posts';

export enum SORT_TYPE {
  new = 'new',
  old = 'old',
  popular = 'popular',
}

export enum MAIL_MESSAGE_TYPE {
  notification = 'notification',
  comment = 'comment',
}

export const SORT_BY_OPTIONS = [
  {
    id: 1,
    key: SORT_TYPE.new,
    label: 'New',
  },
  {
    id: 2,
    key: SORT_TYPE.old,
    label: 'Old',
  },
  {
    id: 3,
    key: SORT_TYPE.popular,
    label: 'Popular',
  },
];
