'use client';

import {useRef, useState} from 'react';
import Image from 'next/image';
import {
  MdClose,
  MdOutlineEdit,
  MdOutlineImage,
  MdOutlineUploadFile,
  MdRefresh,
} from 'react-icons/md';
import {useRouter} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useForm} from 'react-hook-form';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Form,
  Button,
  FileIcon,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  RichTextEditor,
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {Progress} from '@/ui/components/progress';
import {useToast} from '@/ui/hooks/use-toast';
import {useStagedUpload} from '@/lib/core/upload/use-staged-upload';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';
import {withBasePath} from '@/lib/core/path/base-path';
import {getFileSizeText} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import {
  CHOOSE_GROUP,
  CONTENT,
  ENTER_TITLE,
  FORUM_POST_ATTACHMENT_PURPOSE,
  MAX_FILE_SIZE,
  MAX_FORUM_ATTACHMENTS,
  PUBLISH,
  PUBLISHING,
  TITLE,
} from '@/subapps/forum/common/constants';
import {ImagePreviewer} from '@/subapps/forum/common/ui/components';
import {addPost} from '@/subapps/forum/common/action/action';
import {
  FileUploader,
  ImageUploader,
} from '@/subapps/forum/common/ui/components';
import {Group} from '@/subapps/forum/common/types/forum';

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

export const CreatePost = ({
  groups,
  selectedGroup = null,
  onClose,
}: CreatePostProps) => {
  const [editorContent, setEditorContent] = useState<string>('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [modalOpen, setModalOpen] = useState<ModalType>(ModalType.None);
  const [loading, setLoading] = useState(false);

  const {toast} = useToast();
  const {tenant, workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    uploads,
    upload,
    retry,
    remove: removeUpload,
    reset: resetUploads,
    isUploading,
  } = useStagedUpload({tenant});

  const formSchema = z.object({
    title: z.string().min(1, {message: i18n.t('Title is required')}),
    groupId: z.string().min(1, {message: i18n.t('Group is required')}),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      groupId: selectedGroup?.id || '',
    },
  });

  const handleOpen = (type: ModalType) => setModalOpen(type);
  const handleClose = () => setModalOpen(ModalType.None);

  const handleContentChange = (text: string) => {
    setEditorContent(text);
  };

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
      const {ids} = upload(item.file, {purpose: FORUM_POST_ATTACHMENT_PURPOSE});
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

  const handlePost = async (values: z.infer<typeof formSchema>) => {
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
    for (const {uploadId, title} of documents) {
      const token = uploads.find(item => item.id === uploadId)?.token;
      if (!token) {
        toast({
          variant: 'destructive',
          title: i18n.t('Remove or retry failed attachments'),
        });
        return;
      }
      attachments.push({token, title});
    }

    setLoading(true);

    const groupID = selectedGroup?.id || values.groupId;

    try {
      const result = await addPost({
        group: {id: groupID},
        title: values.title,
        content: editorContent,
        workspaceURL,
        workspaceURI,
        attachments,
      });

      if (result.success) {
        toast({
          variant: 'success',
          title: i18n.t('Post added successfully.'),
        });
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
      toast({
        variant: 'destructive',
        title: i18n.t('An error occurred!'),
      });
    } finally {
      setLoading(false);
    }
  };

  const renderUploadStatus = (uploadId?: string) => {
    const item = uploads.find(upload => upload.id === uploadId);
    if (!item) return null;
    if (item.status === 'queued' || item.status === 'uploading') {
      return <Progress value={item.progress} className="h-1.5" />;
    }
    if (item.status === 'error' || item.status === 'aborted') {
      return (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive line-clamp-1">
            {item.error ? i18n.t(item.error) : i18n.t('Upload failed')}
          </p>
          <MdRefresh
            title={i18n.t('Retry')}
            className="size-5 cursor-pointer shrink-0"
            onClick={() => uploadId && retry(uploadId)}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <ScrollArea className="h-screen lg:h-[80vh]">
      <Form {...form}>
        <form ref={formRef} onSubmit={form.handleSubmit(handlePost)}>
          <div className="lg:h-[80vh] p-2 flex flex-col justify-between">
            <div className="flex flex-col mt-0 xl:mt-2 relative p-2 gap-4">
              <div className="mt-2 flex flex-col gap-1.5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-foreground">
                        {i18n.t(TITLE)}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={i18n.t(ENTER_TITLE)}
                          className="shadow-none h-11 text-black placeholder:text-muted-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col gap-1.5 mt-3">
                <FormField
                  control={form.control}
                  name="groupId"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-foreground">
                        {i18n.t(CHOOSE_GROUP)}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={Boolean(selectedGroup)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={i18n.t('Select a group')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups?.map(group => (
                            <SelectItem value={group.id} key={group.id}>
                              <div className="flex items-center center justify-center gap-3 ">
                                <div className="w-6 h-6 rounded-lg overflow-hidden relative">
                                  <Image
                                    fill
                                    src={
                                      group?.image?.id
                                        ? withBasePath(
                                            `${workspaceURI}/${SUBAPP_CODES.forum}/api/group/${group.id}/image`,
                                          )
                                        : withBasePath(NO_IMAGE_URL)
                                    }
                                    alt={group.name}
                                    objectFit="cover"
                                  />
                                </div>
                                <div className="font-normal text-sm text-muted-foreground">
                                  {group.name}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-2">
                <span className="text-base font-medium text-foreground">
                  {i18n.t(CONTENT)}
                </span>
                <RichTextEditor onChange={handleContentChange} />
              </div>
            </div>
            <div className="w-full mt-2">
              <div className="flex flex-col gap-3 p-2 w-full">
                <div className="flex gap-4 items-center">
                  {documents.length === 0 && (
                    <MdOutlineImage
                      className="w-6 h-6 cursor-pointer"
                      onClick={() => handleOpen(ModalType.Image)}
                    />
                  )}
                  {images.length === 0 && (
                    <MdOutlineUploadFile
                      className="w-6 h-6 cursor-pointer"
                      onClick={() => handleOpen(ModalType.File)}
                    />
                  )}
                </div>

                {images.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {i18n.t('Images')}
                      </span>
                      <MdOutlineEdit
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => handleOpen(ModalType.Image)}
                      />
                    </div>
                    <ImagePreviewer images={images} />
                    {images.map(image => (
                      <div key={image.uploadId} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm line-clamp-1">
                            {image.file.name} -{' '}
                            {getFileSizeText(image.file.size)}
                          </p>
                          <MdClose
                            className="w-5 h-5 text-destructive cursor-pointer shrink-0"
                            onClick={() => removeImage(image.uploadId)}
                          />
                        </div>
                        {renderUploadStatus(image.uploadId)}
                      </div>
                    ))}
                  </div>
                )}

                {documents.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {i18n.t('Documents')}
                      </span>
                      <MdOutlineEdit
                        className="w-5 h-5 cursor-pointer"
                        onClick={() => handleOpen(ModalType.File)}
                      />
                    </div>
                    {documents.map(doc => (
                      <div key={doc.uploadId} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 border rounded-md p-2">
                          <FileIcon
                            fileType={doc.file.type}
                            className="h-6 w-6 shrink-0"
                          />
                          <p className="text-sm line-clamp-1 flex-1">
                            {doc.title || doc.file.name} -{' '}
                            {getFileSizeText(doc.file.size)}
                          </p>
                          <MdClose
                            className="w-5 h-5 text-destructive cursor-pointer shrink-0"
                            onClick={() => removeDocument(doc.uploadId)}
                          />
                        </div>
                        {renderUploadStatus(doc.uploadId)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                variant="success"
                className="w-full mt-1 lg:mt-4"
                disabled={loading || isUploading}>
                {loading ? i18n.t(PUBLISHING) : i18n.t(PUBLISH)}
              </Button>
            </div>
          </div>
        </form>
      </Form>

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
    </ScrollArea>
  );
};
