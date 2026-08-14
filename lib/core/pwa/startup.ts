// ---- LOCAL IMPORTS ---- //
import {getMaxConnections, getVapidDetails} from './utils';

/**
 * Report at startup whether push notifications can be sent — nothing else in the
 * portal surfaces a missing key, because a notification is stored and shown in
 * the portal whether or not it reaches a device.
 */
export function checkPushConfig(): void {
  // getVapidDetails() already reported why.
  if (!getVapidDetails()) {
    return;
  }

  console.log(
    `[PUSH][STARTUP] push notifications are configured; up to ${getMaxConnections()} ` +
      `notifications are delivered at once (set PUSH_MAX_CONNECTIONS to change)`,
  );
}
