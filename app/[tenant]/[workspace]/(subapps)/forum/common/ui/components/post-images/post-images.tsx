'use client';

// ---- CORE IMPORTS ---- //
import {SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';

type AnyRec = any;

const MAX_THUMBS = 3;

export function PostImages({
  post,
  workspaceURI,
}: {
  post: AnyRec;
  workspaceURI: string;
}) {
  const images = (
    Array.isArray(post?.attachmentList) ? post.attachmentList : []
  ).filter(
    (a: AnyRec) => a?.metaFile?.id && a.metaFile.fileType?.startsWith('image'),
  );

  if (!images.length) return null;

  const url = (fileId: string) =>
    withBasePath(
      `${workspaceURI}/${SUBAPP_CODES.forum}/api/post/${post.id}/attachment/${fileId}`,
    );

  const shown = images.slice(0, MAX_THUMBS);
  const extra = images.length - MAX_THUMBS;

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {shown.map((a: AnyRec, i: number) => (
        <div
          key={a.metaFile.id}
          className="relative overflow-hidden rounded-[10px] border border-ink-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url(a.metaFile.id)}
            alt={a.metaFile.fileName ?? ''}
            loading="lazy"
            className="w-full h-28 object-cover"
          />
          {i === MAX_THUMBS - 1 && extra > 0 && (
            <div className="absolute inset-0 grid place-items-center bg-black/50 text-white text-sm font-bold">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default PostImages;
