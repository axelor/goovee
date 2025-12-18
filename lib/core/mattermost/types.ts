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
