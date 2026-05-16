import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import type {ReadableStream as NodeReadableStream} from 'stream/web';
import {pipeline} from 'stream/promises';
import {NextRequest, NextResponse} from 'next/server';

import {workspacePathname} from '@/utils/workspace';
import {z} from 'zod';
import {zodParseFormData} from '@/utils/formdata';
import {getFileSizeText} from '@/utils/files';
import {t} from '@/locale/server';
import {clone} from '@/utils';
import type {Client} from '@/goovee/.generated/client';

import {ensureAuth} from '../../common/utils/auth-helper';
import {findMyProductWithVersions} from '../../common/orm/orm';
import {productFormSchema} from '../../common/ui/components/product-form/schema';
import {MARKETPLACE_VERSION_STATUS} from '../../common/constant/statuses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_BUNDLE_SIZE = 20 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  props: {params: Promise<{tenant: string; workspace: string}>},
) {
  const params = await props.params;
  const {workspaceURL, tenant: tenantId} = workspacePathname(params);

  const {error, auth} = await ensureAuth(workspaceURL, tenantId, {
    allowGuest: false,
  });
  if (error || !auth.user) {
    return NextResponse.json(
      {error: true, message: await t('Unauthorized')},
      {status: 401},
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {error: true, message: await t('Invalid request body')},
      {status: 400},
    );
  }

  let payload;
  try {
    payload = zodParseFormData(formData, productFormSchema);
  } catch (e) {
    const message =
      e instanceof z.ZodError
        ? (e.issues[0]?.message ?? (await t('Invalid input')))
        : await t('Invalid input');
    return NextResponse.json({error: true, message}, {status: 400});
  }

  for (const v of payload.versions) {
    if (v.bundleFile && v.bundleFile.size > MAX_BUNDLE_SIZE) {
      return NextResponse.json(
        {error: true, message: await t('Bundle exceeds 20 MB limit')},
        {status: 413},
      );
    }
  }

  const {client} = auth.tenant;
  const storage = auth.tenant.config.aos.storage;
  if (!storage) {
    return NextResponse.json(
      {error: true, message: await t('Storage not configured')},
      {status: 500},
    );
  }
  if (!fs.existsSync(storage)) fs.mkdirSync(storage, {recursive: true});

  try {
    // If editing, verify ownership.
    if (payload.id) {
      const existing = await findMyProductWithVersions({
        productId: payload.id,
        userId: auth.user.id,
        client,
        workspace: auth.workspace,
      });
      if (!existing) {
        return NextResponse.json(
          {error: true, message: await t('Product not found')},
          {status: 404},
        );
      }
    }

    const productResult = await client.$transaction(async txClient => {
      // Upload any new bundle files first.
      const versionsWithFile = await Promise.all(
        payload.versions.map(async v => {
          if (!v.bundleFile)
            return {...v, uploadedFileId: null as string | null};
          const fileId = await uploadBundle(v.bundleFile, storage, txClient);
          return {...v, uploadedFileId: fileId};
        }),
      );

      let productId = payload.id;
      const productData = {
        name: payload.name,
        description: payload.description ?? null,
        longDescription: payload.longDescription || null,
        marketplaceTypeSelect: payload.marketplaceTypeSelect,
        marketplaceCoverStyle: payload.marketplaceCoverStyle,
        marketplaceIconCode: payload.marketplaceIconCode,
        documentationUrl: payload.documentationUrl || null,
        supportIssuesUrl: payload.supportIssuesUrl || null,
        supportContactUrl: payload.supportContactUrl || null,
        productCategory: {select: {id: payload.productCategoryId}},
      };

      if (productId) {
        const current = await txClient.aOSProduct.findOne({
          where: {id: productId},
          select: {id: true, version: true},
        });
        if (!current) throw new Error('Product not found');
        await txClient.aOSProduct.update({
          data: {id: productId, version: current.version, ...productData},
          select: {id: true},
        });
      } else {
        const code = `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const slug = slugify(payload.name);
        const created = await txClient.aOSProduct.create({
          data: {
            ...productData,
            code,
            slug,
            isMarketPlace: true,
            defaultSupplierPartner: {select: {id: auth.user!.id}},
            marketplaceCreatedBy: {select: {id: auth.user!.id}},
          },
          select: {id: true},
        });
        productId = created.id;
      }

      // Versions: update existing, create new.
      let latestVersionId: string | undefined;
      for (const v of versionsWithFile) {
        const compatRefs = v.compatibilitySetIds.map(id => ({id}));
        if (v.id) {
          const current = await txClient.aOSMarketplaceProductVersion.findOne({
            where: {id: v.id},
            select: {
              id: true,
              version: true,
              compatibilitySet: {select: {id: true}},
            },
          });
          if (!current) throw new Error('Version not found');
          const existingCompat = (current.compatibilitySet ?? []).map(
            c => c.id,
          );
          await txClient.aOSMarketplaceProductVersion.update({
            data: {
              id: v.id,
              version: current.version,
              versionNumber: v.versionNumber,
              changelog: v.changelog || null,
              statusSelect: v.statusSelect,
              ...(v.uploadedFileId && {
                bundleFile: {select: {id: v.uploadedFileId}},
              }),
              compatibilitySet: {
                ...(existingCompat.length && {remove: existingCompat}),
                ...(compatRefs.length && {select: compatRefs}),
              },
            },
            select: {id: true},
          });
          latestVersionId = v.id;
        } else {
          if (!v.uploadedFileId) throw new Error('Bundle file is required');
          const created = await txClient.aOSMarketplaceProductVersion.create({
            data: {
              versionNumber: v.versionNumber,
              changelog: v.changelog || null,
              statusSelect: v.statusSelect,
              bundleFile: {select: {id: v.uploadedFileId}},
              compatibilitySet: {select: compatRefs},
              product: {select: {id: productId!}},
              ...(v.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED && {
                dateOfApproval: new Date(),
              }),
            },
            select: {id: true},
          });
          latestVersionId = created.id;
        }
      }

      // Promote currentVersion to the most-recently-touched published one.
      const publishedNewest =
        await txClient.aOSMarketplaceProductVersion.findOne({
          where: {
            product: {id: productId!},
            statusSelect: MARKETPLACE_VERSION_STATUS.PUBLISHED,
          },
          orderBy: {versionNumber: 'DESC'},
          select: {id: true},
        });
      if (publishedNewest) {
        const productNow = await txClient.aOSProduct.findOne({
          where: {id: productId!},
          select: {id: true, version: true},
        });
        await txClient.aOSProduct.update({
          data: {
            id: productId!,
            version: productNow!.version,
            currentVersion: {select: {id: publishedNewest.id}},
          },
          select: {id: true},
        });
      }

      return {id: productId!, latestVersionId};
    });

    return NextResponse.json({success: true, data: productResult});
  } catch (e) {
    const message =
      e instanceof Error ? e.message : await t('An error occurred');
    return NextResponse.json({error: true, message}, {status: 500});
  }
}

async function uploadBundle(file: File, storage: string, client: Client) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${Date.now()}-${safeName}`;
  await pipeline(
    Readable.fromWeb(
      file.stream() as unknown as NodeReadableStream<Uint8Array>,
    ),
    fs.createWriteStream(path.resolve(storage, fileName)),
  );
  const meta = await client.aOSMetaFile
    .create({
      data: {
        fileName: file.name,
        filePath: fileName,
        fileType: file.type || 'application/zip',
        fileSize: String(file.size),
        sizeText: getFileSizeText(file.size),
        description: '',
      },
      select: {id: true},
    })
    .then(clone);
  return meta.id;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || `product-${Date.now()}`
  );
}
