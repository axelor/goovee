'use client';

import {useMemo, useState} from 'react';
import {authClient} from '@/lib/auth-client';
import {useRouter, useSearchParams} from 'next/navigation';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdArrowBack, MdArrowForward, MdKeyboardArrowDown} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {UserType} from '@/auth/types';
import {i18n, l10n} from '@/locale';
import {useCountDown, useToast} from '@/ui/hooks';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/ui/components/dialog';
import {Button} from '@/ui/components/button';
import {Checkbox} from '@/ui/components/checkbox';
import {Input} from '@/ui/components/input';
import {SEARCH_PARAMS} from '@/constants';
import {cn} from '@/utils/css';
import {InnerHTML} from '@/ui/components/inner-html';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import {subscribe} from '../actions';
import {WorkspaceForRegistration} from '@/orm/workspace';
import {PasswordSchema} from '@/utils/validators';
import {
  AuthShell,
  AuthField,
  AuthInput,
  PasswordInput,
  authButtonClass,
  authInputClass,
} from '../../common/ui/auth-shell';

const formSchema = z
  .object({
    type: z.enum([UserType.company, UserType.individual]),
    companyName: z.string().superRefine((val, ctx) => {}),
    identificationNumber: z.string(),
    companyNumber: z.string(),
    firstName: z.string(),
    otp: z
      .string()
      .regex(/^\d{6}$/, {message: i18n.t('Validation code is required')}),
    name: z.string(),
    email: z.string().min(1, {message: i18n.t('Email is required')}),
    phone: z.string(),
    password: PasswordSchema,
    confirmPassword: z
      .string()
      .min(1, {message: i18n.t('Confirm password is required')}),
    showProfileAsContactOnDirectory: z.boolean(),
    showNameOnDirectory: z.boolean(),
    showLinkOnDirectory: z.boolean(),
    showEmailOnDirectory: z.boolean(),
    showPhoneOnDirectory: z.boolean(),
    linkedInLink: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: i18n.t("Passwords don't match"),
    path: ['confirmPassword'],
  })
  .refine(
    data => {
      if (data.type === UserType.company) {
        if (!data.companyName) return false;
      }
      return true;
    },
    {
      message: i18n.t('Company name is required'),
      path: ['companyName'],
    },
  )
  .refine(
    data => {
      if (data.type === UserType.individual) {
        if (!data.name) return false;
      }
      return true;
    },
    {
      message: i18n.t('Name is required'),
      path: ['name'],
    },
  );

export default function SignUp({
  workspace,
}: {
  workspace?: WorkspaceForRegistration;
}) {
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const router = useRouter();
  const searchParams = useSearchParams();

  const getParam = (key: string) => searchParams.get(key);

  const searchQuery = new URLSearchParams(searchParams).toString();

  const tenantId = getParam(SEARCH_PARAMS.TENANT_ID);
  const typeParam = getParam(SEARCH_PARAMS.USER_TYPE);

  let $email = '';
  let companyName = '';
  let identificationNumber = '';

  const isValidUserType = Object.values(UserType).includes(
    typeParam as UserType,
  );

  const isTypeLocked = isValidUserType;
  const defaultType = isValidUserType
    ? (typeParam as UserType)
    : UserType.individual;

  const $isCompany = defaultType === UserType.company;

  if ($isCompany) {
    $email = getParam(SEARCH_PARAMS.EMAIL) || '';
    companyName = getParam(SEARCH_PARAMS.COMPANY_NAME) || '';
    identificationNumber = getParam(SEARCH_PARAMS.IDENTIFICATION_NUMBER) || '';
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: defaultType,
      companyName,
      identificationNumber,
      companyNumber: '',
      firstName: '',
      name: '',
      email: $email,
      otp: '',
      phone: '',
      password: '',
      confirmPassword: '',
      showProfileAsContactOnDirectory: false,
      showNameOnDirectory: false,
      showLinkOnDirectory: false,
      showEmailOnDirectory: false,
      showPhoneOnDirectory: false,
      linkedInLink: '',
    },
  });

  const {timeRemaining, isExpired, reset} = useCountDown(0);

  const showDirectoryControls = form.watch(
    'showProfileAsContactOnDirectory',
    false,
  );

  const [accept, setAccept] = useState(false);
  const {toast} = useToast();

  const handleCancel = () => {
    router.replace('/');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!(workspace && tenantId)) return;

    try {
      const res = await authClient.credentials.register({
        ...values,
        workspaceURL: workspace?.url,
        tenantId,
        locale: l10n.getLocale(),
      });

      if (!res.error) {
        toast({
          variant: 'success',
          title: i18n.t('Registered successfully'),
        });
        router.push(`/auth/login?${searchQuery}`);
      } else {
        toast({
          variant: 'destructive',
          title: res.error.message
            ? i18n.t(res.error.message)
            : i18n.t('Error registering, try again'),
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error registering, try again'),
      });
    }
  };

  const handleSubscription = async () => {
    if (!workspace || !tenantId) return;

    try {
      const res: any = await subscribe({workspace, tenantId});

      if (res.error) {
        toast({variant: 'destructive', title: res.message});
      } else if (res.success) {
        toast({variant: 'success', title: res.message});
        router.replace(workspace.url);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: i18n.t('Error subscribing, try again'),
      });
    }
  };

  const isCompany = form.watch('type') === UserType.company;
  const email = form.watch('email');

  const isValidEmail = useMemo(() => {
    try {
      z.email().parse(email);
      return true;
    } catch (err) {}
    return false;
  }, [email]);

  const handleGenerateOTP = async () => {
    if (!tenantId) return;

    try {
      const res = await authClient.credentials.register.sendOtp({
        email,
        tenantId,
        workspaceURL: workspace?.url,
      });
      if (!res.error) {
        reset(1);
      } else {
        form.setError('email', {
          type: 'custom',
          message: res.error.message
            ? i18n.t(res.error.message)
            : i18n.t('Invalid email address'),
        });
      }
    } catch (err) {
      form.setError('email', {
        type: 'custom',
        message: i18n.t('Invalid email address'),
      });
    }
  };

  if (user?.id) {
    return (
      <Dialog open onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{i18n.t('Already an user')}</DialogTitle>
            <DialogDescription>
              {i18n.t(
                `You are already a user, do you want to subscribe to ${workspace?.url} ?`,
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              {i18n.t('Cancel')}
            </Button>
            <Button type="button" onClick={handleSubscription}>
              {i18n.t('Subscribe')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const termsText = workspace?.config?.termsOfUseAcceptanceText;

  return (
    <AuthShell>
      <Link
        href={`/auth/register?${searchQuery}`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-500 transition-colors hover:text-royal">
        <MdArrowBack className="size-4" />
        {i18n.t('Back')}
      </Link>

      <div className="mb-6">
        <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">
          {i18n.t('Sign Up')}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-ink-500">
          {i18n.t('Personal information')}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4">
          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Type')}>
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isTypeLocked}
                      className={cn(
                        authInputClass,
                        'cursor-pointer appearance-none pr-10',
                      )}>
                      <option value={UserType.individual}>
                        {i18n.t('Private Individual')}
                      </option>
                      <option value={UserType.company}>
                        {i18n.t('Company')}
                      </option>
                    </select>
                    <MdKeyboardArrowDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  </div>
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          {isCompany ? (
            <>
              <FormField
                control={form.control}
                name="companyName"
                render={({field}) => (
                  <FormItem className="space-y-0">
                    <AuthField label={i18n.t('Company name')} required>
                      <FormControl>
                        <AuthInput
                          {...field}
                          placeholder={i18n.t('Enter company name')}
                        />
                      </FormControl>
                    </AuthField>
                    <FormMessage className="mt-1.5" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="identificationNumber"
                render={({field}) => (
                  <FormItem className="space-y-0">
                    <AuthField label={i18n.t('Identification number')}>
                      <FormControl>
                        <AuthInput
                          {...field}
                          placeholder={i18n.t('Enter company SIRET number')}
                        />
                      </FormControl>
                    </AuthField>
                    <FormMessage className="mt-1.5" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyNumber"
                render={({field}) => (
                  <FormItem className="space-y-0">
                    <AuthField label={i18n.t('Company number')}>
                      <FormControl>
                        <AuthInput
                          {...field}
                          placeholder={i18n.t('Enter company number')}
                        />
                      </FormControl>
                    </AuthField>
                    <FormMessage className="mt-1.5" />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              <FormField
                control={form.control}
                name="firstName"
                render={({field}) => (
                  <FormItem className="space-y-0">
                    <AuthField label={i18n.t('First name')}>
                      <FormControl>
                        <AuthInput
                          {...field}
                          placeholder={i18n.t('Enter first Name')}
                        />
                      </FormControl>
                    </AuthField>
                    <FormMessage className="mt-1.5" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({field}) => (
                  <FormItem className="space-y-0">
                    <AuthField label={i18n.t('Last name')} required>
                      <FormControl>
                        <AuthInput
                          {...field}
                          placeholder={i18n.t('Enter Last Name')}
                        />
                      </FormControl>
                    </AuthField>
                    <FormMessage className="mt-1.5" />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Email')} required>
                  <FormControl>
                    <AuthInput
                      type="email"
                      {...field}
                      placeholder={i18n.t('Enter email')}
                    />
                  </FormControl>
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          {/* Validation code + generate */}
          <FormField
            control={form.control}
            name="otp"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Validation code')} required>
                  <div className="flex gap-2.5">
                    <FormControl>
                      <AuthInput
                        {...field}
                        inputMode="numeric"
                        placeholder={i18n.t('Code received by email')}
                        className="flex-1"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={handleGenerateOTP}
                      disabled={!email || !isExpired || !isValidEmail}
                      className="shrink-0 whitespace-nowrap rounded-[11px] border border-royal-border bg-royal-pale px-4 text-[13px] font-bold text-royal-dark transition-colors hover:bg-royal-pale/70 disabled:cursor-not-allowed disabled:opacity-50">
                      {i18n.t('Generate code')}
                    </button>
                  </div>
                  {!isExpired && (
                    <span className="mt-1.5 block text-[12px] text-ink-500">
                      {i18n.t('Resend validation code in ')}
                      {timeRemaining.minutes}:{timeRemaining.seconds}
                    </span>
                  )}
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          {/* Password + confirm */}
          <FormField
            control={form.control}
            name="password"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Password')} required>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder={i18n.t('Enter password')}
                    />
                  </FormControl>
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({field}) => (
              <FormItem className="space-y-0">
                <AuthField label={i18n.t('Confirm Password')} required>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder={i18n.t('Enter password')}
                    />
                  </FormControl>
                </AuthField>
                <FormMessage className="mt-1.5" />
              </FormItem>
            )}
          />

          {/* Directory controls (kept hidden; preserved behavior) */}
          <div className="sr-only space-y-4">
            <FormField
              control={form.control}
              name="showProfileAsContactOnDirectory"
              render={({field}) => (
                <FormItem className="flex flex-row items-center space-x-6 space-y-0">
                  <FormControl>
                    <Checkbox
                      variant="success"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>
                    {i18n.t(
                      'Show my profile as a contact for my company on the portal directory',
                    )}
                  </FormLabel>
                </FormItem>
              )}
            />
            {showDirectoryControls && (
              <>
                <FormField
                  control={form.control}
                  name="showNameOnDirectory"
                  render={({field}) => (
                    <FormItem className="flex flex-row items-center space-x-6 space-y-0">
                      <FormControl>
                        <Checkbox
                          variant="success"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>{i18n.t('Name')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showLinkOnDirectory"
                  render={({field}) => (
                    <FormItem className="flex flex-row items-center space-x-6 space-y-0">
                      <FormControl>
                        <Checkbox
                          variant="success"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>{i18n.t('LinkedIn')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showEmailOnDirectory"
                  render={({field}) => (
                    <FormItem className="flex flex-row items-center space-x-6 space-y-0">
                      <FormControl>
                        <Checkbox
                          variant="success"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>{i18n.t('Email')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showPhoneOnDirectory"
                  render={({field}) => (
                    <FormItem className="flex flex-row items-center space-x-6 space-y-0">
                      <FormControl>
                        <Checkbox
                          variant="success"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>{i18n.t('Phone')}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="linkedInLink"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{i18n.t('LinkedIn link')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value}
                          placeholder={i18n.t('Enter your linkedin link')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {/* Terms (CGU) */}
          <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-[1.5] text-ink-600">
            <input
              type="checkbox"
              checked={accept}
              onChange={e => setAccept(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-royal"
            />
            <span>
              {termsText ? (
                <InnerHTML content={termsText} />
              ) : (
                i18n.t('By using this portal, you accept the terms of use.')
              )}
            </span>
          </label>

          <button
            type="submit"
            disabled={!accept || form.formState.isSubmitting}
            className={authButtonClass}>
            {i18n.t('Sign Up')}
            <MdArrowForward className="size-4" />
          </button>

          <div className="text-center text-[13.5px] text-ink-500">
            {i18n.t('Already have an account')} ?{' '}
            <Link
              href={`/auth/login?${searchQuery}`}
              className="font-bold text-royal hover:underline">
              {i18n.t('Log In')}
            </Link>
          </div>
        </form>
      </Form>
    </AuthShell>
  );
}
