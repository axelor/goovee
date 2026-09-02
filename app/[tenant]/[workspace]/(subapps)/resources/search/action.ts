'use server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';

// ---- LOCAL IMPORTS ---- //
import {searchFiles} from '@/subapps/resources/common/orm/dms';
import {FindDmsFilesSchema} from '@/subapps/resources/common/utils/validators';

const MIN_CHARS = 2;
const SEARCH_LIMIT = 20;

export type DocumentSearchResult = {
  id: string;
  fileName: string | null;
  parent: {id: string; fileName: string | null} | null;
  metaFile: {fileType: string | null} | null;
};

export async function searchDocuments({
  search,
}: {
  search: string;
}): Promise<DocumentSearchResult[]> {
  const parsed = FindDmsFilesSchema.safeParse({search});
  if (!parsed.success) return [];

  const q = search?.trim() ?? '';
  if (q.length < MIN_CHARS) return [];

  const access = await ensureAccess({
    code: SUBAPP_CODES.resources,
    allowGuest: true,
  });
  if (!access.ok) return [];

  const {user} = access;
  const {client} = access.tenant;
  const workspaceURL = access.url.key();

  const files = await searchFiles({
    search: q,
    workspaceURL,
    user,
    client,
    take: SEARCH_LIMIT,
  });

  return files as DocumentSearchResult[];
}
