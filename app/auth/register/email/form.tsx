'use client';

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {useSession} from 'next-auth/react';
import {useRouter, useSearchParams} from 'next/navigation';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdOutlineVisibility, MdOutlineVisibilityOff} from 'react-icons/md';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components';
import {Button} from '@/ui/components/button';
import {Checkbox} from '@/ui/components/checkbox';
import {Input} from '@/ui/components/input';
import {SEARCH_PARAMS} from '@/constants';
import {cn} from '@/utils/css';
import type {PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {generateOTP} from './actions';
import {registerByEmail, subscribe} from '../actions';

const formSchema = z
  .object({
    type: z.enum([UserType.company, UserType.individual]),
    companyName: z.string().superRefine((val, ctx) => {}),
    indentificationNumber: z.string(),
    companyNumber: z.string(),
    firstName: z.string(),
    otp: z.string().min(1, {message: i18n.t('OTP is required')}),
    name: z.string(),
    email: z.string().min(1, {message: i18n.t('Email is required')}),
    phone: z.string(),
    password: z
      .string()
      .min(1, {message: i18n.t('Password is required')})
      .min(8, {message: i18n.t('Password must be at least 8 characters')}),
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

export default function SignUp({workspace}: {workspace?: PortalWorkspace}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: UserType.individual,
      companyName: '',
      indentificationNumber: '',
      companyNumber: '',
      firstName: '',
      name: '',
      email: '',
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

  const {data: session} = useSession();
  const user = session?.user;

  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);
  const {timeRemaining, isExpired, reset} = useCountDown(0);

  const showDirectoryControls = form.watch(
    'showProfileAsContactOnDirectory',
    false,
  );

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {toast} = useToast();

  const toggleShowPassword = () => setShowPassword(show => !show);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(show => !show);

  const handleCancel = () => {
    router.replace('/');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!(workspace && tenantId)) return;

    try {
      const res: any = await registerByEmail({
        ...values,
        workspaceURL: workspace?.url,
        tenantId,
        locale: l10n.getLocale(),
      });

      if (res.success) {
        toast({
          variant: 'success',
          title: res.message,
        });
        router.push(`/auth/login?${searchQuery}`);
      } else if (res.error) {
        toast({
          variant: 'destructive',
          title: res.message,
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
    if (!workspace) return;

    try {
      const res: any = await subscribe({
        workspace,
        tenantId,
      });

      if (res.error) {
        toast({
          variant: 'destructive',
          title: res.message,
        });
      } else if (res.success) {
        toast({
          variant: 'success',
          title: res.message,
        });
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
      z.string().email().parse(email);
      return true;
    } catch (err) {}
    return false;
  }, [email]);

  const handleGenerateOTP = async () => {
    if (!tenantId) return;

    try {
      await generateOTP({email, tenantId, workspaceURL: workspace?.url});
      reset(1);
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

  return (
    <div className="container space-y-6 mt-8 md:!w-3/4 xl:!w-1/2">
      <h1 className="text-[2rem] font-bold">{i18n.t('Sign Up')}</h1>
      <div className="bg-white py-4 px-6 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-xl font-medium">
              {i18n.t('Personal information')}
            </h2>
            <FormField
              control={form.control}
              name="type"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Type')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={i18n.t('Select your account type')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        {
                          label: i18n.t('Company'),
                          value: UserType.company,
                        },
                        {
                          label: i18n.t('Private Individual'),
                          value: UserType.individual,
                        },
                      ].map(type => (
                        <SelectItem value={type.value} key={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isCompany && (
              <>
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>
                        {i18n.t('Company name')}
                        {isCompany && '*'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value}
                          placeholder={i18n.t('Enter company name')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="indentificationNumber"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{i18n.t('Identification number')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value}
                          placeholder={i18n.t('Enter company SIRET number')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyNumber"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{i18n.t('Company number')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value}
                          placeholder={i18n.t('Enter company number')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
              {!isCompany ? (
                <FormField
                  control={form.control}
                  name="name"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>
                        {i18n.t('Last name')}
                        {!isCompany && '*'}
                      </FormLabel>
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
              ) : (
                <div />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="email"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Email')}*</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value}
                        placeholder={i18n.t('Enter email')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div
                className={cn('grid grid-cols-2 gap-4 items-end', {
                  'items-center': form.formState.errors.otp,
                })}>
                <FormField
                  control={form.control}
                  name="otp"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{i18n.t('OTP')}*</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          value={field.value}
                          placeholder={i18n.t('Enter OTP')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  variant="outline-success"
                  type="button"
                  disabled={!email || !isExpired || !isValidEmail}
                  onClick={handleGenerateOTP}>
                  {i18n.t('Generate OTP')}
                </Button>
              </div>
            </div>
            <div
              className={cn('flex justify-end text-muted-foreground', {
                hidden: isExpired,
              })}>
              <p>
                {i18n.t('Resend OTP in ')}
                {timeRemaining.minutes}:{timeRemaining.seconds}
              </p>
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Password')}*</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 border border-input px-3 py-2">
                      <Input
                        {...field}
                        className="h-auto border-0 ring-0 py-0 px-0 focus-visible:ring-transparent"
                        type={showPassword ? 'text' : 'password'}
                        value={field.value}
                        placeholder={i18n.t('Enter password')}
                      />
                      {showPassword ? (
                        <MdOutlineVisibility
                          className="size-6 text-muted cursor-pointer"
                          onClick={toggleShowPassword}
                        />
                      ) : (
                        <MdOutlineVisibilityOff
                          className="size-6 text-muted cursor-pointer"
                          onClick={toggleShowPassword}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Confirm Password')}*</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 border border-input px-3 py-2">
                      <Input
                        {...field}
                        className="h-auto border-0 ring-0 py-0 px-0 focus-visible:ring-transparent"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={field.value}
                        placeholder={i18n.t('Enter password')}
                      />
                      {showConfirmPassword ? (
                        <MdOutlineVisibility
                          className="size-6 text-muted cursor"
                          onClick={toggleShowConfirmPassword}
                        />
                      ) : (
                        <MdOutlineVisibilityOff
                          className="size-6 text-muted cursor"
                          onClick={toggleShowConfirmPassword}
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sr-only space-y-4">
              <h4 className="text-lg font-medium">{i18n.t('Directory')}</h4>
              <div>
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
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          {i18n.t(
                            'Show my profile as a contact for my company on the portal directory',
                          )}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              {showDirectoryControls && (
                <>
                  <div>
                    <p className="font-medium text-base">
                      {i18n.t('Informations displayed in the directory:')}
                    </p>
                  </div>
                  <div className="flex gap-16">
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
                          <div className="space-y-1 leading-none">
                            <FormLabel>{i18n.t('Name')}</FormLabel>
                          </div>
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
                          <div className="space-y-1 leading-none">
                            <FormLabel>{i18n.t('LinkedIn')}</FormLabel>
                          </div>
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
                          <div className="space-y-1 leading-none">
                            <FormLabel>{i18n.t('Email')}</FormLabel>
                          </div>
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
                          <div className="space-y-1 leading-none">
                            <FormLabel>{i18n.t('Phone')}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
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
                  </div>
                </>
              )}
            </div>
            <Button variant="success" className="w-full">
              {i18n.t('Sign Up')}
            </Button>
            <p className="text-success">
              {i18n.t('Already have an account')} ?{' '}
              <Link href={`/auth/login?${searchQuery}`}>
                <span className="underline">{i18n.t('Log In')}</span>
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
