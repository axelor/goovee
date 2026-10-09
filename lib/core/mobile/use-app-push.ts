'use client';

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import type {TenantScope} from '@/url/tenant-urls';
import {requestApp} from './bridge';
import {MOBILE_DEVICES_PATH} from './contract';
import {useMobileBridge} from './use-mobile-bridge';

/* Remembers, per tenant, that the user turned the app's notifications off, so
 * they are not turned back on the next time the page loads. */
const OPTED_OUT_KEY = 'portal-app-push-off';

export type AppPush = {
  /* Whether this page runs inside the mobile app. */
  available: boolean;
  /* 'granted' while this device is registered for the user. */
  permission: NotificationPermission;
  /* Turns notifications on for this device. */
  subscribe: () => Promise<void>;
  /* Turns them off, and remembers that the user did. */
  unsubscribe: () => Promise<void>;
  /* Unregisters the device on sign-out, without remembering any choice: the
   * next user to sign in on this device starts as anyone else would. */
  release: () => Promise<void>;
};

/*
 * Notifications for the mobile app. The app holds the permission and the
 * device's token; the page registers that token with the portal for the
 * signed-in user, and removes it again when the user turns notifications off
 * or signs out.
 */
export function useAppPush({
  tenant,
  userId,
  isPending,
  scope,
}: {
  tenant: string;
  userId: string | undefined;
  isPending: boolean;
  scope: TenantScope;
}): AppPush {
  const bridge = useMobileBridge();
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const registeredToken = useRef<string | null>(null);
  /* Per user: the next person to sign in on this device decides for themselves. */
  const optedOutKey = `${OPTED_OUT_KEY}:${tenant}:${userId}`;

  const register = useCallback(async () => {
    if (!bridge) return;
    const reply = await requestApp(bridge, {type: 'push.register'});
    if (reply.type === 'push.denied') {
      setPermission('denied');
      return;
    }
    if (reply.type !== 'push.token') return;
    const response = await fetch(scope.forBrowser(MOBILE_DEVICES_PATH), {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({token: reply.token, platform: reply.platform}),
    });
    if (!response.ok) return;
    registeredToken.current = reply.token;
    setPermission('granted');
  }, [bridge, scope]);

  /* On load, a device that already has permission is registered again: its
   * token may have changed since, and the old one is forgotten as soon as a
   * notification to it is refused. */
  useEffect(() => {
    if (!bridge || !userId) return;
    (async () => {
      try {
        const status = await requestApp(bridge, {type: 'push.status'});
        if (status.type !== 'push.status') return;
        if (status.permission === 'denied') {
          setPermission('denied');
          return;
        }
        if (status.permission !== 'granted') return;
        let optedOut = false;
        try {
          optedOut = Boolean(window.localStorage.getItem(optedOutKey));
        } catch {
          /* Without storage no choice was remembered. */
        }
        if (optedOut) return;
        await register();
      } catch (error) {
        console.error('Failed to register the app for notifications:', error);
      }
    })();
  }, [bridge, optedOutKey, register, userId]);

  const subscribe = useCallback(async () => {
    try {
      window.localStorage.removeItem(optedOutKey);
    } catch {
      /* Without storage the choice is simply not remembered. */
    }
    try {
      await register();
    } catch (error) {
      console.error('Failed to turn on notifications for the app:', error);
    }
  }, [optedOutKey, register]);

  /* Throws when the portal did not forget the device, so the caller does not
   * report notifications as off while they still arrive. */
  const forget = useCallback(async () => {
    const token = registeredToken.current;
    if (!token) return;
    const response = await fetch(scope.forBrowser(MOBILE_DEVICES_PATH), {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({token}),
    });
    if (!response.ok) {
      throw new Error(`The device was not removed (HTTP ${response.status})`);
    }
    registeredToken.current = null;
    setPermission('default');
  }, [scope]);

  const unsubscribe = useCallback(async () => {
    try {
      await forget();
    } catch (error) {
      console.error('Failed to turn off notifications for the app:', error);
      return;
    }
    try {
      window.localStorage.setItem(optedOutKey, '1');
    } catch {
      /* Without storage the choice is simply not remembered. */
    }
  }, [forget, optedOutKey]);

  /* Signed out: this device stops receiving the previous user's notifications. */
  useEffect(() => {
    if (!userId && !isPending && registeredToken.current) {
      forget().catch(error =>
        console.error('Failed to unregister the app:', error),
      );
    }
  }, [forget, isPending, userId]);

  return useMemo(
    () => ({
      available: bridge !== null,
      permission,
      subscribe,
      unsubscribe,
      release: forget,
    }),
    [bridge, forget, permission, subscribe, unsubscribe],
  );
}
