'use server';
import type {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {t} from '@/lib/core/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {Cloned} from '@/types/util';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {findEntries} from '../orm';
import type {ListEntry} from '../types';
import {ensureAuth} from '../utils/auth-helper';

export async function searchEntries({
  search,
  workspaceURL,
}: {
  search?: string;
  workspaceURL: string;
}): ActionResponse<Cloned<ListEntry>[]> {
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }
  const {error, message} = await ensureAuth(workspaceURL, tenantId);
  if (error) return {error: true, message};
  try {
    const entries = await findEntries({
      search,
      tenantId,
      take: 7,
    });

    return {success: true, data: clone(entries)};
  } catch (e) {
    if (e instanceof Error) {
      return {error: true, message: e.message};
    }
    throw e;
  }
}
