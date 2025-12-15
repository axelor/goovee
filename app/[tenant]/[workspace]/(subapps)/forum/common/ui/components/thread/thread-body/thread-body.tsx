'use client';

import React, {useMemo} from 'react';
import {MdOutlineMoreHoriz} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NOT_INTERESTED, REPORT, SUBAPP_CODES} from '@/constants';
import {i18n} from '@/locale';
import {
  Avatar,
  AvatarImage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  RichTextViewer,
} from '@/ui/components';
import {getPartnerImageURL} from '@/utils/files';
import {formatDateTime} from '@/locale/formatters';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {SEE_LESS, SEE_MORE} from '@/subapps/forum/common/constants';
import type {Post} from '@/subapps/forum/common/types/forum';
import {
  FilePreviewer,
  ImageGallery,
} from '@/subapps/forum/common/ui/components';
import {useTruncatedElement} from '@/subapps/forum/common/ui/hooks/use-truncatedElement';

export const ThreadBody = ({
  post,
  usePopUpStyles = false,
}: {
  post?: Post;
  usePopUpStyles?: boolean;
}) => {
  const {title, content, attachmentList, author, postDateT}: any = post || {};

  const {tenant, workspaceURL} = useWorkspace();

  const ref = React.useRef(null);

  const {isTruncated, isShowingMore, toggleIsShowingMore} = useTruncatedElement(
    {ref},
  );

  const {images, files} = useMemo(() => {
    return (
      attachmentList?.reduce(
        (acc: any, attachment: any) => {
          if (attachment?.metaFile?.fileType?.startsWith('image')) {
            acc.images.push(attachment);
          } else {
            acc.files.push({
              id: attachment?.metaFile?.id,
              type: attachment?.metaFile?.fileType,
              name: attachment?.metaFile?.fileName,
              url: `${workspaceURL}/${SUBAPP_CODES.forum}/api/post/${post?.id}/attachment/${attachment?.metaFile?.id}`,
            });
          }
          return acc;
        },
        {images: [], files: []},
      ) || {images: [], files: []}
    );
  }, [attachmentList, post?.id, workspaceURL]);

  return (
    <>
      <div className="flex flex-col gap-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="rounded-full h-10 w-10">
              <AvatarImage
                src={getPartnerImageURL(author?.picture?.id, tenant)}
              />
            </Avatar>
            <div className="flex flex-col gap-2">
              <div className="text-base font-semibold">
                {author?.simpleFullName}
              </div>
              <div className="text-xs">
                {formatDateTime(postDateT, {
                  dateFormat: 'MMMM D YYYY,',
                  timeFormat: ' h:mm a',
                })}
              </div>
            </div>
          </div>
          <div></div>
          {false && (
            <Popover>
              <PopoverTrigger>
                <MdOutlineMoreHoriz className="w-6 h-6 cursor-pointer" />
              </PopoverTrigger>
              <PopoverContent className="p-0 w-fit">
                <div className="flex flex-col gap-2.5 p-4 bg-white rounded-lg text-xs leading-[1.125rem]">
                  <div className="cursor-pointer">{i18n.t(REPORT)}</div>
                  <div className="cursor-pointer">{i18n.t(NOT_INTERESTED)}</div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold line-clamp-1">{title}</div>
          <RichTextViewer
            ref={ref}
            content={content}
            innerHTMLClassName={cn(!isShowingMore && 'line-clamp-3')}
          />
          <div className="flex justify-end">
            <span className="text-xs font-semibold">
              {isTruncated && (
                <button
                  onClick={toggleIsShowingMore}
                  className="text-gray-500 cursor-pointer flex items-center gap-2 justify-end w-fit">
                  <MdOutlineMoreHoriz className="w-4 h-4" />
                  {isShowingMore ? i18n.t(SEE_LESS) : i18n.t(SEE_MORE)}
                </button>
              )}
            </span>
          </div>
        </div>
        {images?.length > 0 && !usePopUpStyles && (
          <ImageGallery post={post} images={images} />
        )}

        {files?.length > 0 &&
          !usePopUpStyles &&
          files.map((file: any) => (
            <React.Fragment key={file.id}>
              <FilePreviewer file={file} />
            </React.Fragment>
          ))}
      </div>
    </>
  );
};

export default ThreadBody;
