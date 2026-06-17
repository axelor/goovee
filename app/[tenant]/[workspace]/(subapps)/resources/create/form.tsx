'use client';

import {useRef} from 'react';
import {notFound, useRouter} from 'next/navigation';
import {ErrorCode, useDropzone, type FileRejection} from 'react-dropzone';
import {useForm, useFieldArray} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdDelete, MdRefresh} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Button} from '@/ui/components/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {Progress} from '@/ui/components/progress';
import {Textarea} from '@/ui/components/textarea';
import {useToast} from '@/ui/hooks/use-toast';
import {useStagedUpload} from '@/lib/core/upload/use-staged-upload';
import {i18n} from '@/locale';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {getFileSizeText} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import {upload} from './action';
import {
  MAX_FILE_SIZE,
  MAX_RESOURCE_FILES,
  RESOURCE_DMS_UPLOAD_PURPOSE,
} from '@/subapps/resources/common/constants';
import type {DmsFile} from '@/subapps/resources/common/types';

/*
 * Each row references its staged upload by client id; the single-use token is
 * read from the upload state at submit. fileName/size are captured at pick time
 * for display.
 */
const formSchema = z.object({
  values: z
    .array(
      z.object({
        title: z.string().min(2, {message: i18n.t('Title is required')}),
        description: z.string(),
        uploadId: z.string(),
        fileName: z.string(),
        size: z.number(),
      }),
    )
    .min(1, {message: i18n.t('Single file is required to create resource')})
    .max(MAX_RESOURCE_FILES, {
      message: i18n.t(
        'You can add up to {0} files',
        String(MAX_RESOURCE_FILES),
      ),
    }),
});

export default function ResourceForm({parent}: {parent: DmsFile}) {
  const {toast} = useToast();
  const router = useRouter();
  const {tenant, workspaceURI, workspaceURL} = useWorkspace();

  const formRef = useRef<HTMLFormElement>(null);

  const {
    uploads,
    upload: stage,
    retry,
    remove: removeUpload,
    reset: resetUploads,
    isUploading,
  } = useStagedUpload({tenant});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      values: [],
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const values: {title: string; description: string; token: string}[] = [];
    for (const row of data.values) {
      const token = uploads.find(item => item.id === row.uploadId)?.token;
      if (!token) {
        form.setError('values', {
          type: 'custom',
          message: i18n.t('Remove or retry failed attachments'),
        });
        return;
      }
      values.push({title: row.title, description: row.description, token});
    }

    const result = await upload({workspaceURL, parent: parent.id, values});

    if (result.success) {
      toast({
        title: i18n.t('Resource created successfully.'),
        variant: 'success',
      });
      resetUploads();
      router.refresh();
      router.push(`${workspaceURI}/resources/categories?id=${parent?.id}`);
    } else {
      toast({
        variant: 'destructive',
        title: i18n.t('Error creating resource'),
      });
    }
  };

  const {fields, append, remove} = useFieldArray({
    control: form.control,
    name: 'values',
  });

  const onDrop = (acceptedFiles: File[]) => {
    // cumulative cap across drops — react-dropzone's maxFiles only bounds a
    // single drop, so enforce the total here and toast when files are dropped.
    const remaining = MAX_RESOURCE_FILES - fields.length;
    if (remaining <= 0) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          'You can add up to {0} files',
          String(MAX_RESOURCE_FILES),
        ),
      });
      return;
    }
    const files = acceptedFiles.slice(0, remaining);
    if (files.length < acceptedFiles.length) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          'You can add up to {0} files',
          String(MAX_RESOURCE_FILES),
        ),
      });
    }
    files.forEach(file => {
      const {ids} = stage(file, {purpose: RESOURCE_DMS_UPLOAD_PURPOSE});
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

  if (!parent?.id) {
    return notFound();
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8">
        <FormItem>
          <FormLabel>{i18n.t('Parent')}</FormLabel>
          <FormControl>
            <Input
              className="shadow-none h-11 text-black placeholder:text-muted-foreground"
              readOnly
              value={parent?.fileName ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <div
          {...getRootProps({className: 'dropzone'})}
          className="flex justify-center items-center cursor-pointer rounded bg-muted h-36">
          <input {...getInputProps()} />
          <p>
            {i18n.t('Drag and drop some files here, or click to select files')}
          </p>
        </div>
        {fields?.length ? (
          <div className="flex flex-col gap-2">
            <h4 className="text-lg font-semibold">
              {i18n.t('Uploaded Files')}
            </h4>
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
                  className="p-2 border rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="font-semibold line-clamp-1">
                        {index + 1} {field.fileName} -{' '}
                        {getFileSizeText(field.size)}
                      </p>
                      {(uploadItem?.status === 'queued' ||
                        uploadItem?.status === 'uploading') && (
                        <Progress
                          value={uploadItem.progress}
                          className="h-1.5"
                        />
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
                    <MdDelete
                      className="h-6 w-6 text-destructive cursor-pointer shrink-0"
                      onClick={() => {
                        removeUpload(field.uploadId);
                        remove(index);
                      }}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name={`values.${index}.title`}
                    render={({field}) => (
                      <FormItem className="inline-block">
                        <FormControl>
                          <Input
                            placeholder={`${i18n.t('Enter resource title')}*`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`values.${index}.description`}
                    render={({field}) => (
                      <FormItem className="inline-block">
                        <FormControl>
                          <Textarea
                            placeholder={i18n.t('Enter resource description')}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
        <Button
          type="submit"
          variant="success"
          className="w-full"
          disabled={isUploading || form.formState.isSubmitting}>
          {i18n.t('Add new resource')}
        </Button>
        {form?.formState?.errors?.values && (
          <p className="block text-destructive">
            {form.formState.errors.values.message}
          </p>
        )}
      </form>
    </Form>
  );
}
