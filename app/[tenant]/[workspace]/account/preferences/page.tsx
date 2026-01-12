'use client';

import {useEffect, useState} from 'react';
import {z} from 'zod';
import {authClient} from '@/lib/auth-client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {useToast} from '@/ui/hooks/use-toast';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Loader} from '@/ui/components/loader';
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
import {useWorkspace} from '../../workspace-context';

// ---- LOCAL IMPORT ---- //
import {
  fetchLocalizations,
  fetchWorkspaces,
  fetchPreference,
  updatePreference,
} from './action';

const formSchema = z.object({
  defaultWorkspace: z.string().optional(),
  localization: z.string().optional(),
});

export default function Page() {
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const {toast} = useToast();
  const {tenant, workspaceURL} = useWorkspace();

  const [loading, setLoading] = useState(true);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [localizations, setLocalizations] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultWorkspace: '',
      localization: '',
    },
  });

  const setFormValue = form.setValue;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const {defaultWorkspace, localization} = values;

    const result = await updatePreference({defaultWorkspace, localization});

    if ('error' in result) {
      toast({
        title: result.message || i18n.t('Error updating preference'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: i18n.t('Preference updated successfully'),
        variant: 'success',
      });
    }

    setTimeout(() => {
      window?.location?.reload();
    }, 1000);
  };

  useEffect(() => {
    const init = async () => {
      return Promise.allSettled([
        fetchPreference(),
        fetchWorkspaces(),
        fetchLocalizations(),
      ])
        .then(
          ([preferenceResponse, workspacesResponse, localizationsReponse]) => {
            const isFullfilled = (response: any) =>
              response.status === 'fulfilled';

            if (isFullfilled(preferenceResponse)) {
              const {value}: any = preferenceResponse;

              if (!('error' in value)) {
                if (value.data) {
                  const {defaultWorkspace, localization} = value.data;

                  setFormValue('defaultWorkspace', defaultWorkspace, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });

                  setFormValue('localization', localization, {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }
              }
            }

            if (isFullfilled(workspacesResponse)) {
              const {value}: any = workspacesResponse;

              if (!('error' in value)) {
                setWorkspaces(value.data);
              }
            }

            if (isFullfilled(localizationsReponse)) {
              const {value}: any = localizationsReponse;

              if (!('error' in value)) {
                setLocalizations(value.data);
              }
            }
          },
        )
        .finally(() => {
          setLoading(false);
        });
    };

    init().finally(() => {
      setLoading(false);
    });
  }, [user, tenant, workspaceURL, setFormValue]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="bg-white p-2 lg:p-0 lg:bg-inherit">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-2">
          <div className="space-y-4">
            {!user?.isContact && (
              <FormField
                control={form.control}
                name="defaultWorkspace"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Default Workspace')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={i18n.t(
                              'Select your default workspace',
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workspaces.map((workspace: any) => (
                          <SelectItem
                            value={workspace.id?.toString()}
                            key={workspace.id}>
                            {workspace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {Boolean(localizations?.length) && (
              <FormField
                control={form.control}
                name="localization"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Language')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={i18n.t('Select your language')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {localizations.map((localization: any) => (
                          <SelectItem
                            value={localization.id}
                            key={localization.id}>
                            {localization.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4 text-end">
              <Button variant="success">{i18n.t('Save Preference')}</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
