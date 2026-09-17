import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {Readable} from 'stream';
import {z} from 'zod';

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
  UploadPartCommand,
  type StorageClass,
} from '@aws-sdk/client-s3';

import type {TenantConfig} from '@/config/schema';

import {writeAll} from './bytes';
import {isObjectKey, objectPrefix} from './paths';
import {isTransferInterrupted} from './transfer';
import {
  MetaFileStoreType,
  StoreKeyError,
  StoreStateError,
  type FileStore,
  type ReadOptions,
  type ResumableWrite,
  type WriteState,
  type StoredFile,
  type WriteOptions,
} from './store';

export type S3StorageConfig = Extract<
  TenantConfig['aos']['storage'],
  {provider: 's3'}
>['s3'];

/*
 * A write in progress, as the bucket and the scratch directory hold it between
 * requests: the parts the bucket has acknowledged, and the name under which the
 * bytes that do not yet fill a part are staged.
 */
const SpillState = z.object({
  /*
   * Null until a part is actually shipped. A file that never fills one is
   * stored in a single request at `finish`, so a small upload never opens a
   * multipart it would only have to complete in two more calls.
   */
  uploadId: z.string().min(1).nullable(),
  parts: z.array(
    z.object({
      number: z.int().positive(),
      size: z.int().positive(),
      tag: z.string().min(1),
    }),
  ),
  spill: z.string().regex(/^[0-9a-f-]{36}$/),
  /* Carried here so a write taken up again can open the upload it deferred
   * without the caller having to hand the type back. */
  contentType: z.string(),
  /* Pinned when the write opens, not read from configuration as it goes: a
   * deployment that changes it mid-session would otherwise leave the parts
   * already shipped one size and the rest another, which a service that
   * reassembles by position refuses at completion. */
  partSize: z.int().positive(),
});

type SpillState = z.infer<typeof SpillState>;

/**
 * A file assembled from parts, with the bytes that do not yet fill one staged
 * on local disk.
 *
 * A bucket cannot be appended to, so bytes are gathered locally until they fill
 * a part. At most `partSize` of them are held at a time, and they are what lets
 * a write resume at the byte it stopped on rather than at a part boundary.
 *
 * Every part but the last carries exactly `partSize` bytes: the S3 API demands
 * that of every part but the last, and services that reassemble by position
 * demand it of all of them.
 */
class S3Write implements ResumableWrite {
  #state: SpillState;
  #offset: number;

  constructor(
    private readonly store: S3Store,
    private readonly key: string,
    state: SpillState,
    offset: number,
  ) {
    this.#state = state;
    this.#offset = offset;
  }

  private get contentType(): string {
    return this.#state.contentType;
  }

  get offset(): number {
    return this.#offset;
  }

  get state(): WriteState {
    return this.#state;
  }

  private spillFile(number: number): string {
    return this.store.scratchFile(`${this.#state.spill}.${number}`);
  }

  async append(body: Readable): Promise<void> {
    const partSize = this.#state.partSize;

    await this.store.openScratch();

    let number = this.#state.parts.length + 1;
    let held = await this.store.fileSize(this.spillFile(number));

    /* Appended, because what this file already holds are received bytes for the
     * range it covers: an earlier attempt whose commit never landed leaves them
     * here, and `resumeWrite` has already counted them into the offset the
     * caller was answered with. The open inside the loop truncates instead, for
     * a reason of its own — neither follows the other. */
    let handle = await fs.promises.open(this.spillFile(number), 'a');

    /* False between handing a part over and opening the next file, where a
     * part the bucket refuses leaves the loop with nothing left to flush. */
    let holding = true;

    try {
      for await (const chunk of body) {
        let piece: Buffer = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk as Uint8Array);

        /* Split at the boundary: the part is handed over as soon as it is
         * complete, and what is left opens the next one. */
        while (held + piece.length >= partSize) {
          const room = partSize - held;

          await writeAll(handle, piece.subarray(0, room));
          await handle.sync();
          holding = false;
          await handle.close();

          await this.shipPart(number, partSize);

          number += 1;
          held = 0;
          piece = piece.subarray(room);

          /* Truncated, unlike the open above: this part starts at byte 0 by
           * construction, and a file left here by an attempt that got this far
           * and was never committed holds a copy of the bytes about to be
           * written. Appending to it would count them twice and push every
           * later byte out of place. */
          handle = await fs.promises.open(this.spillFile(number), 'w');
          holding = true;
        }

        if (piece.length) {
          await writeAll(handle, piece);
          held += piece.length;
        }
      }
    } catch (error) {
      /* The body stopped before it was done. Whatever arrived is kept and
       * counted below, which is what lets the next piece carry on from the byte
       * this one reached. A failure to write, or a part the bucket refused, is
       * not the body's fault and is raised. */
      if (!isTransferInterrupted(error)) throw error;
    } finally {
      try {
        /* Flushed before the caller is told how many bytes are held, and a
         * failure raised: the caller records this count, and one covering
         * bytes the disk never took sends the client past a gap. */
        if (holding) await handle.sync();

        held = await this.store.fileSize(this.spillFile(number));
        this.#offset = this.shippedBytes() + held;
      } finally {
        if (holding) await handle.close();
      }
    }
  }

  private shippedBytes(): number {
    return this.#state.parts.reduce((total, part) => total + part.size, 0);
  }

  private async shipPart(number: number, size: number): Promise<void> {
    /* Opened on the first part that has to be shipped, not when the write was:
     * a file that never fills one then opens no upload to release. */
    const uploadId =
      this.#state.uploadId ??
      (await this.store.createUpload(this.key, this.contentType));

    const tag = await this.store.uploadPart({
      key: this.key,
      uploadId,
      number,
      size,
      body: fs.createReadStream(this.spillFile(number)),
    });

    this.#state = {
      ...this.#state,
      uploadId,
      parts: [...this.#state.parts, {number, size, tag}],
    };

    /* The bucket holds these bytes now, so a failure to remove the file is left
     * to the sweep rather than failing a part that was stored. */
    await fs.promises
      .rm(this.spillFile(number), {force: true})
      .catch(() => undefined);
  }

  async finish({size, contentType}: WriteOptions): Promise<void> {
    if (this.#offset !== size) {
      throw new Error(
        `Assembled ${this.#offset} bytes for ${this.key}, expected ${size}; the file was not kept.`,
      );
    }

    const number = this.#state.parts.length + 1;
    const spill = this.spillFile(number);
    const remainder = await this.store.fileSize(spill);

    /* Never filled a part, so it is whole on local disk already and a single
     * request stores it. */
    if (!this.#state.uploadId) {
      await this.store.write(this.key, fs.createReadStream(spill), {
        size,
        contentType: contentType || this.contentType,
      });

      await this.store.removeScratch(`${this.#state.spill}.`);

      return;
    }

    /* The last part is the only one allowed below `partSize`, and a file whose
     * length fell on a boundary has none left to ship. */
    if (remainder) await this.shipPart(number, remainder);

    await this.store.completeUpload({
      key: this.key,
      uploadId: this.#state.uploadId,
      parts: this.#state.parts,
    });

    /* The zero-byte file the last boundary opened, which nothing would glob for
     * once the record gives up this write's name. */
    await this.store.removeScratch(`${this.#state.spill}.`);
  }

  async abort(): Promise<void> {
    if (this.#state.uploadId) {
      await this.store.abortUpload(this.key, this.#state.uploadId);
    }

    /* Found rather than computed from the recorded parts: a state older than
     * the directory — a part shipped whose state never landed — names fewer
     * files than exist, and the rest would be left behind for good. */
    await this.store.removeScratch(`${this.#state.spill}.`);
  }
}

/*
 * The region a request is signed for when the configuration names none. An
 * S3-compatible service outside AWS ignores it but the client insists on one;
 * this is the value AWS itself treats as the default.
 */
const DEFAULT_REGION = 'us-east-1';

export {DEFAULT_PART_SIZE, MAX_PART_SIZE, MIN_PART_SIZE} from './s3-limits';

/** How AOP spells the two server-side encryption modes, as the S3 API spells them. */
const ENCRYPTION = {
  'SSE-S3': 'AES256',
  'SSE-KMS': 'aws:kms',
} as const;

function isNotFound(error: unknown): boolean {
  return (
    error instanceof S3ServiceException &&
    (error.name === 'NotFound' ||
      error.name === 'NoSuchKey' ||
      error.$metadata.httpStatusCode === 404)
  );
}

/**
 * A bucket on an S3-compatible service, holding the same objects as the AOS
 * instance's `data.object-storage.*` configuration names.
 *
 * Every key is put behind the tenant's prefix — `<aosTenantId>/`, or nothing
 * for a dedicated instance — as AOP's `S3Store` does, so an object written by
 * either application is found by the other under the `meta_file.filePath` it
 * recorded.
 */
export class S3Store implements FileStore {
  readonly storeType = MetaFileStoreType.OBJECT_STORAGE;
  readonly id: string;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly config: S3StorageConfig;
  /** Bytes every part but the last carries. Read by the writes this store opens. */
  readonly partSize: number;
  private readonly scratchDir: string;

  constructor({
    config,
    aosTenantId,
    scratchDir,
  }: {
    config: S3StorageConfig;
    aosTenantId: string | undefined;
    scratchDir: string;
  }) {
    this.config = config;
    this.bucket = config.bucket;
    this.partSize = config.partSize;
    this.scratchDir = scratchDir;
    this.prefix = objectPrefix(aosTenantId);
    this.id = `s3:${config.endpoint ?? 'aws'}/${config.bucket}/${this.prefix}`;

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region ?? DEFAULT_REGION,
      forcePathStyle: config.pathStyle,
      /* Left to the client's own chain — the environment, a shared credentials
       * file, an instance role — when the configuration names no key pair. */
      credentials:
        config.accessKey && config.secretKey
          ? {accessKeyId: config.accessKey, secretAccessKey: config.secretKey}
          : undefined,
      /* Checksums only where the service demands them. The client's default
       * adds one to every upload as a trailing header, which services outside
       * AWS do not all accept. */
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  /** Needs the `s3:ListBucket` permission on the bucket, as AOP's own startup check does. */
  async prepare(): Promise<void> {
    await this.client.send(new HeadBucketCommand({Bucket: this.bucket}));

    /* Where a part is gathered before the bucket will take it. Made ready with
     * the bucket, so a directory that cannot be written fails the tenant's
     * connection rather than its first upload. */
    await fs.promises.mkdir(this.scratchDir, {recursive: true});
  }

  /** Where a write in progress stages a file of the given name. */
  scratchFile(name: string): string {
    return path.join(this.scratchDir, name);
  }

  /**
   * Make the staging directory ready again, since it defaults to a place under
   * the operating system's temporary directory that a housekeeping service
   * empties on a schedule of its own.
   */
  async openScratch(): Promise<void> {
    await fs.promises.mkdir(this.scratchDir, {recursive: true});
  }

  /**
   * Staged files nothing names any more.
   *
   * Local disk only: a multipart upload such a write also opened carries no age
   * this can read, and is the bucket's to reclaim through its lifecycle rule.
   */
  async sweepStaged(before: Date): Promise<number> {
    const names = await fs.promises
      .readdir(this.scratchDir)
      .catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw error;
      });

    let swept = 0;

    for (const name of names) {
      const file = path.join(this.scratchDir, name);
      const stats = await fs.promises.stat(file).catch(() => null);

      if (!stats?.isFile() || stats.mtimeMs >= before.getTime()) continue;

      await fs.promises.rm(file, {force: true}).catch(() => undefined);
      swept += 1;
    }

    return swept;
  }

  /** Remove every staged file whose name opens with the prefix. */
  async removeScratch(prefix: string): Promise<void> {
    const names = await fs.promises
      .readdir(this.scratchDir)
      .catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
        throw error;
      });

    await Promise.all(
      names
        .filter(name => name.startsWith(prefix))
        .map(name =>
          fs.promises
            .rm(path.join(this.scratchDir, name), {force: true})
            .catch(() => undefined),
        ),
    );
  }

  /** The file's length, or zero where it does not exist. */
  async fileSize(file: string): Promise<number> {
    const stats = await fs.promises.stat(file).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    });

    return stats?.size ?? 0;
  }

  async uploadPart({
    key,
    uploadId,
    number,
    size,
    body,
  }: {
    key: string;
    uploadId: string;
    number: number;
    size: number;
    body: Readable;
  }): Promise<string> {
    try {
      const {ETag} = await this.client.send(
        new UploadPartCommand({
          Bucket: this.bucket,
          Key: this.objectName(key),
          UploadId: uploadId,
          PartNumber: number,
          Body: body,
          ContentLength: size,
        }),
      );

      if (!ETag) {
        throw new Error(`Part ${number} of ${key} was stored without a tag.`);
      }

      return ETag;
    } finally {
      /* A request refused before the body was read leaves it open, and this
       * one holds a descriptor on the staged part. */
      body.destroy();
    }
  }

  /**
   * How every object this store writes is to be encrypted.
   *
   * Carried by both the single request and the head of a multipart upload,
   * which each take their own copy: named on one alone, a file large enough to
   * fill a part would silently take the bucket's default key instead.
   */
  private get encryption() {
    const mode = this.config.encryption
      ? ENCRYPTION[this.config.encryption]
      : undefined;

    return {
      ServerSideEncryption: mode,
      SSEKMSKeyId: mode === 'aws:kms' ? this.config.kmsKeyId : undefined,
    };
  }

  /** Opens a multipart upload, for a file too large to be stored in one request. */
  async createUpload(key: string, contentType: string): Promise<string> {
    const {UploadId} = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.objectName(key),
        ContentType: contentType,
        StorageClass: this.config.storageClass as StorageClass | undefined,
        ...this.encryption,
      }),
    );

    if (!UploadId) {
      throw new Error(`The bucket opened no upload for ${key}.`);
    }

    return UploadId;
  }

  async completeUpload({
    key,
    uploadId,
    parts,
  }: {
    key: string;
    uploadId: string;
    parts: {number: number; size: number; tag: string}[];
  }): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.objectName(key),
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map(part => ({
            PartNumber: part.number,
            ETag: part.tag,
          })),
        },
      }),
    );
  }

  async abortUpload(key: string, uploadId: string): Promise<void> {
    await this.client
      .send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: this.objectName(key),
          UploadId: uploadId,
        }),
      )
      .catch((error: unknown) => {
        /* Already completed or already aborted: either way there is nothing
         * left to release, which is what the caller asked for. */
        if (isNotFound(error)) return;
        throw error;
      });
  }

  /* Reaches the bucket for nothing, so the state it returns can be recorded in
   * the same insert that opens the session. */
  async openWrite(
    key: string,
    {contentType}: {contentType: string},
  ): Promise<ResumableWrite> {
    if (!isObjectKey(key)) throw new StoreKeyError(key);

    return new S3Write(
      this,
      key,
      {
        uploadId: null,
        parts: [],
        spill: crypto.randomUUID(),
        contentType,
        partSize: this.partSize,
      },
      0,
    );
  }

  async resumeWrite(key: string, state: unknown): Promise<ResumableWrite> {
    const result = SpillState.safeParse(state);

    if (!result.success) throw new StoreStateError(key);

    const parsed = result.data;
    const shipped = parsed.parts.reduce((total, part) => total + part.size, 0);

    /* The part in flight is the only staging file that can exist. Absent where
     * the scratch directory was cleared, leaving the parts the bucket holds. */
    const held = await this.fileSize(
      this.scratchFile(`${parsed.spill}.${parsed.parts.length + 1}`),
    );

    return new S3Write(this, key, parsed, shipped + held);
  }

  accepts(key: string): boolean {
    return isObjectKey(key);
  }

  private objectName(key: string): string {
    if (!isObjectKey(key)) throw new StoreKeyError(key);

    return this.prefix + key;
  }

  async stat(key: string): Promise<StoredFile | null> {
    const object = this.objectName(key);

    const head = await this.client
      .send(new HeadObjectCommand({Bucket: this.bucket, Key: object}))
      .catch((error: unknown) => {
        if (isNotFound(error)) return null;
        throw error;
      });

    if (!head) return null;

    return {
      size: head.ContentLength ?? 0,
      tag: (head.ETag ?? '').replace(/^"|"$/g, ''),
    };
  }

  async read(key: string, {range}: ReadOptions = {}): Promise<Readable> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.objectName(key),
        Range: range ? `bytes=${range.start}-${range.end}` : undefined,
      }),
    );

    if (!(response.Body instanceof Readable)) {
      throw new Error(`The object ${key} was returned without a body stream.`);
    }

    return response.Body;
  }

  async write(
    key: string,
    body: Readable,
    {size, contentType}: WriteOptions,
  ): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.objectName(key),
          Body: body,
          ContentLength: size,
          ContentType: contentType,
          /* Configured as free text, as AOP takes it: the service knows which
           * classes it offers, and refuses one it does not. */
          StorageClass: this.config.storageClass as StorageClass | undefined,
          ...this.encryption,
        }),
      );
    } finally {
      /* A request refused before the body was read leaves the body open;
       * ending it here releases whatever it holds — a file descriptor, for
       * a part being stored. Harmless once the body has been consumed. */
      body.destroy();
    }
  }

  close(): void {
    this.client.destroy();
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({Bucket: this.bucket, Key: this.objectName(key)}),
    );
  }

  async *list(prefix: string): AsyncIterable<string> {
    let continuationToken: string | undefined;

    do {
      const page = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: this.prefix + prefix,
          /* The top level of the tenant's part only, as the filesystem store
           * lists a directory: what sits under a further separator is left out. */
          Delimiter: '/',
          ContinuationToken: continuationToken,
        }),
      );

      for (const object of page.Contents ?? []) {
        if (object.Key) yield object.Key.slice(this.prefix.length);
      }

      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined;
    } while (continuationToken);
  }
}
