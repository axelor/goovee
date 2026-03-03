'use client';

import React, {useRef, useState} from 'react';
import Image from 'next/image';
import {
  MdOutlineEdit,
  MdOutlineImage,
  MdOutlineUploadFile,
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
import {useToast} from '@/ui/hooks/use-toast';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {
  CHOOSE_GROUP,
  CONTENT,
  ENTER_TITLE,
  PUBLISH,
  PUBLISHING,
  TITLE,
} from '@/subapps/forum/common/constants';
import {
  FilePreviewer,
  ImagePreviewer,
} from '@/subapps/forum/common/ui/components';
import {addPost} from '@/subapps/forum/common/action/action';
import {
  FileUploader,
  ImageUploader,
} from '@/subapps/forum/common/ui/components';
import {NO_IMAGE_URL, SUBAPP_CODES} from '@/constants';

interface ImageItem {
  file: File;
  altText: string;
}

interface CreatePostProps {
  groups: any[];
  selectedGroup: any;
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
  const [attachments, setAttachments] = useState<{
    images: ImageItem[];
    file?: any;
  }>({images: []});
  const [modalOpen, setModalOpen] = useState<ModalType>(ModalType.None);
  const [loading, setLoading] = useState(false);

  const {toast} = useToast();
  const {workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

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

  const handleImageUpload = (images: ImageItem[]) => {
    setAttachments(prev => ({
      ...prev,
      images,
    }));
  };

  const handleFileUpload = (newFile: any) => {
    setAttachments(prev => ({
      ...prev,
      title: newFile?.fileTitle || newFile?.file?.name,
      file: newFile,
    }));
  };

  const handlePost = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const formData = new FormData();
    if (attachments.images?.length) {
      attachments.images.forEach((element: any, index) => {
        formData.append(
          `attachmentList[${index}][title]`,
          element?.altText || '',
        );
        formData.append(`attachmentList[${index}][file]`, element.file);
      });
    } else if (attachments.file) {
      formData.append(
        `attachmentList[0][title]`,
        attachments.file?.fileTitle || '',
      );
      formData.append(`attachmentList[0][file]`, attachments.file?.file);
    }

    const groupID = selectedGroup?.id || values.groupId;

    try {
      const result: any = await addPost({
        group: {id: groupID},
        title: values.title,
        content: editorContent,
        workspaceURL,
        workspaceURI,
        formData,
      });

      if (result.success) {
        toast({
          variant: 'success',
          title: i18n.t('Post added successfully.'),
        });
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
                        disabled={selectedGroup}>
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
                                        ? `${workspaceURI}/${SUBAPP_CODES.forum}/api/group/${group.id}/image`
                                        : NO_IMAGE_URL
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
              <div className="flex gap-2 lg:gap-4 p-2 w-full">
                {attachments.images.length > 0 ? (
                  <div className="w-full flex flex-col gap-6">
                    <div className="flex justify-end">
                      <MdOutlineEdit
                        className="w-6 h-6"
                        onClick={() => handleOpen(ModalType.Image)}
                      />
                    </div>
                    <ImagePreviewer images={attachments.images} />
                  </div>
                ) : attachments?.file?.file ? (
                  <div className="w-full flex flex-col gap-6">
                    <div className="flex justify-end">
                      <MdOutlineEdit
                        className="w-6 h-6"
                        onClick={() => handleOpen(ModalType.File)}
                      />
                    </div>
                    <FilePreviewer file={attachments.file.file} />
                  </div>
                ) : (
                  <>
                    <div
                      className="w-6 h-6"
                      onClick={() => handleOpen(ModalType.Image)}>
                      <MdOutlineImage className="w-full h-full cursor-pointer" />
                    </div>
                    <div
                      className="w-6 h-6"
                      onClick={() => handleOpen(ModalType.File)}>
                      <MdOutlineUploadFile className="w-full h-full cursor-pointer " />
                    </div>
                  </>
                )}
              </div>
              <Button
                type="submit"
                variant="success"
                className="w-full mt-1 lg:mt-4"
                disabled={loading}>
                {loading ? i18n.t(PUBLISHING) : i18n.t(PUBLISH)}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {modalOpen === ModalType.Image && (
        <ImageUploader
          initialValue={attachments.images}
          open={modalOpen === ModalType.Image}
          onUpload={handleImageUpload}
          handleClose={handleClose}
        />
      )}

      {modalOpen === ModalType.File && (
        <FileUploader
          open={modalOpen === ModalType.File}
          initialValue={attachments.file}
          onUpload={handleFileUpload}
          handleClose={handleClose}
        />
      )}
    </ScrollArea>
  );
};
