import {z} from 'zod';
import {SUBAPP_CODES} from '@/constants';
import {getSession} from '@/lib/core/auth';
import {findSubappAccess, findWorkspace} from '@/orm/workspace';
import {workspacePathname} from '@/utils/workspace';
import {NextRequest, NextResponse} from 'next/server';
import {
  findWebsiteBySlug,
  findWebsitePageBySlug,
  populateContent,
} from '@/subapps/website/common/orm/website';
import {get} from 'lodash-es';
import {findFile, streamFile} from '@/utils/download';
import {LayoutMountType} from '@/app/[tenant]/[workspace]/(subapps)/website/common/types';
import {MOUNT_TYPE} from '@/app/[tenant]/[workspace]/(subapps)/website/common/constants';
import {MountTypeSchema} from '@/app/[tenant]/[workspace]/(subapps)/website/common/utils/validators';
import {manager} from '@/tenant';

export async function GET(
  req: NextRequest,
  props: {
    params: Promise<{
      tenant: string;
      workspace: string;
      mountType: string;
      websiteSlug: string;
      websitePageSlug: string;
      'content-id': string;
      path: string;
      'file-id': string;
    }>;
  },
) {
  const params = await props.params;
  const {
    workspaceURL,
    workspaceURI,
    tenant: tenantId,
  } = workspacePathname(params);
  const {
    'content-id': contentId,
    'file-id': fileId,
    websitePageSlug,
    websiteSlug,
    path,
    mountType: mountTypeParam,
  } = params;

  const mountTypeResult = MountTypeSchema.safeParse(mountTypeParam);
  if (!mountTypeResult.success) {
    return new NextResponse(z.prettifyError(mountTypeResult.error), {
      status: 400,
    });
  }
  const mountType = mountTypeResult.data;

  if (mountType === MOUNT_TYPE.MENU) {
    return new NextResponse('file download not supported for menu', {
      status: 400,
    });
  }
  const session = await getSession();
  const user = session?.user;

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) {
    return new NextResponse('Invalid tenant', {status: 401});
  }
  const {client, config} = tenant;

  const workspace = await findWorkspace({
    user,
    url: workspaceURL,
    client,
  });

  if (!workspace) {
    return new NextResponse('Invalid workspace', {status: 401});
  }

  const app = await findSubappAccess({
    code: SUBAPP_CODES.website,
    user,
    url: workspaceURL,
    client,
  });
  if (!app?.isInstalled) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  let attrs;
  if (mountType === MOUNT_TYPE.PAGE) {
    const websitePage = await findWebsitePageBySlug({
      websiteSlug: websiteSlug,
      websitePageSlug: websitePageSlug,
      workspaceURL: workspaceURL,
      user,
      client,
      contentId,
    });

    if (!websitePage?.contentLines?.[0]) {
      return new NextResponse('Page not found', {status: 404});
    }

    const line = await populateContent({
      line: websitePage.contentLines[0],
      client,
      config,
      path: stringToPath(path),
    });
    attrs = line?.content?.attrs;
  } else {
    const website = await findWebsiteBySlug({
      websiteSlug,
      workspaceURL,
      workspaceURI,
      user,
      client,
      config,
      mountTypes: [mountType],
      path: stringToPath(path),
    });
    if (!website) {
      return new NextResponse('Website not found', {status: 404});
    }
    if (mountType === MOUNT_TYPE.FOOTER) attrs = website.footer?.attrs;
    if (mountType === MOUNT_TYPE.HEADER) attrs = website.header?.attrs;
  }

  const metaFile = get(attrs, path);

  if (!isMetaFile(metaFile)) {
    return new NextResponse(`Path: ${path} doesn't have a metaFile`, {
      status: 404,
    });
  }

  if (String(metaFile.id) !== String(fileId)) {
    return new NextResponse(`file Id : ${fileId} doesn't match`, {status: 404});
  }

  const file = await findFile({
    id: metaFile.id,
    meta: true,
    client: tenant.client,
    storage: tenant.config.aos.storage,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}

//TODO: To be 100% sure that it's a meta file, we should check model definition
//instead of relying on file structure
const isMetaFile = (file: any): boolean => {
  return !!(file?.filePath && file?.fileName && file?.id);
};

// lodash interal function
const stringToPath = function (string: string) {
  const result = [];
  const rePropName =
    /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
  const reEscapeChar = /\\(\\)?/g;
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('');
  }
  //@ts-expect-error second argument can not be function, but it is a hack lodash uses
  string.replace(rePropName, function (match, number, quote, subString) {
    result.push(
      quote ? subString.replace(reEscapeChar, '$1') : number || match,
    );
  });
  return result;
};
