'use client';

import Image from 'next/image';
import {authClient} from '@/lib/auth-client';
import {zodResolver} from '@hookform/resolvers/zod';
import {useSearchParams} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {z} from 'zod';

// ---- CORE IMPORTS ---- //
import {SEARCH_PARAMS} from '@/constants';
import {i18n, l10n} from '@/locale';
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
import {useToast} from '@/ui/hooks';

// ---- LOCAL IMPORTS ----//

const formSchema = z.object({
  firstName: z.string(),
  name: z.string().min(1, {message: i18n.t('Last name is required.')}),
  email: z.string().optional(),
});

export default function SignUp({
  email,
  inviteId,
}: {
  email: string;
  inviteId: string;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      name: '',
      email,
    },
  });

  const searchParams = useSearchParams();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);
  const workspaceURI = searchParams.get('workspaceURI') as string;
  const callbackurl = searchParams.get('callbackurl');
  const redirection = callbackurl
    ? decodeURIComponent(callbackurl)
    : workspaceURI;

  const {toast} = useToast();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!tenantId) {
      toast({
        title: i18n.t('TenantId is required'),
        variant: 'destructive',
      });
      return;
    }

    await authClient.signIn.social({
      provider: 'google',
      callbackURL: redirection,
      errorCallbackURL: `/auth/error?tenantId=${tenantId}&workspaceURI=${workspaceURI}`,
      requestSignUp: true,
      additionalData: {
        ...values,
        tenantId,
        inviteId,
        locale: l10n.getLocale(),
      },
    });
  };

  return (
    <div className="container space-y-6 mt-8">
      <h1 className="text-[2rem] font-bold">{i18n.t('Sign Up')}</h1>
      <div className="bg-white py-4 px-6 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-xl font-medium">
              {i18n.t('Personal information')}
            </h2>
            <FormField
              control={form.control}
              name="email"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Email')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('First name')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value}
                        placeholder={i18n.t('Enter first Name')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Last name')} *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value}
                        placeholder={i18n.t('Enter Last Name')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button variant="outline-success" className="w-full rounded-full">
              <Image
                alt="Google"
                src="/images/google.svg"
                height={24}
                width={24}
                className="me-2"
              />

              {i18n.t('Sign Up with Google')}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
