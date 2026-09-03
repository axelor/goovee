'use server';

import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {accessMessage} from '@/lib/core/access/denial';
import {ensureAccess} from '@/lib/core/access/ensure-access';
import {t} from '@/locale/server';
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
  const {websiteSlug, websitePageSlug} = parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    allowGuest: true,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client, config} = access.tenant;
  const workspaceURL = access.workspace.url;
  const workspaceURI = access.url.forRouter();

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
      url: baseURL,
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
  const {websiteSlug, websitePageSlug, contentId, contentVersion, content} =
    parsed.data;

  const access = await ensureAccess({
    code: SUBAPP_CODES.website,
    allowGuest: false,
  });
  if (!access.ok) {
    return {error: true, message: await accessMessage(access.reason)};
  }

  const {user} = access;
  const {client} = access.tenant;
  const workspaceURL = access.workspace.url;

  if (!(await canEditWiki({userId: user.id, client}))) {
    return {
      error: true,
      message: await t('Unauthorized'),
    };
  }

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
