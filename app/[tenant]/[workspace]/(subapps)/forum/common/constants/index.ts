import {
  CiTextAlignCenter,
  CiTextAlignJustify,
  CiTextAlignLeft,
  CiTextAlignRight,
} from 'react-icons/ci';
import {MdOutlineArticle} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {ORDER_BY} from '@/constants';

// ---- LOCAL IMPORTS ---- //
import type {Level} from '@/subapps/forum/common/types/forum';

export const GROUPS = 'Groups';
export const MEMBER = 'Member';
export const OTHER_GROUPS = 'Other groups';
export const SEARCH_HERE = 'Search here';
export const DISABLED_SEARCH_PLACEHOLDER = 'You must log in to be able to post';
export const MARK_AS_READ = 'Mark as read';
export const PIN = 'Pin';
export const REMOVE_PIN = 'Remove pin';
export const NOTIFICATIONS = 'Notifications';
export const LEAVE_THIS_GROUP = 'Leave this group';
export const ASK_TO_JOIN = 'Ask to join the group';
export const START_A_POST = 'Start a post';
export const JOIN_GROUP_TO_POST = 'Join group to start posting.';
export const TITLE = 'Title';
export const CHOOSE_GROUP = 'Chose in which group you want to post';
export const CONTENT = 'Content';
export const PUBLISH = 'Publish';
export const PUBLISHING = 'Publishing...';
export const MAKE_A_NEW_POST = 'Make a new post';
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
export const SELECT_A_GROUP = 'Select a group';
export const ENTER_TITLE = 'Enter Title';
export const MANAGE_NOTIFICATIONS = 'Manage notifications';
export const SORT_BY = 'Sort By';
export const SEE_MORE = 'See more';
export const SEE_LESS = 'See less';
export const JOIN_GROUP_TO_COMMENT = 'Join the group to comment';

export const GROUP_SORT_BY = [
  {
    id: 'ASC',
    title: 'A-Z',
  },
  {
    id: 'DESC',
    title: 'Z-A',
  },
];

export const FORUM_CONTENT = {
  POSTS: 'posts',
  MEDIA: 'media',
};

export const MENU = [
  {id: 1, name: 'Homepage', link: ''},
  {
    id: 2,
    name: 'Forum notifications',
    link: '/manage-notifications',
  },
  // {id: 3, name: 'My profile', link: '/profile'},
];

export const TAB_TITLES = [
  {
    id: 1,
    key: FORUM_CONTENT.POSTS,
    title: 'Posts',
    icon: MdOutlineArticle,
  },
  // Commenting this cause it is not needed in V1
  // {
  //   id: 2,
  //   key: 'media',
  //   title: 'Media',
  //   icon: MdOutlinePermMedia,
  //   component: MediaContent,
  // },
];

export const FORUM_GROUP = [
  {
    id: 1,
    name: 'Group 1',
    img: '/images/group-1.png',
  },
  {
    id: 2,
    name: 'Group 2',
    img: '/images/group-1.png',
  },
  {
    id: 3,
    name: 'Group 3',
    img: '/images/group-1.png',
  },
];

export const HEADING_LEVEL: Level[] = [1, 2, 3, 4, 5, 6];

export const TEXT_ALIGNMENT = [
  {name: 'left', icon: CiTextAlignLeft},
  {name: 'center', icon: CiTextAlignCenter},
  {name: 'right', icon: CiTextAlignRight},
  {name: 'justify', icon: CiTextAlignJustify},
];

export const NOTIFICATION_VALUES = {
  ALL: 'all',
  ALL_ON_MY_POST: 'allOnMyPost',
  NEW_COMMENTS_ON_MY_POST: 'newCommentsOnMyPost',
  NONE: 'none',
};

export const NOTIFICATIONS_OPTIONS = [
  {
    id: 1,
    title: 'All new posts and new comments',
    value: 'all',
  },
  {
    id: 2,
    title: 'All new posts and new comments on my posts',
    value: 'allOnMyPost',
  },
  {
    id: 3,
    title: 'Only new comments on my posts',
    value: 'newCommentsOnMyPost',
  },
  {
    id: 4,
    title: 'No notifications',
    value: 'none',
  },
];

export const GROUP = {
  name: 'Group name',
  desc: 'Mi eget leo viverra cras pharetra enim viverra. Ac at non pretium etiam viverra. Ac at non pretium etiam',
  image: '/images/group-img.png',
};

export const GROUPS_ORDER_BY = {
  isPin: ORDER_BY.DESC,
  forumGroup: {
    name: ORDER_BY.ASC,
  },
};

export const MAX_IMAGES_BEFORE_OVERLAY = 3;

export const COMMENTS_PER_LOAD = 3;
