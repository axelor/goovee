import {Role} from '../types';

export const ROUTES = {
  personal: 'personal',
  prefrences: 'preferences',
  password: 'password',
  addresses: 'addresses',
  members: 'members',
  notifications: 'notifications',
  apps: 'apps',
  settings: 'settings',
  directory: 'directory',
};

export const GLOBAL_MENU = [
  {
    label: 'Personal settings',
    route: ROUTES.personal,
  },
  {
    label: 'Preferences',
    route: ROUTES.prefrences,
  },
  {
    label: 'Password',
    route: ROUTES.password,
  },

  {
    label: 'Addresses',
    route: ROUTES.addresses,
  },
  {
    label: 'Directory settings',
    route: ROUTES.directory,
  },
];

export const WORKSPACE_MENU = [
  {
    label: 'Notifications',
    route: ROUTES.notifications,
  },
  {
    label: 'My apps',
    route: ROUTES.apps,
  },
  {
    label: 'Settings',
    route: ROUTES.settings,
  },
];

export const ADMIN_WORKSPACE_MENU = [
  {
    label: 'Members',
    route: ROUTES.members,
  },
  ...WORKSPACE_MENU,
];

export const RoleLabel = {
  [Role.admin]: 'Admin',
  [Role.user]: 'User',
  [Role.owner]: 'Owner',
};

/* Staged-upload purpose under which a partner's profile / company picture is
 * pre-uploaded (registered in lib/core/upload/staged-upload.ts) and redeemed
 * when linked to the partner. */
export const PARTNER_PICTURE_PURPOSE = 'partner:picture';

/* Maximum accepted size for a profile / company picture (15 MB) — comfortably
 * covers modern phone photos while rejecting raw / oversized files. The cap is
 * also enforced server-side as a streaming limit by the stage route. */
export const PARTNER_PICTURE_MAX_FILE_SIZE = 15000000;
