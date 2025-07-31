'use server';

import {headers} from 'next/headers';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/middleware';
import {findSubappAccess} from '@/orm/workspace';
import type {ID, PortalWorkspace, Website, WebsitePage} from '@/types';
import {manager} from '@/tenant';
import type {ActionResponse} from '@/types/action';

// ---- LOCAL IMPORTS ---- //
import {
  findAllMainWebsiteLanguages,
  findWebsiteBySlug,
  findWebsitePageBySlug,
} from '../orm/website';
import {getWiki1ContentFieldName} from '../templates/wiki-1';

export async function getLocaleRedirectionURL({
  workspaceURL,
  websiteSlug,
  websitePageSlug,
}: {
  workspaceURL: PortalWorkspace['url'];
  websiteSlug: Website['slug'];
  websitePageSlug: WebsitePage['slug'];
}) {
  const session = await getSession();
  const user = session?.user;

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!(workspaceURL && websiteSlug)) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.website,
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!subapp)
    return {
      error: true,
      message: await t('Bad request'),
    };

  const website = await findWebsiteBySlug({
    websiteSlug,
    workspaceURL,
    user,
    tenantId,
  });

  if (!website) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const mainWebsiteLanguages = await findAllMainWebsiteLanguages({
    mainWebsiteId: website?.mainWebsite?.id,
    workspaceURL,
    user,
    tenantId,
  });

  if (!mainWebsiteLanguages?.length) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const languageListItem = mainWebsiteLanguages?.find(
    (i: any) => i?.website?.slug === websiteSlug,
  );

  if (!languageListItem) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const {language}: any = languageListItem;

  if (!language) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const baseURL = `${workspaceURL}/${SUBAPP_CODES.website}/${websiteSlug}`;

  if (websitePageSlug) {
    const client = await manager.getClient(tenantId);
    const websitePage = await client.aOSPortalCmsPage.findOne({
      where: {
        slug: websitePageSlug,
        pageSet: {
          language: {
            code: language.code,
          },
        },
      },
      select: {
        pageSet: true,
      },
    });
    const relatedPage = websitePage?.pageSet?.[0];

    if (relatedPage) {
      return {
        success: true,
        data: {
          url: `${baseURL}/${relatedPage?.slug}`,
        },
      };
    }
  }

  return {
    success: true,
    data: {
      url: `${workspaceURL}/${SUBAPP_CODES.website}/${websiteSlug}`,
    },
  };
}

export async function updateWikiContent({
  workspaceURL,
  websiteSlug,
  websitePageSlug,
  contentId,
  contentVersion,
  content,
}: {
  workspaceURL: PortalWorkspace['url'];
  websiteSlug: Website['slug'];
  websitePageSlug: WebsitePage['slug'];
  contentId: ID;
  contentVersion: number;
  content: any;
}): ActionResponse<{id: string; version: number}> {
  const session = await getSession();
  const user = session?.user;

  const tenantId = headers().get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  if (!(workspaceURL && websiteSlug && contentId)) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.website,
    user,
    url: workspaceURL,
    tenantId,
  });

  if (!subapp)
    return {
      error: true,
      message: await t('Bad request'),
    };

  const websitePage = await findWebsitePageBySlug({
    websiteSlug,
    websitePageSlug,
    workspaceURL,
    user,
    tenantId,
  });

  if (!websitePage) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const contentLine = websitePage.contentLines.find(
    line => line?.content?.id === contentId,
  );

  if (!contentLine) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const attributes = contentLine.content?.attrs;

  const client = await manager.getClient(tenantId);
  const fieldName = getWiki1ContentFieldName();
  const newContent = await client.aOSPortalCmsContent.update({
    data: {
      id: String(contentId),
      version: contentVersion,
      attrs: {...attributes, [fieldName]: content} as any,
    },
  });
  return {
    success: true,
    data: {
      id: newContent.id,
      version: newContent.version,
    },
  };
}
