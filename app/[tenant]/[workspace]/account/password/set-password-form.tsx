'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {useCountDown, useToast} from '@/ui/hooks';
import {OTPSchema, PasswordSchema} from '@/utils/validators';

// ---- LOCAL IMPORTS ---- //
import {sendSetPasswordCode, setPassword} from './action';

const formSchema = z
  .object({
    otp: OTPSchema,
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: i18n.t("Passwords don't match"),
    path: ['confirmPassword'],
  });

export default function SetPasswordForm() {
  const {toast} = useToast();
  const router = useRouter();
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const {timeRemaining, isExpired, reset} = useCountDown(0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSendCode = async () => {
    setSending(true);
    const result = await sendSetPasswordCode();
    setSending(false);

    toast({
      title: result.message,
      variant: result.error ? 'destructive' : 'success',
    });

    if (!result.error) {
      setCodeSent(true);
      reset(1);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await setPassword(values);

    toast({
      title: result.message,
      variant: result.error ? 'destructive' : 'success',
    });

    if (!result.error) {
      router.refresh();
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="otp"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Verification code')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={field.value}
                    placeholder={i18n.t('Code received by email')}
                    disabled={!codeSent || isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col justify-end gap-1">
            <Button
              type="button"
              variant="royal-outline"
              disabled={sending || !isExpired || isSubmitting}
              onClick={handleSendCode}>
              {codeSent ? i18n.t('Resend code') : i18n.t('Send code')}
            </Button>
            {!isExpired && (
              <p className="text-sm text-muted-foreground">
                {i18n.t('Resend OTP in ')}
                {timeRemaining.minutes}:{timeRemaining.seconds}
              </p>
            )}
          </div>
          <FormField
            control={form.control}
            name="newPassword"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('New Password')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    value={field.value}
                    placeholder={i18n.t('Enter new password')}
                    disabled={!codeSent || isSubmitting}
                  />
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
                <FormLabel>{i18n.t('Confirm Password')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    value={field.value}
                    placeholder={i18n.t('Confirm new password')}
                    disabled={!codeSent || isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="royal" disabled={!codeSent || isSubmitting}>
            {i18n.t('Set password')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
