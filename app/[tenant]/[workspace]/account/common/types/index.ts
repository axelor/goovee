export enum Role {
  user = 'user',
  admin = 'admin',
  owner = 'owner',
}

export enum Authorization {
  restricted = 'restricted',
  total = 'total',
}

export type InviteAppsConfig = {
  [key: string]: {
    code: string;
    access?: 'yes' | 'no';
    authorization?: Authorization;
    id?: string;
  };
};
