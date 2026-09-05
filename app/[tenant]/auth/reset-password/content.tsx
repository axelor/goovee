'use client';

import {useRouter, useSearchParams} from 'next/navigation';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdArrowBack, MdArrowForward, MdVpnKey} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/ui/components/form';
import {useToast} from '@/ui/hooks';
import {useAuthClient} from '@/lib/auth-client';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {
  AuthShell,
  AuthField,
  AuthInput,
  authButtonClass,
} from '../common/ui/auth-shell';
import {useTenantScope} from '@/lib/core/url/tenant-context';

const formSchema = z.object({
  email: z.email().min(1, 'Email is required'),
});

export default function Content({
  workspaceName,
}: {
  workspaceName: string | null;
}) {
  const searchParams = useSearchParams();
  const authClient = useAuthClient();
  const searchQuery = searchParams.toString();

  /* A sibling auth screen of this tenant's, carrying the parameters this one was
   * reached with. The tenant is in the address, so nothing has to name it. */
  const tenantScope = useTenantScope();
  const authHref = (path: `/${string}`, extra?: string) => {
    const query = [searchQuery, extra].filter(Boolean).join('&');

    return tenantScope.forRouter(`${path}${query ? `?${query}` : ''}`);
  };

  const {toast} = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {email: ''},
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await authClient.credentials.resetPassword.request({
        email: values.email,
        searchQuery,
      });
      if (!res.error && res.data?.data?.url) {
        router.push(res.data.data.url);
      } else {
        toast({
          variant: 'destructive',
          title: res.error?.message
            ? i18n.t(res.error.message)
            : i18n.t('Error resetting password. Try again.'),
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error resetting password. Try again.'),
      });
    }
  };

  return (
    <AuthShell workspaceName={workspaceName}>
      <Link
        href={authHref(`/auth/login`)}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-royal">
        <MdArrowBack className="size-4" />
        {i18n.t('Back to login')}
      </Link>

      <div className="mb-[18px] grid size-[52px] place-items-center rounded-[13px] bg-royal-pale text-royal">
        <MdVpnKey className="size-6" />
      </div>

      <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">
        {i18n.t('Forgot password?')}
      </h2>
      <p className="mt-2 mb-6 text-sm leading-[1.55] text-ink-500">
        {i18n.t(
          'Enter the email associated with your account, we will send you a verification code.',
        )}
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-[18px]">
          <FormField
            control={form.control}
            name="email"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Email')} required>
                  <FormControl>
                    <AuthInput
                      type="email"
                      placeholder={i18n.t('Enter email')}
                      {...field}
                    />
                  </FormControl>
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={authButtonClass}>
            {i18n.t('Send the code')}
            <MdArrowForward className="size-4" />
          </button>

          <div className="text-center text-[13.5px] text-ink-500">
            {i18n.t('You remember?')}{' '}
            <Link
              href={authHref(`/auth/login`)}
              className="font-bold text-royal hover:underline">
              {i18n.t('Log In')}
            </Link>
          </div>
        </form>
      </Form>
    </AuthShell>
  );
}
