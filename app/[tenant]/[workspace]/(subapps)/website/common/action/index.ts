'use server';

import {headers} from 'next/headers';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {getSession} from '@/auth';
import {SUBAPP_CODES} from '@/constants';
import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {findSubappAccess} from '@/orm/workspace';
import {manager} from '@/tenant';
import type {ActionResponse} from '@/types/action';

// ---- LOCAL IMPORTS ---- //
import {
  canEditWiki,
  findAllMainWebsiteLanguages,
  findWebsiteBySlug,
  findWebsitePageBySlug,
} from '../orm/website';
import {
  getWiki1ContentFieldName,
  getWikiComponentCode,
} from '../templates/wiki-1/meta';
import {
  type LocaleRedirectionInput,
  LocaleRedirectionSchema,
  UpdateWikiContentInput,
  UpdateWikiContentSchema,
} from './validators';

export async function getLocaleRedirectionURL(
  props: LocaleRedirectionInput,
): ActionResponse<{url: string}> {
  const parsed = LocaleRedirectionSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {workspaceURL, workspaceURI, websiteSlug, websitePageSlug} =
    parsed.data;
  const session = await getSession();
  const user = session?.user;

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client, config} = tenant;

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.website,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp)
    return {
      error: true,
      message: await t('Bad request'),
    };

  const website = await findWebsiteBySlug({
    websiteSlug,
    workspaceURL,
    workspaceURI,
    user,
    client,
    config,
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
    client,
  });

  if (!mainWebsiteLanguages?.length) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const languageListItem = mainWebsiteLanguages?.find(
    i => i?.website?.slug === websiteSlug,
  );

  if (!languageListItem) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const {language} = languageListItem;

  if (!language) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const baseURL = `${workspaceURI}/${SUBAPP_CODES.website}/${websiteSlug}`;

  if (websitePageSlug) {
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
        pageSet: {select: {slug: true}},
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
      url: `${workspaceURI}/${SUBAPP_CODES.website}/${websiteSlug}`,
    },
  };
}

export async function updateWikiContent(
  props: UpdateWikiContentInput,
): ActionResponse<{id: string; version: number}> {
  const parsed = UpdateWikiContentSchema.safeParse(props);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {
    workspaceURL,
    websiteSlug,
    websitePageSlug,
    contentId,
    contentVersion,
    content,
  } = parsed.data;
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const tenantId = (await headers()).get(TENANT_HEADER);

  if (!tenantId) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  if (!tenant) return {error: true, message: await t('Invalid tenant')};
  const {client} = tenant;

  if (!(await canEditWiki({userId: user.id, client}))) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

  const subapp = await findSubappAccess({
    code: SUBAPP_CODES.website,
    user,
    url: workspaceURL,
    client,
  });

  if (!subapp)
    return {
      error: true,
      message: await t('Bad request'),
    };

  const websitePage = await findWebsitePageBySlug({
    websiteSlug,
    websitePageSlug: websitePageSlug ?? null,
    workspaceURL,
    user,
    client,
    contentId,
  });

  if (!websitePage) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const contentLine = websitePage.contentLines?.find(
    line => line?.content?.id === contentId,
  );

  if (contentLine?.content?.component?.code !== getWikiComponentCode()) {
    return {
      error: true,
      message: await t('Bad request'),
    };
  }

  const attributes = await contentLine.content?.attrs;

  const fieldName = getWiki1ContentFieldName();
  const newContent = await client.aOSPortalCmsContent.update({
    data: {
      id: String(contentId),
      version: contentVersion,
      attrs: Promise.resolve({...attributes, [fieldName]: content}),
    },
    select: {id: true},
  });
  return {
    success: true,
    data: {
      id: newContent.id,
      version: newContent.version,
    },
  };
}
