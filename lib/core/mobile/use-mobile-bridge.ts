'use client';

import {useEffect, useState} from 'react';

import {useEnvironment} from '@/environment';

import {getMobileBridge} from './bridge';
import type {MobileBridge} from './contract';
import {isMobileAppEnabled} from './enabled';

/*
 * The mobile app's bridge when this page runs inside the app, otherwise null.
 * Null as well on a tenant that does not use the app, whose pages then behave
 * as on the web. Null during the server render and the first client render, so
 * both agree.
 */
export function useMobileBridge(): MobileBridge | null {
  const [bridge, setBridge] = useState<MobileBridge | null>(null);
  const environment = useEnvironment();
  const enabled = isMobileAppEnabled(environment);
  useEffect(() => {
    setBridge(enabled ? getMobileBridge() : null);
  }, [enabled]);
  return bridge;
}
