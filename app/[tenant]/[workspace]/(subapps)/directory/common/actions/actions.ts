'use server';
import type {ActionResponse} from '@/types/action';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {accessMessage} from '@/lib/core/access/denial';
import {ensureAccess} from '@/lib/core/access/ensure-access';
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
  const {search} = parsed.data;
  const access = await ensureAccess({
    code: SUBAPP_CODES.directory,
    allowGuest: true,
  });
  if (!access.ok)
    return {error: true, message: await accessMessage(access.reason)};
  const {client} = access.tenant;
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
