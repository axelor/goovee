// This file is imported by the service worker (sw.ts) and bundled into it.
// Only add plain literals here — no imports, no function calls, no side effects.
export const PUSH_CHANNEL = 'push-notifications';

export const MSG_TYPE = {
  NEW: 'NEW_NOTIFICATION',
  READ: 'MARK_READ',
  CLOSE: 'CLOSE_NOTIFICATION',
  CLOSE_ALL: 'CLOSE_ALL_NOTIFICATIONS',
} as const;
