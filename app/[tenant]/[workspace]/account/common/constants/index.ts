import {Role} from '../types';

export const ROUTES = {
  // The 8 original Goovee tabs — each has its own page again.
  personal: 'personal',
  preferences: 'preferences',
  password: 'password',
  addresses: 'addresses',
  directory: 'directory',
  members: 'members',
  notifications: 'notifications',
  apps: 'apps',

  // Legacy consolidated routes — kept as redirects for backwards compatibility.
  profile: 'profile',
  security: 'security',
  workspace: 'workspace',
  settings: 'settings',
};

// ---- Grouped lateral rail (8 original tabs, design "AccountV3Rail") ----

export type AccountTabKey =
  | 'personal'
  | 'preferences'
  | 'password'
  | 'addresses'
  | 'directory'
  | 'members'
  | 'notifications'
  | 'apps';

export type AccountTabGroup = 'Account' | 'Security' | 'Team';

export type AccountTabIcon =
  | 'personal'
  | 'preferences'
  | 'password'
  | 'addresses'
  | 'directory'
  | 'members'
  | 'notifications'
  | 'apps';

export type AccountTab = {
  key: AccountTabKey;
  label: string;
  subtitle: string;
  description: string;
  group: AccountTabGroup;
  route: string;
  icon: AccountTabIcon;
  adminOnly?: boolean;
};

export const ACCOUNT_GROUPS: AccountTabGroup[] = [
  'Account',
  'Security',
  'Team',
];

export const ACCOUNT_TABS: AccountTab[] = [
  {
    key: 'personal',
    group: 'Account',
    route: ROUTES.personal,
    icon: 'personal',
    label: 'Personal settings',
    subtitle: 'Company identity',
    description: 'Company information shown across your workspace.',
  },
  {
    key: 'preferences',
    group: 'Account',
    route: ROUTES.preferences,
    icon: 'preferences',
    label: 'Preferences',
    subtitle: 'Default workspace and language',
    description: 'Default behavior when you sign in.',
  },
  {
    key: 'password',
    group: 'Security',
    route: ROUTES.password,
    icon: 'password',
    label: 'Password',
    subtitle: 'Change your password',
    description: 'Use a unique password of at least 12 characters.',
  },
  {
    key: 'addresses',
    group: 'Security',
    route: ROUTES.addresses,
    icon: 'addresses',
    label: 'Addresses',
    subtitle: 'Billing and delivery',
    description: 'Default addresses for billing and delivery.',
  },
  {
    key: 'directory',
    group: 'Security',
    route: ROUTES.directory,
    icon: 'directory',
    label: 'Directory settings',
    subtitle: 'Public partner profile',
    description: 'What other partners can see about your company.',
  },
  {
    key: 'members',
    group: 'Team',
    route: ROUTES.members,
    icon: 'members',
    adminOnly: true,
    label: 'Members',
    subtitle: 'Users and invitations',
    description: 'Manage who can access this workspace and their roles.',
  },
  {
    key: 'notifications',
    group: 'Team',
    route: ROUTES.notifications,
    icon: 'notifications',
    label: 'Notifications',
    subtitle: 'Push and e-mail',
    description: 'Choose what you receive and where.',
  },
  {
    key: 'apps',
    group: 'Team',
    route: ROUTES.apps,
    icon: 'apps',
    label: 'My apps',
    subtitle: 'Visible applications',
    description: 'Enable or hide applications in the side menu.',
  },
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
