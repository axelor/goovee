// ---- CORE IMPORTS ---- //
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {RichTextEditor} from '@/ui/components';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {useToast} from '@/ui/hooks';
import type {ID} from '@goovee/orm';
import {zodResolver} from '@hookform/resolvers/zod';
import {useCallback, useMemo, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {ZodIssueCode} from 'zod';

// ---- LOCAL IMPORT ---- //
import type {PortalAppConfig} from '@/types';
import type {MutateProps, MutateResponse} from '../../../actions';
import {mutate} from '../../../actions';
import {FIELDS} from '../../../constants';
import type {Category, ContactPartner, Priority} from '../../../types';
import type {CreateFormData} from '../../../utils/validators';
import {CreateFormSchema} from '../../../utils/validators';

type TicketFormProps = {
  projectId: string;
  userId: ID;
  categories: Category[];
  priorities: Priority[];
  contacts: ContactPartner[];
  parentId?: string;
  className?: string;
  onSuccess?: (ticketId: string, projectId: string) => void;
  submitFormWithAction?: (
    action: (data?: MutateResponse) => Promise<void>,
  ) => Promise<void>;
  formFields: PortalAppConfig['ticketingFormFieldSet'];
};
export function TicketForm(props: TicketFormProps) {
  const {
    categories,
    priorities,
    projectId,
    contacts,
    userId,
    parentId,
    className,
    onSuccess,
    submitFormWithAction,
    formFields,
  } = props;
  const {toast} = useToast();
  const {workspaceURL, workspaceURI} = useWorkspace();
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const allowedFields = useMemo(
    () => new Set(formFields?.map(f => f.name)),
    [formFields],
  );

  const refinedSchema = useMemo(
    () =>
      CreateFormSchema.superRefine((data, ctx) => {
        if (allowedFields.has(FIELDS.CATEGORY) && !data.category) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            path: ['category'],
            message: 'Category is required',
          });
        }

        if (allowedFields.has(FIELDS.PRIORITY) && !data.priority) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            path: ['priority'],
            message: 'Priority is required',
          });
        }

        if (allowedFields.has(FIELDS.MANAGED_BY) && !data.managedBy) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            path: ['managedBy'],
            message: 'Managed by is required',
          });
        }
      }),
    [allowedFields],
  );

  const form = useForm<CreateFormData>({
    resolver: zodResolver(refinedSchema),
    defaultValues: {
      managedBy: allowedFields.has(FIELDS.MANAGED_BY)
        ? userId.toString()
        : undefined,
      parentId: parentId,
    },
  });

  const handleSuccess = useCallback(
    (ticketId: string, projectId: string) => {
      setSuccess(true);
      onSuccess?.(ticketId, projectId);
    },
    [onSuccess],
  );

  const handleError = useCallback(
    (message: string) => {
      return toast({
        variant: 'destructive',
        title: message,
        duration: 5000,
      });
    },
    [toast],
  );

  const handleSubmit = useCallback(
    async (value: CreateFormData): Promise<void> => {
      const mutateProps: MutateProps = {
        action: {
          type: 'create',
          data: {
            project: projectId,
            ...value,
          },
        },
        workspaceURL,
        workspaceURI,
      };

      const {error, message, data} = await mutate(mutateProps);

      if (error) {
        handleError(message);
        return;
      }

      handleSuccess(data.id, projectId);
    },
    [handleError, handleSuccess, projectId, workspaceURI, workspaceURL],
  );

  const handleSubmitWithAction = useCallback(
    (value: CreateFormData): Promise<void> => {
      if (submitFormWithAction) {
        return submitFormWithAction(() => handleSubmit(value));
      }
      return handleSubmit(value);
    },
    [submitFormWithAction, handleSubmit],
  );

  return (
    <div className={className}>
      <Form {...form}>
        <form
          ref={formRef}
          onSubmit={form.handleSubmit(handleSubmitWithAction)}>
          <div className="space-y-4 rounded-md border bg-card p-4">
            <FormField
              control={form.control}
              name="subject"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Subject')}*</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder={i18n.t('Enter your subject')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {allowedFields.has(FIELDS.CATEGORY) && (
              <FormField
                control={form.control}
                name="category"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Category')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={i18n.t('Select your category')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem
                            value={category.id.toString()}
                            key={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {allowedFields.has(FIELDS.PRIORITY) && (
              <FormField
                control={form.control}
                name="priority"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Priority')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={i18n.t('Select your priority')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem
                            value={priority.id.toString()}
                            key={priority.id}>
                            {priority.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {allowedFields.has(FIELDS.MANAGED_BY) && (
              <FormField
                control={form.control}
                name="managedBy"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Managed by')}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map(contact => (
                          <SelectItem
                            value={contact.id.toString()}
                            key={contact.id}>
                            {contact.simpleFullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="description"
              render={({field}) => {
                return (
                  <FormItem>
                    <FormLabel>{i18n.t('Ticket description')}</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        onChange={field.onChange}
                        classNames={{
                          wrapperClassName: 'overflow-visible',
                          toolbarClassName: 'mt-0',
                          editorClassName: 'px-4',
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                className="w-30"
                variant="success"
                disabled={success}>
                {i18n.t('Create a ticket')}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
