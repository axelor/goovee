import {NextRequest, NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {accessStatus} from '@/lib/core/access/denial';
import {findFile, streamFile} from '@/utils/download';

// ---- LOCAL IMPORTS ---- //
import {findEventCategory} from '@/app/[tenant]/[workspace]/(subapps)/events/common/orm/event-category';
import {type Category} from '@/subapps/events/common/types';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'category-id': string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {'category-id': categoryId, 'file-id': fileId} = params;

  const access = await ensureAccess({
    code: SUBAPP_CODES.events,
    allowGuest: true,
  });
  if (!access.ok) {
    return new NextResponse('Unauthorized', {
      status: accessStatus(access.reason),
    });
  }
  const {client} = access.tenant;

  const workspaceURL = access.workspace.url;

  const category = await findEventCategory({
    client,
    workspaceURL,
    id: categoryId,
    user: access.user,
  });

  if (!category) {
    return new NextResponse('Category not found', {status: 404});
  }

  if (!isEventCategoryImage({fileId, category})) {
    return new NextResponse('Image not found', {status: 404});
  }

  const file = await findFile({
    id: String(fileId),
    meta: true,
    client,
    storage: access.tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile({...file, request});
}

function isEventCategoryImage({
  fileId,
  category,
}: {
  fileId: string;
  category: Category;
}) {
  if (category.image?.id && String(fileId) === String(category.image.id)) {
    return true;
  }
  if (
    category.thumbnailImage?.id &&
    String(fileId) === String(category.thumbnailImage.id)
  ) {
    return true;
  }
  return false;
}
