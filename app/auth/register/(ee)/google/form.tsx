'use client';

import Link from 'next/link';
import Image from 'next/image';
import {authClient} from '@/lib/auth-client';
import {useRouter, useSearchParams} from 'next/navigation';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

// ---- CORE IMPORTS ---- //
import {UserType} from '@/auth/types';
import {i18n, l10n} from '@/locale';
import {useToast} from '@/ui/hooks';
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
import type {PortalWorkspace} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {subscribe} from '../../actions';

const formSchema = z
  .object({
    type: z.enum([UserType.company, UserType.individual]),
    companyName: z.string().superRefine((val, ctx) => {}),
    indentificationNumber: z.string(),
    companyNumber: z.string(),
    firstName: z.string(),
    email: z.string().optional(),
    name: z.string(),
    phone: z.string(),
    showProfileAsContactOnDirectory: z.boolean(),
    showNameOnDirectory: z.boolean(),
    showLinkOnDirectory: z.boolean(),
    showEmailOnDirectory: z.boolean(),
    showPhoneOnDirectory: z.boolean(),
    linkedInLink: z.string(),
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
  const {data: session} = authClient.useSession();
  const user = session?.user;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: UserType.individual,
      companyName: '',
      indentificationNumber: '',
      companyNumber: '',
      firstName: '',
      name: '',
      email: user?.email || '',
      phone: '',
      showProfileAsContactOnDirectory: false,
      showNameOnDirectory: false,
      showLinkOnDirectory: false,
      showEmailOnDirectory: false,
      showPhoneOnDirectory: false,
      linkedInLink: '',
    },
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = new URLSearchParams(searchParams).toString();
  const tenantId = searchParams.get(SEARCH_PARAMS.TENANT_ID);
  const workspaceURI = searchParams.get('workspaceURI') as string;
  const callbackurl = searchParams.get('callbackurl');
  const redirection = callbackurl
    ? decodeURIComponent(callbackurl)
    : workspaceURI;

  const showDirectoryControls = form.watch(
    'showProfileAsContactOnDirectory',
    false,
  );

  const {toast} = useToast();

  const handleCancel = () => {
    router.replace('/');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!(workspace && tenantId)) return;
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: redirection,
      errorCallbackURL: `/auth/error?tenantId=${tenantId}&workspaceURI=${workspaceURI}`,
      requestSignUp: true,
      additionalData: {
        ...values,
        tenantId,
        workspaceURL: workspace?.url,
        locale: l10n.getLocale(),
      },
    });
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

  const isCompany = form.watch('type') === UserType.company;

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
            {user?.email && (
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
