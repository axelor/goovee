import {zodResolver} from '@hookform/resolvers/zod';
import {forwardRef, ReactNode, useRef, useState} from 'react';
import {ErrorCode, useDropzone, type FileRejection} from 'react-dropzone';
import {useFieldArray, useForm} from 'react-hook-form';
import {MdAttachFile, MdDelete, MdRefresh} from 'react-icons/md';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useStagedUpload} from '@/lib/core/upload/use-staged-upload';
import {i18n} from '@/locale';
import {AutosizeTextarea, Button, Input} from '@/ui/components';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/ui/components/form';
import {Progress} from '@/ui/components/progress';
import type {
  AutosizeTextAreaProps,
  AutosizeTextAreaRef,
} from '@/ui/components/textarea-auto-size';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {getFileSizeText} from '@/utils/files';

import type {CommentData, CreateProps} from '../../types';
import {
  COMMENT_ATTACHMENT_PURPOSE,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
} from '../../constants';

/*
 * Client-side form shape: each attachment row references its staged upload by
 * client id; the single-use token is read from the upload state at submit and
 * sent to the server as `CommentData`. fileName/size are captured at pick time
 * for display.
 */
const commentFormSchema = z
  .object({
    text: z.string().optional(),
    attachments: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        uploadId: z.string(),
        fileName: z.string(),
        size: z.number(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    const hasFile = !!data.attachments?.length;

    if (!hasFile && (!data.text || data.text.trim().length === 0)) {
      ctx.addIssue({
        path: ['text'],
        message: 'Comment is required',
        code: 'custom',
      });
    }
  });

type CommentProps = {
  disabled?: boolean;
  placeholderText?: string;
  showAttachmentIcon?: boolean;
  className?: string;
  onSubmit: (props: CreateProps) => Promise<void>;
  autoFocus?: boolean;
  /** Drops the input's own border/background so it can blend into a parent card. */
  bare?: boolean;
};

export function CommentInput({
  disabled = false,
  className = '',
  placeholderText = i18n.t('Enter text here') + '*',
  showAttachmentIcon = true,
  onSubmit,
  autoFocus = false,
  bare = false,
}: CommentProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {tenant} = useWorkspace();
  const {toast} = useToast();
  const {
    uploads,
    upload,
    retry,
    remove: removeUpload,
    reset: resetUploads,
    isUploading,
  } = useStagedUpload({tenant});

  const form = useForm<z.infer<typeof commentFormSchema>>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      text: '',
      attachments: [],
    },
  });

  const handleSubmit = async (values: z.infer<typeof commentFormSchema>) => {
    const attachments: CommentData['attachments'] = [];
    for (const row of values.attachments) {
      const token = uploads.find(item => item.id === row.uploadId)?.token;
      if (!token) {
        form.setError('attachments', {
          type: 'custom',
          message: 'Remove or retry failed attachments',
        });
        return;
      }
      attachments.push({title: row.title, description: row.description, token});
    }

    setIsSubmitting(true);

    await onSubmit({data: {text: values.text, attachments}});
    setIsSubmitting(false);

    form.reset();
    resetUploads();
  };

  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: 'attachments',
  });

  const onDrop = (acceptedFiles: File[]) => {
    const remaining = MAX_ATTACHMENTS - fields.length;
    const accepted = acceptedFiles.slice(0, Math.max(0, remaining));
    if (accepted.length < acceptedFiles.length) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          'You can attach up to {0} files',
          String(MAX_ATTACHMENTS),
        ),
      });
    }
    accepted.forEach(file => {
      const {ids} = upload(file, {purpose: COMMENT_ATTACHMENT_PURPOSE});
      append({
        title: '',
        description: '',
        uploadId: ids[0],
        fileName: file.name,
        size: file.size,
      });
    });
  };

  const onDropRejected = (rejections: FileRejection[]) => {
    rejections.forEach(rejection => {
      const tooLarge = rejection.errors.some(
        error => error.code === ErrorCode.FileTooLarge,
      );
      toast({
        variant: 'destructive',
        title: tooLarge
          ? i18n.t(
              '{0} exceeds the {1} limit',
              rejection.file.name,
              getFileSizeText(MAX_FILE_SIZE),
            )
          : i18n.t('{0} could not be added', rejection.file.name),
      });
    });
  };

  const {getRootProps, getInputProps} = useDropzone({
    maxSize: MAX_FILE_SIZE,
    onDrop,
    onDropRejected,
  });

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 w-full">
        <div className={cn(disabled && 'pointer-events-none')}>
          <FormField
            control={form.control}
            name="text"
            render={({field}) => (
              <FormItem>
                <FormControl>
                  <TextArea
                    className={className}
                    bare={bare}
                    autoFocus={autoFocus}
                    minHeight={32}
                    maxHeight={300}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        form.handleSubmit(handleSubmit)();
                      }
                    }}
                    placeholder={i18n.t(placeholderText)}
                    dummyValue={form.watch('text') || ''}
                    endAdornment={
                      <div className="flex items-start gap-4 pb-1">
                        {showAttachmentIcon && (
                          <div
                            {...getRootProps({
                              className:
                                'dropzone self-stretch flex items-center',
                            })}>
                            <input {...getInputProps()} />
                            <MdAttachFile
                              className={cn(
                                'size-6 text-black cursor-pointer',
                                disabled && 'text-gray-dark cursor-none',
                              )}
                            />
                          </div>
                        )}
                        <Button
                          type="submit"
                          className="px-5 py-1.5 h-9 text-sm font-semibold"
                          variant="royal"
                          disabled={isSubmitting || disabled || isUploading}>
                          {i18n.t('Send')}
                        </Button>
                      </div>
                    }
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormMessage className="px-2 py-1">
            {form.formState.errors.text?.message}
          </FormMessage>
        </div>
        {!!fields?.length && (
          <div className="flex flex-col gap-2">
            <h4 className="text-base font-semibold">{i18n.t('Attachments')}</h4>
            <FormMessage>
              {form.formState.errors.attachments?.message}
            </FormMessage>
            {fields.map((field, index) => {
              const uploadItem = uploads.find(
                item => item.id === field.uploadId,
              );
              const isFailed =
                uploadItem?.status === 'error' ||
                uploadItem?.status === 'aborted';
              return (
                <div
                  key={field.id}
                  className="p-2 border rounded-lg grid grid-cols-[20%_1fr_2fr_auto] items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold line-clamp-1">
                      {index + 1} {field.fileName} -{' '}
                      {getFileSizeText(field.size)}
                    </p>
                    {(uploadItem?.status === 'queued' ||
                      uploadItem?.status === 'uploading') && (
                      <Progress value={uploadItem.progress} className="h-1.5" />
                    )}
                    {isFailed && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-destructive line-clamp-1">
                          {uploadItem.error
                            ? i18n.t(uploadItem.error)
                            : i18n.t('Upload failed')}
                        </p>
                        <MdRefresh
                          title={i18n.t('Retry')}
                          className="size-5 cursor-pointer shrink-0"
                          onClick={() => retry(field.uploadId)}
                        />
                      </div>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name={`attachments.${index}.title`}
                    render={({field}) => (
                      <FormItem className="inline-block">
                        <FormControl>
                          <Input
                            placeholder={`${i18n.t('Enter attachment title')}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`attachments.${index}.description`}
                    render={({field}) => (
                      <FormItem className="inline-block">
                        <FormControl>
                          <Input
                            placeholder={i18n.t('Enter attachment description')}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <MdDelete
                    className="h-6 w-6 text-destructive cursor-pointer shrink-0"
                    onClick={() => {
                      removeUpload(field.uploadId);
                      remove(index);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </form>
    </Form>
  );
}

const TextArea = forwardRef<
  AutosizeTextAreaRef,
  AutosizeTextAreaProps & {
    endAdornment: ReactNode;
    dummyValue: string;
    bare?: boolean;
  }
>((props, ref) => {
  const {endAdornment, className, dummyValue, bare, ...rest} = props;
  return (
    <div
      className={cn(
        'flex items-end flex-wrap pr-1 text-sm',
        bare
          ? 'bg-transparent'
          : 'rounded-lg border border-ink-150 bg-white transition-shadow focus-within:border-royal focus-within:shadow-[0_0_0_3px_rgba(21,84,181,0.12)]',
      )}>
      <div className="flex flex-col grow">
        <AutosizeTextarea
          ref={ref}
          className={cn(
            'placeholder:text-sm placeholder:text-ink-400 border-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-none resize-none',
            className,
          )}
          {...rest}
        />
        <span className="px-3 invisible h-0 !m-0 whitespace-pre-wrap">
          {dummyValue}
        </span>
      </div>
      <div className="ml-auto">{endAdornment}</div>
    </div>
  );
});

TextArea.displayName = 'TextArea';
