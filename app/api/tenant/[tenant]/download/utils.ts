import fs, {Stats} from 'fs';
import {manager} from '@/tenant';
import {NextResponse} from 'next/server';
import type {ReadableOptions} from 'stream';

export async function findFile({
  id,
  meta,
  tenant: tenantId,
}: {
  id: string;
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
    fileName = record?.fileName;
    fileType = record?.fileType;
  } else {
    record = await client.aOSDMSFile.findOne({
      where: {id},
      select: {
        metaFile: {filePath: true, fileName: true, fileType: true},
      },
    });

    if (!record) {
      return null;
    }

    filePath = `${storage}/${record?.metaFile?.filePath}`;
    fileName = record?.metaFile?.fileName;
    fileType = record?.metaFile?.fileType;
  }

  return {
    record,
    fileName,
    filePath,
    fileType,
  };
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
      }),
    });

    return res;
  } catch (err) {
    return new NextResponse('Error downloading file', {status: 500});
  }
}
