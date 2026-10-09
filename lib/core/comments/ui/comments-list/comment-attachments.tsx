// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

import type {MailMessageFile} from '../../types';

type CommentAttachmentsProps = {
  attachments: MailMessageFile[];
  attachmentDownloadUrl: string;
};

export function CommentAttachments({
  attachments,
  attachmentDownloadUrl,
}: CommentAttachmentsProps) {
  return (
    <div className="px-4 text-xs mb-1">
      <div className="font-semibold"> {i18n.t('Files')}:</div>
      <ul className="list-disc">
        {attachments?.map(attachment => (
          <li key={attachment.id} className="marker:text-black">
            {attachment.attachmentFile?.id ? (
              <a
                href={`${attachmentDownloadUrl}/${attachment.attachmentFile.id}`}
                download={attachment.attachmentFile.fileName ?? ''}
                className="text-blue-600 underline">
                {attachment.attachmentFile.fileName}
              </a>
            ) : (
              attachment.attachmentFile?.fileName
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
