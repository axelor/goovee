'use client';

import {useMemo, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdOutlineVisibility, MdOutlineVisibilityOff} from 'react-icons/md';
import Image from 'next/image';
import {signIn} from 'next-auth/react';

// ---- CORE IMPORTS ---- //
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
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {Separator} from '@/ui/components';
import {SEARCH_PARAMS} from '@/constants';
import {cn} from '@/utils/css';
import {generateOTP} from './actions';

// ---- LOCAL IMPORTS ----//
import {registerByEmail} from '../action';

const formSchema = z
  .object({
    firstName: z.string(),
    name: z.string().min(1, {message: i18n.t('Last name is required.')}),
    email: z.string().min(1, {message: i18n.t('Email is required')}),
    otp: z.string().min(1, {message: i18n.t('OTP is required')}),
    password: z
      .string()
      .min(1, {message: i18n.t('Password is required')})
      .min(8, {message: i18n.t('Password must be at least 8 characters')}),
    confirmPassword: z
      .string()
      .min(1, {message: i18n.t('Confirm password is required')}),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: i18n.t("Passwords don't match"),
    path: ['confirmPassword'],
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
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);
  const {timeRemaining, isExpired, reset} = useCountDown(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {toast} = useToast();

  const toggleShowPassword = () => setShowPassword(show => !show);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(show => !show);

  const handleSignUpWithGoogle = async () => {
    await signIn('google', {
      callbackUrl: `/auth/register/invite/${inviteId}/google?${searchQuery}`,
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!(email && tenantId)) {
      toast({
        title: i18n.t('Email and tenant is required.'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const res: any = await registerByEmail({
        ...values,
        tenantId,
        inviteId,
        locale: l10n.getLocale(),
      });

      if (res.success) {
        toast({
          variant: 'success',
          title: i18n.t('Registration successfully done.'),
        });

        router.push(`/auth/login${res?.data?.query}`);
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
      await generateOTP({inviteId, tenantId});
      reset(1);
    } catch (err) {
      form.setError('email', {
        type: 'custom',
        message: i18n.t('Invalid email address'),
      });
    }
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
                        disabled
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

            <Button variant="success" className="w-full rounded-full">
              {i18n.t('Sign Up')}
            </Button>
          </form>
        </Form>
        <div className="flex items-center gap-4">
          <div className="grow">
            <Separator />
          </div>
          <h5 className="mb-0 font-medium text-[2rem]">{i18n.t('Or')}</h5>
          <div className="grow">
            <Separator />
          </div>
        </div>
        <Button
          type="button"
          variant="outline-success"
          className="w-full rounded-full"
          onClick={handleSignUpWithGoogle}>
          <Image
            alt="Google"
            src="/images/google.svg"
            height={24}
            width={24}
            className="me-2"
          />
          {i18n.t('Sign Up with Google')}
        </Button>
      </div>
    </div>
  );
}
