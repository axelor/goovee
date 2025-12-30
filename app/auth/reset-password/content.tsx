'use client';

import React from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
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
import {SEARCH_PARAMS} from '@/constants';
import {useToast} from '@/ui/hooks';
import {requestResetPassword} from './action';

const formSchema = z.object({
  email: z.email().min(1, 'Email is required'),
});

export default function Content() {
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);

  const {toast} = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const res: any = await requestResetPassword({
      email: values.email,
      tenantId: tenantId!,
      searchQuery,
    });
    if (res.success && res.data?.url) {
      router.push(res.data.url);
    } else {
      toast({
        variant: 'destructive',
        title: res.message || i18n.t('Error resetting password. Try again.'),
      });
    }
  };

  return (
    <div className="container space-y-6 mt-8 md:!w-3/4 xl:!w-1/2">
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
                      placeholder={i18n.t('Enter email')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button variant="success" className="w-full">
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
