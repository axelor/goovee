export const ACTION = {
  WRITE: 'write',
  UPLOAD: 'upload',
} as const;

export type ActionType = (typeof ACTION)[keyof typeof ACTION];

export const MAX_FILE_SIZE = 20000000; // 20 MB

/* Max number of files that can be uploaded in a single resource submission. */
export const MAX_RESOURCE_FILES = 10;

/* Staged-upload purpose under which DMS resource files are pre-uploaded
 * (registered in lib/core/upload/staged-upload.ts) and redeemed when the
 * aOSDMSFile rows are created. */
export const RESOURCE_DMS_UPLOAD_PURPOSE = 'resources:dms';

// "New" cutoff window — files created within this many milliseconds are
// flagged as new in lists/grids and surfaced on the home page.
export const NEW_FILE_CUTOFF_DAYS = 1;
export const NEW_FILE_CUTOFF_MS =
  NEW_FILE_CUTOFF_DAYS * 24 * 60 * 60 * 1000;

export const COLORS = [
  {
    label: 'Red',
    value: 'red',
  },
  {
    label: 'Pink',
    value: 'pink',
  },
  {
    label: 'Purple',
    value: 'purple',
  },
  {
    label: 'Deeppurple',
    value: 'deeppurple',
  },
  {
    label: 'Indigo',
    value: 'indigo',
  },
  {
    label: 'Blue',
    value: 'blue',
  },
  {
    label: 'Lightblue',
    value: 'lightblue',
  },
  {
    label: 'Cyan',
    value: 'cyan',
  },
  {
    label: 'Teal',
    value: 'teal',
  },
  {
    label: 'Green',
    value: 'green',
  },
  {
    label: 'Lightgreen',
    value: 'lightgreen',
  },
  {
    label: 'Lime',
    value: 'lime',
  },
  {
    label: 'Yellow',
    value: 'yellow',
  },
  {
    label: 'Amber',
    value: 'amber',
  },
  {
    label: 'Orange',
    value: 'orange',
  },
  {
    label: 'Deeporange',
    value: 'deeporange',
  },
  {
    label: 'Brown',
    value: 'brown',
  },
  {
    label: 'Grey',
    value: 'grey',
  },
  {
    label: 'Bluegrey',
    value: 'bluegrey',
  },
  {
    label: 'Black',
    value: 'black',
  },
  {
    label: 'White',
    value: 'white',
  },
];

export const ICONS = [
  'md-LocationOn',
  'md-BakeryDining',
  'md-VpnKey',
  'md-BusinessCenter',
  'md-Soap',
  'md-EmojiEvents',
  'md-ArrowOutward',
  'md-ArrowRightAlt',
  'md-Article',
  'md-AspectRatio',
  'md-Assessment',
  'md-AssignmentAdd',
  'md-AssignmentInd',
  'md-AssignmentLate',
  'md-AssignmentReturn',
  'md-AssignmentReturned',
  'md-AssignmentTurnedIn',
  'md-Assignment',
  'md-AssuredWorkload',
  'md-Autorenew',
  'md-BackupTable',
  'md-Backup',
  'md-Balance',
  'md-BarcodeReader',
  'md-BatchPrediction',
  'md-BookOnline',
  'md-Book',
  'md-BookmarkAdd',
  'md-BookmarkAdded',
  'md-BookmarkBorder',
  'md-BookmarkRemove',
  'md-Bookmark',
  'md-Bookmarks',
  'md-BrowseGallery',
  'md-BugReport',
  'md-BuildCircle',
  'md-Build',
  'md-Cached',
  'md-CalendarMonth',
  'md-CalendarToday',
  'md-CalendarViewDay',
  'md-CalendarViewMonth',
  'md-CalendarViewWeek',
  'md-CameraEnhance',
  'md-CancelScheduleSend',
  'md-CardGiftcard',
  'md-CardMembership',
  'md-CardTravel',
  'md-ChangeHistory',
  'md-CheckCircleOutline',
  'md-CheckCircle',
  'md-ChromeReaderMode',
  'md-CircleNotifications',
  'md-Class',
  'md-CloseFullscreen',
  'md-CodeOff',
  'md-Code',
  'md-CommentBank',
  'md-Commit',
  'md-Commute',
  'md-CompareArrows',
  'md-Compress',
  'md-ContactPage',
  'md-ContactSupport',
  'md-Contactless',
  'md-Copyright',
  'md-CreditCardOff',
  'md-CreditCard',
  'md-Css',
  'md-CurrencyExchange',
  'md-Dangerous',
];

export const BANNER_TITLE = 'Resources';
export const BANNER_DESCRIPTION =
  'Mi eget leo viverra cras pharetra enim viverra. Ac at non pretium etiam viverra. Ac at non pretium etiam';
