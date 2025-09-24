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
import {get} from 'lodash';
import {findFile, streamFile} from '@/utils/download';
import {MountType} from '@/app/[tenant]/[workspace]/(subapps)/website/common/types';
import {
  MOUNT_TYPE,
  mountTypes,
} from '@/app/[tenant]/[workspace]/(subapps)/website/common/constants';

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      tenant: string;
      workspace: string;
      mountType: MountType;
      websiteSlug: string;
      websitePageSlug: string;
      'content-id': string;
      path: string;
      'file-id': string;
    };
  },
) {
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);
  const {
    'content-id': contentId,
    'file-id': fileId,
    websitePageSlug,
    websiteSlug,
    path,
    mountType,
  } = params;

  if (!mountTypes.includes(mountType)) {
    return new NextResponse('Invalid mount type', {status: 400});
  }
  if (mountType === MOUNT_TYPE.MENU) {
    return new NextResponse('file download not supported for menu', {
      status: 400,
    });
  }
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
    code: SUBAPP_CODES.website,
    user,
    url: workspaceURL,
    tenantId,
  });
  if (!app?.installed) {
    return new NextResponse('Unauthorized', {status: 401});
  }

  let attrs;
  if (mountType === MOUNT_TYPE.PAGE) {
    const websitePage = await findWebsitePageBySlug({
      websiteSlug: websiteSlug,
      websitePageSlug: websitePageSlug,
      workspaceURL: workspaceURL,
      user,
      tenantId,
      contentId,
    });

    if (!websitePage?.contentLines?.[0]) {
      return new NextResponse('Page not found', {status: 404});
    }

    const line = await populateContent({
      line: websitePage.contentLines[0],
      tenantId,
      path: stringToPath(path),
    });
    attrs = line?.content?.attrs;
  } else {
    const website = await findWebsiteBySlug({
      websiteSlug,
      workspaceURL,
      user,
      tenantId,
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
    tenant: tenantId,
  });

  if (!file) {
    return new NextResponse('File not found', {status: 404});
  }

  return streamFile(file);
}

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
