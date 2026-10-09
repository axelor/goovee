import type {PublicConfig} from '@/tenant/types';

/*
 * Whether the tenant whose settings these are can be used in the portal mobile
 * app. Off unless the tenant turns it on: a portal that has not chosen the app
 * offers none of its sign-in handover or device notifications.
 */
export function isMobileAppEnabled(
  publicConfig: PublicConfig | null | undefined,
): boolean {
  return publicConfig?.mobileApp?.enabled === true;
}
