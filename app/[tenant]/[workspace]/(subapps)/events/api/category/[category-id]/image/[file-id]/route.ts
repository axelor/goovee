import {NextRequest, NextResponse} from 'next/server';

import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {findFile, streamFile} from '@/utils/download';
import {workspacePathname} from '@/utils/workspace';

import {findEventCategory} from '@/app/[tenant]/[workspace]/(subapps)/events/common/orm/event-category';
import {type Category} from '@/app/[tenant]/[workspace]/(subapps)/events/common/ui/components/events';

export async function GET(
  request: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      'category-id': string;
      'file-id': string;
    }>;
  }
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {'category-id': categoryId, 'file-id': fileId} = params;

  const session = await getSession();
  const user = session?.user;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.events,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  const category = await findEventCategory({
    tenantId,
    workspace,
    id: categoryId,
    user,
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
    tenant: tenantId,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
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
