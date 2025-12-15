import type {Stats} from 'fs';
import fs from 'fs';
import {NextResponse} from 'next/server';
import type {ReadableOptions} from 'stream';

// ---- CORE IMPORTS ---- //
import {filterPrivate} from '@/orm/filter';
import {manager} from '@/tenant';
import type {ID, User} from '@/types';

export async function findFile({
  id,
  meta,
  tenant: tenantId,
}: {
  id: ID;
  meta?: boolean;
  tenant: string;
}) {
  if (!id && tenantId) {
    return null;
  }

  let tenant;

  try {
    tenant = await manager.getTenant(tenantId);
  } catch (err) {
    return null;
  }

  if (!(tenant?.client && tenant?.config && tenant?.config?.aos?.storage)) {
    return null;
  }

  const storage = tenant?.config?.aos?.storage;
  const {client} = tenant;

  let record, filePath, fileName, fileType;

  if (meta) {
    record = await client.aOSMetaFile.findOne({
      where: {id},
      select: {
        filePath: true,
        fileName: true,
        fileType: true,
      },
    });

    if (!record) {
      return null;
    }

    filePath = `${storage}/${record?.filePath}`;
    fileName = record.fileName!;
    fileType = record.fileType!;
  } else {
    record = await client.aOSDMSFile.findOne({
      where: {id},
      select: {
        metaFile: {
          filePath: true,
          fileName: true,
          fileType: true,
        },
      },
    });

    if (!record?.metaFile) {
      return null;
    }

    filePath = `${storage}/${record.metaFile.filePath}`;
    fileName = record.metaFile.fileName!;
    fileType = record.metaFile.fileType!;
  }

  return {
    record,
    fileName,
    filePath,
    fileType,
  };
}

export async function findLatestDMSFileByName({
  tenant: tenantId,
  user,
  relatedId,
  relatedModel,
  name,
}: {
  tenant: string;
  relatedId: any;
  relatedModel: string;
  user: User;
  name: string;
}) {
  if (!tenantId || !user) {
    return null;
  }

  try {
    const tenant = await manager.getTenant(tenantId);
    if (!(tenant?.client && tenant?.config && tenant?.config?.aos?.storage)) {
      return null;
    }

    const storage = tenant?.config?.aos?.storage;
    const {client} = tenant;

    const record = await client.aOSDMSFile.findOne({
      where: {
        isDirectory: false,
        relatedId,
        relatedModel,
        parent: {relatedModel},
        fileName: {like: `%${name}%`},
        ...(await filterPrivate({tenantId, user})),
      },
      select: {
        metaFile: {
          filePath: true,
          fileName: true,
          fileType: true,
        },
      },
      orderBy: {
        updatedOn: 'DESC',
      } as any,
    });

    if (!record?.metaFile) return null;
    const filePath = `${storage}/${record.metaFile.filePath}`;
    const fileName = record.metaFile.fileName!;
    const fileType = record.metaFile.fileType!;

    return {
      record,
      filePath,
      fileName,
      fileType,
    };
  } catch (error) {
    console.error('Error while getting DMS file:', error);
    return null;
  }
}

export function createStream(
  path: string,
  options?: ReadableOptions,
): ReadableStream<Uint8Array> {
  const downloadStream = fs.createReadStream(path, options);

  return new ReadableStream({
    start(controller) {
      downloadStream.on('data', (chunk: Buffer) =>
        controller.enqueue(new Uint8Array(chunk)),
      );
      downloadStream.on('end', () => controller.close());
      downloadStream.on('error', (error: NodeJS.ErrnoException) =>
        controller.error(error),
      );
    },
    cancel() {
      downloadStream.destroy();
    },
  });
}

export async function streamFile({
  fileName,
  filePath,
  fileType,
}: {
  fileName: string;
  filePath: string;
  fileType: string;
}) {
  if (!(fileName && filePath && fileType)) {
    return new NextResponse('Bad request', {status: 400});
  }

  try {
    const data: ReadableStream<Uint8Array> = createStream(filePath);
    const stats: Stats = await fs.promises.stat(filePath);
    const res = new NextResponse(data, {
      status: 200,
      headers: new Headers({
        'content-disposition': `attachment; filename=${fileName}`,
        'content-type': fileType,
        'content-length': stats.size + '',
        'access-control-expose-headers': 'Content-Disposition',
      }),
    });

    return res;
  } catch (err) {
    return new NextResponse('Error downloading file', {status: 500});
  }
}
