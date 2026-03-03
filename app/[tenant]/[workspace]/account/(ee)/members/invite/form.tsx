'use client';

import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {RadioGroup, RadioGroupItem} from '@/ui/components';
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import {Title} from '../../../common/ui/components';
import {Authorization, Role} from '../../../common/types';
import {sendInvites} from './action';
import {useWorkspace} from '../../../../workspace-context';

const formSchema = z.object({
  emails: z.string().min(1, i18n.t('Emails cannot be empty')),
  role: z.enum([Role.user, Role.admin]),
  apps: z.record(
    z.string(),
    z.object({
      code: z.string(),
      access: z.string(),
      authorization: z
        .enum([Authorization.restricted, Authorization.total])
        .optional(),
    }),
  ),
});

export default function InviteForm({
  availableApps,
}: {
  availableApps: Array<{
    name: string;
    code: string;
    authorization?: boolean;
  }>;
}) {
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {toast} = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: '',
      role: Role.user,
      apps: (availableApps || []).reduce(
        (acc, {name, code, authorization}) => ({
          ...acc,
          [code]: {
            code,
            access: 'no',
            ...(authorization
              ? {
                  authorization: Authorization.restricted,
                }
              : {}),
          },
        }),
        {},
      ),
    },
  });

  const onInviteSubmit = async (values: z.infer<typeof formSchema>) => {
    const result =
      (await sendInvites({
        ...values,
        workspaceURL,
        workspaceURI,
      })) || ({} as any);

    if ('success' in result) {
      toast({
        title: result.message || i18n.t('Invites send successfully'),
        variant: 'success',
      });
      router.replace(`${workspaceURI}/account/members`);
    } else {
      toast({
        title: result.message || i18n.t('Error sending invites'),
        variant: 'destructive',
      });
    }
  };

  const isSubmitting = form?.formState?.isSubmitting;

  return (
    <Form {...form}>
      <form
        className="space-y-10"
        onSubmit={event => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit(onInviteSubmit)();
        }}>
        <div className="space-y-4">
          <Title text={i18n.t('Invite new members')}></Title>
          <div className="space-y-2">
            <p className="text-base font-medium">{i18n.t('Invite contact')}</p>
            <small className="text-xs font-medium">
              {i18n.t(
                'The contact you invite must be people from your company as their account will be linked to your company.',
              )}
            </small>
            <FormField
              control={form.control}
              name="emails"
              render={({field}) => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-2 py-2 px-3 border rounded-lg">
                      <Input
                        {...field}
                        className="border-0 ring-0 py-0 px-0 focus-visible:ring-transparent"
                        value={field.value}
                        placeholder={i18n.t(
                          'Please write the emails of the people you want to invite on the portal',
                        )}></Input>
                      <Button
                        size="sm"
                        type="submit"
                        variant="success"
                        disabled={isSubmitting}>
                        {i18n.t('Invite')}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div>
          <FormField
            control={form.control}
            name="role"
            render={({field}) => (
              <FormItem>
                <FormLabel className="font-medium">{i18n.t('Role')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-16"
                    disabled={isSubmitting}>
                    <FormItem className="flex items-center space-x-6 space-y-0">
                      <FormControl>
                        <RadioGroupItem variant="success" value="admin" />
                      </FormControl>
                      <FormLabel className="font-medium text-sm">
                        {i18n.t('Admin')}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-6 space-y-0">
                      <FormControl>
                        <RadioGroupItem variant="success" value="user" />
                      </FormControl>
                      <FormLabel className="font-medium text-sm">
                        {i18n.t('User')}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {form.getValues('role') === 'user' && (
          <div className="flex flex-col p-2 rounded-lg gap-2 bg-white lg:bg-inherit">
            <div className="grid grid-cols-[20%_20%_20%] items-center p-4 gap-6 border-b">
              <p className="text-xs font-bold">{i18n.t('App')}</p>
              <p className="text-xs font-bold">{i18n.t('Access')}</p>
              <p className="text-xs font-bold">{i18n.t('Authorization')}</p>
            </div>
            {(availableApps || []).map(({name, code, authorization}) => (
              <div
                key={code}
                className="grid grid-cols-[20%_20%_20%] items-center p-4 gap-6 border-b">
                <p className="text-xs font-bold">{name}</p>
                <div>
                  <FormField
                    control={form.control}
                    name={`apps.${code}.access`}
                    render={({field}) => (
                      <FormItem className="w-16">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                          disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger className="text-xs">
                              <SelectValue
                                placeholder={i18n.t('Select access')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              {label: i18n.t('Yes'), value: 'yes'},
                              {label: i18n.t('No'), value: 'no'},
                            ].map((option: any) => (
                              <SelectItem
                                className="text-xs"
                                value={option.value}
                                key={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {authorization && (
                  <FormField
                    control={form.control}
                    name={`apps.${code}.authorization`}
                    render={({field}) => (
                      <FormItem className="w-28">
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          defaultValue={Authorization.restricted}
                          disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger className="text-xs">
                              <SelectValue
                                placeholder={i18n.t('Select authorization')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              {
                                label: i18n.t('Restricted'),
                                value: Authorization.restricted,
                              },
                              {
                                label: i18n.t('Total'),
                                value: Authorization.total,
                              },
                            ].map((option: any) => (
                              <SelectItem
                                className="text-xs"
                                value={option.value}
                                key={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </form>
    </Form>
  );
}
