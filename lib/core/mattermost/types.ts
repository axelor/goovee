export interface MattermostUser {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  position?: string;
  locale?: string;
  create_at?: number;
  update_at?: number;
}

export interface SyncMattermostPasswordSuccess {
  success: true;
  synced: boolean; // true if password was updated, false if user not found
}

export interface SyncMattermostPasswordError {
  success: false;
  error: 'USER_NOT_FOUND' | 'UPDATE_FAILED' | 'UNKNOWN_ERROR';
  message?: string;
}

export type SyncMattermostPasswordResult =
  | SyncMattermostPasswordSuccess
  | SyncMattermostPasswordError;

export interface CreateMattermostUserParams {
  name: string;
  firstName: string;
  mail: string;
  password: string;
}

export interface CreateMattermostUserSuccess {
  success: true;
  created: boolean;
}

export interface CreateMattermostUserError {
  success: false;
  error: 'CREATION_FAILED' | 'AOS_ERROR' | 'UNKNOWN_ERROR';
  message?: string;
}

export type CreateMattermostUserResult =
  | CreateMattermostUserSuccess
  | CreateMattermostUserError;

// Types for unified sync or create function
export interface SyncOrCreateMattermostUserSuccess {
  success: true;
  action: 'created' | 'synced' | 'skipped';
  userId?: string;
}

export interface SyncOrCreateMattermostUserError {
  success: false;
  error: string;
  message?: string;
}

export type SyncOrCreateMattermostUserResult =
  | SyncOrCreateMattermostUserSuccess
  | SyncOrCreateMattermostUserError;
