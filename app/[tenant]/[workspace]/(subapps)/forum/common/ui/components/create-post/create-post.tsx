'use client';

import {useState} from 'react';
import {
  MdAutoAwesome,
  MdClose,
  MdKeyboardArrowDown,
  MdOutlineEdit,
  MdOutlineForum,
  MdOutlineImage,
  MdOutlineUploadFile,
  MdPause,
  MdPlayArrow,
  MdRefresh,
} from 'react-icons/md';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {
  FileIcon,
  ProgressFill,
  ProgressRing,
  RichTextEditor,
  type ProgressTone,
} from '@/ui/components';
import {useToast} from '@/ui/hooks/use-toast';
import {
  useStagedUpload,
  type StagedUploadStatus,
} from '@/lib/core/upload/use-staged-upload';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {getFileSizeText} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import {
  FORUM_POST_ATTACHMENT_PURPOSE,
  MAX_FILE_SIZE,
  MAX_FORUM_ATTACHMENTS,
  MAX_IMAGES_BEFORE_OVERLAY,
  PUBLISHING,
} from '@/subapps/forum/common/constants';
import {
  FileUploader,
  ImagePreviewer,
  ImageUploader,
} from '@/subapps/forum/common/ui/components';
import {addPost} from '@/subapps/forum/common/action/action';
import {Group} from '@/subapps/forum/common/types/forum';
import {groupColorClass} from '@/subapps/forum/common/utils/group-color';

/* Each attachment carries the client-side `uploadId` of its staged upload; the
 * single-use token is read from the upload state at submit. */
interface ImageItem {
  file: File;
  altText: string;
  uploadId?: string;
}

interface DocItem {
  file: File;
  title: string;
  uploadId?: string;
}

interface CreatePostProps {
  groups: Group[];
  selectedGroup: Group | null;
  onClose: () => void;
}

enum ModalType {
  None = 'none',
  Image = 'image',
  File = 'file',
}

function stripHtml(html?: string) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function GroupPastille({name, size = 24}: {name?: string; size?: number}) {
  return (
    <span
      className={cn(
        'grid place-items-center rounded-md text-white font-bold shrink-0',
        groupColorClass(name || ''),
      )}
      style={{width: size, height: size, fontSize: size * 0.5}}>
      {(name || '#').trim().charAt(0).toUpperCase()}
    </span>
  );
}

export const CreatePost = ({
  groups,
  selectedGroup = null,
  onClose,
}: CreatePostProps) => {
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState<string>(selectedGroup?.id || '');
  const [editorContent, setEditorContent] = useState<string>('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [modalOpen, setModalOpen] = useState<ModalType>(ModalType.None);
  const [groupOpen, setGroupOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {toast} = useToast();
  const {tenant, workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();

  const {
    uploads,
    upload,
    pause,
    resume,
    remove: removeUpload,
    reset: resetUploads,
    isStaged,
  } = useStagedUpload({tenant});

  const chosenGroup = groups?.find(g => String(g.id) === String(groupId));
  const valid = Boolean(title.trim() && groupId && stripHtml(editorContent));

  const handleOpen = (type: ModalType) => setModalOpen(type);
  const handleClose = () => setModalOpen(ModalType.None);

  /*
   * Stage files picked since the last edit (those without an `uploadId`) and
   * free the staged uploads of any that were removed. Oversized files are
   * rejected at pick time with a toast — the server cap is the backstop.
   */
  const reconcile = <T extends {file: File; uploadId?: string}>(
    prev: T[],
    next: T[],
  ): T[] => {
    const capped =
      next.length > MAX_FORUM_ATTACHMENTS
        ? next.slice(0, MAX_FORUM_ATTACHMENTS)
        : next;
    if (capped.length < next.length) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          'You can add up to {0} files',
          String(MAX_FORUM_ATTACHMENTS),
        ),
      });
    }

    const staged = capped.flatMap(item => {
      if (item.uploadId) return [item];
      if (item.file.size > MAX_FILE_SIZE) {
        toast({
          variant: 'destructive',
          title: i18n.t(
            '{0} exceeds the {1} limit',
            item.file.name,
            getFileSizeText(MAX_FILE_SIZE),
          ),
        });
        return [];
      }
      const {ids} = upload(item.file, {
        purpose: FORUM_POST_ATTACHMENT_PURPOSE,
        maxBytes: MAX_FILE_SIZE,
      });
      return [{...item, uploadId: ids[0]}];
    });

    const keptIds = new Set(staged.map(item => item.uploadId));
    prev.forEach(item => {
      if (item.uploadId && !keptIds.has(item.uploadId)) {
        removeUpload(item.uploadId);
      }
    });

    return staged;
  };

  const handleImageUpload = (newImages: ImageItem[]) => {
    setImages(reconcile(images, newImages));
  };

  const handleFileUpload = (newDocs: DocItem[]) => {
    setDocuments(reconcile(documents, newDocs));
  };

  const removeImage = (uploadId?: string) => {
    if (uploadId) removeUpload(uploadId);
    setImages(prev => prev.filter(item => item.uploadId !== uploadId));
  };

  const removeDocument = (uploadId?: string) => {
    if (uploadId) removeUpload(uploadId);
    setDocuments(prev => prev.filter(item => item.uploadId !== uploadId));
  };

  const handlePost = async () => {
    if (!valid || loading) return;

    const attachments: {token: string; title: string}[] = [];
    for (const {uploadId, altText} of images) {
      const token = uploads.find(item => item.id === uploadId)?.token;
      if (!token) {
        toast({
          variant: 'destructive',
          title: i18n.t('Remove or retry failed attachments'),
        });
        return;
      }
      attachments.push({token, title: altText});
    }
    for (const {uploadId, title: docTitle} of documents) {
      const token = uploads.find(item => item.id === uploadId)?.token;
      if (!token) {
        toast({
          variant: 'destructive',
          title: i18n.t('Remove or retry failed attachments'),
        });
        return;
      }
      attachments.push({token, title: docTitle});
    }

    setLoading(true);

    const groupID = selectedGroup?.id || groupId;

    try {
      const result = await addPost({
        group: {id: groupID},
        title,
        content: editorContent,
        workspaceURL,
        workspaceURI,
        attachments,
      });

      if (result.success) {
        toast({variant: 'success', title: i18n.t('Post added successfully.')});
        resetUploads();
        setImages([]);
        setDocuments([]);
        onClose();
        router.refresh();
      } else {
        toast({
          variant: 'destructive',
          title: i18n.t(result.message ?? 'Something went wrong'),
        });
      }
    } catch (error) {
      console.error('Post creation error:', error);
      toast({variant: 'destructive', title: i18n.t('An error occurred!')});
    } finally {
      setLoading(false);
    }
  };

  const uploadOf = (uploadId?: string) =>
    uploads.find(upload => upload.id === uploadId);

  const toneOf = (status: StagedUploadStatus): ProgressTone =>
    status === 'error' ? 'error' : status === 'paused' ? 'paused' : 'active';

  /*
   * Pause, resume and retry for one attachment. Progress is drawn elsewhere —
   * on the thumbnail for an image, behind the name for a document — so these
   * are the only controls the attachment needs beside its name.
   */
  const renderUploadActions = (uploadId?: string) => {
    const item = uploadOf(uploadId);
    if (!item || !uploadId) return null;

    if (item.status === 'queued' || item.status === 'uploading') {
      return (
        <button
          type="button"
          onClick={() => pause(uploadId)}
          aria-label={i18n.t('Pause')}
          title={i18n.t('Pause')}
          className="shrink-0 text-ink-500">
          <MdPause className="size-5" />
        </button>
      );
    }
    if (item.status === 'paused') {
      return (
        <button
          type="button"
          onClick={() => resume(uploadId)}
          aria-label={i18n.t('Resume')}
          title={i18n.t('Resume')}
          className="shrink-0 text-status-pending-fg">
          <MdPlayArrow className="size-5" />
        </button>
      );
    }
    if (item.status === 'error') {
      return (
        <button
          type="button"
          onClick={() => resume(uploadId)}
          aria-label={i18n.t('Retry')}
          title={i18n.t('Retry')}
          className="shrink-0 text-destructive">
          <MdRefresh className="size-5" />
        </button>
      );
    }
    return null;
  };

  /* Why an upload stopped — the one thing neither a ring nor a fill can say. */
  const renderUploadIssue = (uploadId?: string) => {
    const item = uploadOf(uploadId);
    if (!item || (item.status !== 'error' && item.status !== 'paused')) {
      return null;
    }

    const isPaused = item.status === 'paused';
    return (
      <p
        className={cn(
          'line-clamp-2 text-xs',
          isPaused ? 'text-status-pending-fg' : 'text-destructive',
        )}>
        {isPaused ? i18n.t('Upload paused') : item.error}
      </p>
    );
  };

  /* Drawn over the thumbnail, so an image stays visible while it uploads. */
  const renderImageProgress = (index: number) => {
    const image = images[index];
    const item = uploadOf(image?.uploadId);
    if (!item || item.status === 'success') return null;

    return (
      <div className="absolute inset-0 grid place-items-center rounded-lg bg-ink-900/40">
        <ProgressRing
          value={item.progress}
          tone={toneOf(item.status)}
          size={56}
          label={i18n.t('Uploading {0}', image.file.name)}
        />
      </div>
    );
  };

  return (
    <>
      {/* Header — royal gradient + dots pattern */}
      <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-royal-dark to-royal px-6 py-[22px] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={i18n.t('Close')}
          className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25">
          <MdClose className="size-4" />
        </button>
        <div className="relative flex items-center gap-3.5">
          <div className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-white/[0.18]">
            <MdOutlineForum className="size-5" />
          </div>
          <div>
            <h2 className="text-[19px] font-extrabold tracking-[-0.015em]">
              {i18n.t('New discussion')}
            </h2>
            <p className="mt-0.5 text-[13px] text-white/85">
              {i18n.t('Share a question or a tip with the community')}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-y-auto p-6">
        {/* Title */}
        <div>
          <label className="mb-2 block text-[13px] font-bold text-ink-800">
            {i18n.t('Title')} <span className="text-destructive">*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={i18n.t('Summarize your topic in one sentence')}
            className="w-full rounded-[10px] border border-ink-150 px-3.5 py-3 text-[15px] font-semibold text-ink-800 outline-none transition-colors placeholder:font-normal placeholder:text-ink-400 focus:border-royal"
          />
        </div>

        {/* Group — custom selector */}
        <div className="relative">
          <label className="mb-2 block text-[13px] font-bold text-ink-800">
            {i18n.t('Group')} <span className="text-destructive">*</span>
          </label>
          <button
            type="button"
            onClick={() => setGroupOpen(o => !o)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-left transition-colors',
              groupOpen ? 'border-royal' : 'border-ink-150',
            )}>
            {chosenGroup ? (
              <>
                <GroupPastille name={chosenGroup.name} />
                <span className="flex-1 truncate text-sm font-semibold text-ink-900">
                  {chosenGroup.name}
                </span>
              </>
            ) : (
              <span className="flex-1 text-sm text-ink-400">
                {i18n.t('Select a group')}
              </span>
            )}
            <MdKeyboardArrowDown
              className={cn(
                'size-4 shrink-0 text-ink-400 transition-transform',
                groupOpen && 'rotate-180',
              )}
            />
          </button>
          {groupOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setGroupOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-[260px] overflow-y-auto rounded-xl border border-ink-100 bg-white shadow-lg">
                {groups?.map(g => {
                  const active = String(g.id) === String(groupId);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setGroupId(String(g.id));
                        setGroupOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors',
                        active ? 'bg-royal-pale' : 'hover:bg-ink-25',
                      )}>
                      <GroupPastille name={g.name} size={26} />
                      <span className="flex-1 truncate text-[13.5px] font-semibold text-ink-900">
                        {g.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-royal-pale px-2 py-px text-[10px] font-bold text-royal-dark">
                        {i18n.t('Member')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Content — reused rich-text editor */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-[13px] font-bold text-ink-800">
              {i18n.t('Content')} <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={i18n.t('Add image')}
                title={i18n.t('Add image')}
                onClick={() => handleOpen(ModalType.Image)}
                className="grid size-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-ink-100">
                <MdOutlineImage className="size-4" />
              </button>
              <button
                type="button"
                aria-label={i18n.t('Attach files')}
                title={i18n.t('Attach files')}
                onClick={() => handleOpen(ModalType.File)}
                className="grid size-7 place-items-center rounded-md text-ink-500 transition-colors hover:bg-ink-100">
                <MdOutlineUploadFile className="size-4" />
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-ink-150">
            <RichTextEditor
              onChange={setEditorContent}
              classNames={{
                toolbarClassName: '!bg-ink-25 !border-ink-100 !mt-0',
                wrapperClassName: '!border-0 !rounded-none',
                editorClassName: '!min-h-[180px] px-4 !text-ink-800 text-sm',
              }}
            />
          </div>

          {/* Attachment previews — staged uploads with per-file status */}
          {images.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpen(ModalType.Image)}
                className="self-end text-ink-500 hover:text-royal">
                <MdOutlineEdit className="size-5" />
              </button>
              <ImagePreviewer
                images={images}
                renderOverlay={renderImageProgress}
              />
              {images.map((image, index) => {
                const item = uploadOf(image.uploadId);
                /* Only the first few images get a thumbnail, and with it a
                 * ring. The rest carry their progress on their own row, so no
                 * image is left without any. */
                const needsRow =
                  !!item &&
                  item.status !== 'success' &&
                  index >= MAX_IMAGES_BEFORE_OVERLAY;
                const imageRow = (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm line-clamp-1">
                      {image.file.name} - {getFileSizeText(image.file.size)}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      {renderUploadActions(image.uploadId)}
                      <button
                        type="button"
                        onClick={() => removeImage(image.uploadId)}
                        aria-label={i18n.t('Remove')}
                        title={i18n.t('Remove')}
                        className="shrink-0 text-destructive">
                        <MdClose className="size-5" />
                      </button>
                    </div>
                  </div>
                );

                return (
                  <div key={image.uploadId} className="flex flex-col gap-1">
                    {needsRow ? (
                      <ProgressFill
                        value={item.progress}
                        tone={toneOf(item.status)}
                        label={i18n.t('Uploading {0}', image.file.name)}
                        showValue
                        className="rounded-md px-2 py-1">
                        {imageRow}
                      </ProgressFill>
                    ) : (
                      imageRow
                    )}
                    {renderUploadIssue(image.uploadId)}
                  </div>
                );
              })}
            </div>
          )}

          {documents.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleOpen(ModalType.File)}
                className="self-end text-ink-500 hover:text-royal">
                <MdOutlineEdit className="size-5" />
              </button>
              {documents.map(doc => {
                const item = uploadOf(doc.uploadId);
                const inProgress = !!item && item.status !== 'success';
                const documentRow = (
                  <div className="flex min-w-0 items-center gap-2">
                    <FileIcon
                      fileType={doc.file.type}
                      className="size-6 shrink-0"
                    />
                    <p className="line-clamp-1 flex-1 text-sm">
                      {doc.title || doc.file.name} -{' '}
                      {getFileSizeText(doc.file.size)}
                    </p>
                    {renderUploadActions(doc.uploadId)}
                    <button
                      type="button"
                      onClick={() => removeDocument(doc.uploadId)}
                      aria-label={i18n.t('Remove')}
                      title={i18n.t('Remove')}
                      className="shrink-0 text-destructive">
                      <MdClose className="size-5" />
                    </button>
                  </div>
                );

                return (
                  <div key={doc.uploadId} className="flex flex-col gap-1">
                    {inProgress ? (
                      <ProgressFill
                        value={item.progress}
                        tone={toneOf(item.status)}
                        label={i18n.t('Uploading {0}', doc.file.name)}
                        showValue
                        className="rounded-md border border-ink-150 p-2">
                        {documentRow}
                      </ProgressFill>
                    ) : (
                      <div className="rounded-md border border-ink-150 p-2">
                        {documentRow}
                      </div>
                    )}
                    {renderUploadIssue(doc.uploadId)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-ink-100 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-[10px] border border-ink-150 bg-white px-[18px] py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-25">
          {i18n.t('Cancel')}
        </button>
        <button
          type="button"
          onClick={handlePost}
          disabled={!valid || loading || !isStaged}
          className="inline-flex items-center gap-2 rounded-[10px] bg-royal px-[22px] py-2.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(13,30,75,0.15),0_6px_14px_rgba(13,30,75,0.18)] transition-colors hover:bg-royal-dark disabled:cursor-not-allowed disabled:bg-ink-200 disabled:shadow-none">
          <MdAutoAwesome className="size-4" />
          {loading ? i18n.t(PUBLISHING) : i18n.t('Publish the discussion')}
        </button>
      </div>

      {modalOpen === ModalType.Image && (
        <ImageUploader
          initialValue={images}
          open={modalOpen === ModalType.Image}
          onUpload={handleImageUpload}
          handleClose={handleClose}
        />
      )}

      {modalOpen === ModalType.File && (
        <FileUploader
          open={modalOpen === ModalType.File}
          initialValue={documents}
          onUpload={handleFileUpload}
          handleClose={handleClose}
        />
      )}
    </>
  );
};

export default CreatePost;
