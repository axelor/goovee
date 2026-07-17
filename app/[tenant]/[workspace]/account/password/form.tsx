'use client';

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
import {useToast} from '@/ui/hooks';
import {PasswordSchema} from '@/utils/validators';

// ---- LOCAL IMPORTS ---- //
import {changePassword} from './action';

const formSchema = z
  .object({
    oldPassword: z.string(),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: i18n.t("Passwords don't match"),
    path: ['confirmPassword'],
  });

export default function PasswordForm() {
  const {toast} = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async ({
    oldPassword,
    newPassword,
    confirmPassword,
  }: z.infer<typeof formSchema>) => {
    const result = await changePassword({
      oldPassword,
      newPassword,
      confirmPassword,
    });

    toast({
      title: result?.message,
      variant: result?.error ? 'destructive' : 'success',
    });

    result.success && form.reset();
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
            name="oldPassword"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Old Password')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    value={field.value}
                    placeholder={i18n.t('Enter old password')}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="hidden md:block" />
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
                    disabled={isSubmitting}
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
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button variant="royal" disabled={isSubmitting}>
            {i18n.t('Change password')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
