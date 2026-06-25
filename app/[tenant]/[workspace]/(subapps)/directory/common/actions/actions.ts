'use server';
import type {ActionResponse} from '@/types/action';
import {headers} from 'next/headers';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {accessMessage} from '@/lib/core/access/denial';
import {ensureAuth} from '@/lib/core/access/ensure-auth';
import {t} from '@/lib/core/locale/server';
import {TENANT_HEADER} from '@/proxy';
import type {Cloned} from '@/types/util';
import {clone} from '@/utils';

// ---- LOCAL IMPORTS ---- //
import {findEntries} from '../orm';
import type {ListEntry} from '../types';
import {
  type SearchEntriesInput,
  SearchEntriesSchema,
} from '../utils/validators';

export async function searchEntries(
  props: SearchEntriesInput,
): ActionResponse<Cloned<ListEntry>[]> {
  const parsed = SearchEntriesSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {search, workspaceURL} = parsed.data;
  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('TenantId is required'),
    };
  }
  const access = await ensureAuth({
    code: SUBAPP_CODES.directory,
    url: workspaceURL,
    tenantId,
    allowGuest: true,
  });
  if (!access.ok)
    return {error: true, message: await accessMessage(access.reason)};
  const {client} = access;
  try {
    const entries = await findEntries({
      search,
      client,
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
