'use server';

import {t} from '@/locale/server';
import {TENANT_HEADER} from '@/proxy';
import {manager} from '@/tenant';
import type {ActionResponse} from '@/types/action';
import {zodSafeParseFormData} from '@/utils/formdata';
import fs from 'fs';
import {headers} from 'next/headers';
import {z} from 'zod';
import {MARKETPLACE_VERSION_STATUS} from '../constants/statuses';
import {
  findMyProductWithVersions,
  syncProductVersionPointers,
  updateVersionStatus,
  uploadBundle,
} from '../orm';
import {
  MAX_BUNDLE_SIZE,
  versionSchema,
} from '../ui/components/forms/version-form/validator';
import {ensureAuth} from '../utils/auth-helper';
import {parseVersionNumber} from '../utils/version-number';

export async function saveVersion(
  formData: FormData,
): ActionResponse<{versionId: string}> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }

  const parsed = zodSafeParseFormData(
    formData,
    versionSchema.safeExtend({workspaceURL: z.string().min(1)}),
  );
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const payload = parsed.data;

  const {error, auth} = await ensureAuth(payload.workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  if (!payload.id && !auth.workspace.config.allowToPublish) {
    return {
      error: true,
      message: await t('Publishing is not allowed in this workspace'),
    };
  }

  if (payload.bundleFile && payload.bundleFile.size > MAX_BUNDLE_SIZE) {
    return {error: true, message: await t('Bundle exceeds 20 MB limit')};
  }

  const parts = parseVersionNumber(payload.versionNumber);
  if (!parts) {
    return {error: true, message: await t('Invalid version number')};
  }

  const existingProduct = await findMyProductWithVersions({
    productId: payload.productId,
    mainPartnerId: auth.user.mainPartnerId,
    client,
    workspace: auth.workspace,
  });
  if (!existingProduct) {
    return {error: true, message: await t('Product not found')};
  }

  /* App-level uniqueness: no other version of this product can hold the
   * same (vMajor, vMinor, vPatch, vPreRelease) tuple. */
  const duplicate = await client.aOSMarketplaceProductVersion.findOne({
    where: {
      product: {id: payload.productId},
      vMajor: parts.vMajor,
      vMinor: parts.vMinor,
      vPatch: parts.vPatch,
      vPreRelease:
        parts.vPreRelease === null ? {eq: null} : {eq: parts.vPreRelease},
      ...(payload.id ? {id: {ne: payload.id}} : {}),
    },
    select: {id: true},
  });
  if (duplicate) {
    return {
      error: true,
      message: await t('A version with this number already exists'),
    };
  }

  const tenant = await manager.getTenant(tenantId);
  const storage = tenant?.config.aos.storage;
  if (!storage) {
    return {error: true, message: await t('Storage not configured')};
  }
  if (!fs.existsSync(storage)) fs.mkdirSync(storage, {recursive: true});

  const effectiveStatus =
    payload.statusSelect === MARKETPLACE_VERSION_STATUS.DRAFT
      ? MARKETPLACE_VERSION_STATUS.DRAFT
      : auth.workspace.config.requiresReview
        ? MARKETPLACE_VERSION_STATUS.IN_REVIEW
        : MARKETPLACE_VERSION_STATUS.PUBLISHED;

  try {
    let uploadedFileId: string | null = null;
    if (payload.bundleFile) {
      uploadedFileId = await uploadBundle(payload.bundleFile, storage, client);
    }

    const compatRefs = payload.compatibilitySetIds.map(id => ({id}));
    let versionId: string;

    if (payload.id) {
      const current = await client.aOSMarketplaceProductVersion.findOne({
        where: {id: payload.id},
        select: {
          id: true,
          version: true,
          statusSelect: true,
          dateOfPublish: true,
          compatibilitySet: {select: {id: true}},
        },
      });
      if (!current) {
        return {error: true, message: await t('Version not found')};
      }
      if (payload.statusSelect === MARKETPLACE_VERSION_STATUS.DRAFT) {
        if (current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED) {
          return {
            error: true,
            message: await t(
              'A published version cannot be saved as a draft. Unpublish it first.',
            ),
          };
        }
        if (current.statusSelect === MARKETPLACE_VERSION_STATUS.IN_REVIEW) {
          return {
            error: true,
            message: await t(
              'An in-review version cannot be saved as a draft. Unpublish it first.',
            ),
          };
        }
      }
      const existingCompat = (current.compatibilitySet ?? []).map(c => c.id);
      const toRemove = existingCompat.filter(
        id => !compatRefs.find(({id: newId}) => newId === id),
      );
      /* Stamp `dateOfPublish` the first time a version enters PUBLISHED; keep
       * the original stamp on subsequent re-publishes (e.g. unpublish→publish
       * cycles preserve the original release date). */
      const transitioningToPublished =
        effectiveStatus === MARKETPLACE_VERSION_STATUS.PUBLISHED &&
        current.statusSelect !== MARKETPLACE_VERSION_STATUS.PUBLISHED &&
        !current.dateOfPublish;
      await client.aOSMarketplaceProductVersion.update({
        select: {id: true},
        data: {
          id: payload.id,
          version: current.version,
          vMajor: parts.vMajor,
          vMinor: parts.vMinor,
          vPatch: parts.vPatch,
          vPreRelease: parts.vPreRelease,
          changelog: payload.changelog || null,
          statusSelect: effectiveStatus,
          ...(transitioningToPublished && {dateOfPublish: new Date()}),
          ...(uploadedFileId && {
            bundleFile: {select: {id: uploadedFileId}},
          }),
          compatibilitySet: {
            ...(existingCompat.length && {remove: toRemove}),
            ...(compatRefs.length && {select: compatRefs}),
          },
        },
      });
      versionId = payload.id;
    } else {
      if (!uploadedFileId) {
        return {error: true, message: await t('Bundle file is required')};
      }
      const created = await client.aOSMarketplaceProductVersion.create({
        select: {id: true},
        data: {
          vMajor: parts.vMajor,
          vMinor: parts.vMinor,
          vPatch: parts.vPatch,
          vPreRelease: parts.vPreRelease,
          changelog: payload.changelog || null,
          statusSelect: effectiveStatus,
          bundleFile: {select: {id: uploadedFileId}},
          compatibilitySet: {select: compatRefs},
          product: {select: {id: payload.productId}},
          dateOfSubmission: new Date(),
          ...(effectiveStatus === MARKETPLACE_VERSION_STATUS.PUBLISHED && {
            dateOfPublish: new Date(),
          }),
        },
      });
      versionId = created.id;
    }

    await syncProductVersionPointers({
      client,
      productId: payload.productId,
    });

    return {success: true, data: {versionId}};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
}

const unpublishVersionSchema = z.object({
  versionId: z.string().min(1),
  productId: z.string().min(1),
  workspaceURL: z.string().min(1),
});

type UnpublishVersionInput = z.infer<typeof unpublishVersionSchema>;

export async function unpublishVersion(
  input: UnpublishVersionInput,
): ActionResponse<true> {
  const tenantId = (await headers()).get(TENANT_HEADER);
  if (!tenantId) {
    return {error: true, message: await t('TenantId is required')};
  }
  const parsed = unpublishVersionSchema.safeParse(input);
  if (!parsed.success) {
    return {error: true, message: z.prettifyError(parsed.error)};
  }
  const {versionId, productId, workspaceURL} = parsed.data;

  const {error, auth} = await ensureAuth(workspaceURL, tenantId);
  if (error || !auth.user) {
    return {error: true, message: await t('Unauthorized')};
  }
  const {client} = auth.tenant;

  const owned = await findMyProductWithVersions({
    productId,
    mainPartnerId: auth.user.mainPartnerId,
    client,
    workspace: auth.workspace,
  });
  if (!owned) {
    return {error: true, message: await t('Product not found')};
  }

  const current = await client.aOSMarketplaceProductVersion.findOne({
    where: {id: versionId, product: {id: productId}},
    select: {id: true, version: true, statusSelect: true},
  });
  if (!current) {
    return {error: true, message: await t('Version not found')};
  }
  if (
    current.statusSelect !== MARKETPLACE_VERSION_STATUS.PUBLISHED &&
    current.statusSelect !== MARKETPLACE_VERSION_STATUS.IN_REVIEW
  ) {
    return {
      error: true,
      message: await t(
        'Only published or in-review versions can be unpublished',
      ),
    };
  }

  try {
    await updateVersionStatus({
      client,
      versionId: current.id,
      version: current.version,
      statusSelect: MARKETPLACE_VERSION_STATUS.UNPUBLISHED,
    });
    await syncProductVersionPointers({client, productId});
    return {success: true, data: true};
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return {error: true, message};
  }
}
