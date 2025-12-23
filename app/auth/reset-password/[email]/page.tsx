'use client';

import {z} from 'zod';
import Link from 'next/link';
import {useRouter, useSearchParams} from 'next/navigation';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {MdOutlineVisibility, MdOutlineVisibilityOff} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {SEARCH_PARAMS} from '@/constants';
import {i18n} from '@/locale';
import {useToast} from '@/ui/hooks';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {Label} from '@/ui/components/label';
import {Button} from '@/ui/components/button';

// ---- LOCAL IMPORTS ---- //
import {resetPassword} from '../action';
import {useState, use} from 'react';

const formSchema = z
  .object({
    email: z.string().email().min(1, i18n.t('Email is required')),
    otp: z.string().min(1, i18n.t('OTP is required')),
    password: z
      .string()
      .min(1, i18n.t('Password is required'))
      .min(8, i18n.t('Password must be at least 8 characters')),
    confirmPassword: z.string().min(1, i18n.t('Confirm password is required')),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: i18n.t("Passwords don't match"),
    path: ['confirmPassword'],
  });

export default function Page(props: {params: Promise<{email: string}>}) {
  const params = use(props.params);
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);

  const {toast} = useToast();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword((show: boolean) => !show);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword((show: boolean) => !show);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: decodeURIComponent(params.email),
      otp: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const {email, password, otp} = values;

    const res: any = await resetPassword({
      email,
      password,
      otp,
      tenantId: tenantId!,
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
  };

  return (
    <div className="container space-y-6 mt-8">
      <h1 className="text-[2rem] font-bold">{i18n.t('Reset Password')}</h1>
      <div className="bg-white py-4 px-6 space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      disabled
                      placeholder={i18n.t('Enter email')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="otp"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('OTP')}*</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value}
                      placeholder={i18n.t('Enter OTP')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <Button
              variant="success"
              className="w-full"
              disabled={form.formState.isSubmitting}>
              {i18n.t('Submit')}
            </Button>
          </form>
        </Form>

        <div className="flex items-center">
          <Label className="mr-2 mb-0 inline-flex">
            {i18n.t('Remember password')} ?
          </Label>
          <Link href={`/auth/login?${searchQuery}`} className="text-success">
            {i18n.t('Log In')}
          </Link>
        </div>
      </div>
    </div>
  );
}
