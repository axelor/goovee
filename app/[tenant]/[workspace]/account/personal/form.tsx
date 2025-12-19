'use client';

import {useMemo, useReducer, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdFileUpload, MdDeleteOutline} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Avatar, AvatarImage, AvatarFallback} from '@/ui/components/avatar';
import {Button} from '@/ui/components/button';
import {Checkbox} from '@/ui/components/checkbox';
import {Input} from '@/ui/components/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/ui/components/alert-dialog';
import {UserType} from '@/auth/types';
import {useCountDown, useToast} from '@/ui/hooks';
import {getInitials} from '@/utils/names';
import {getPartnerImageURL} from '@/utils/files';
import type {ID} from '@/types';
import {cn} from '@/utils/css';
import {useWorkspace} from '../../workspace-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';

// ---- LOCAL IMPORTS ---- //
import {Title} from '../common/ui/components';
import {update, updateProfileImage, generateOTPForUpdate} from './action';
import {RoleLabel} from '../common/constants';

const formSchema = z
  .object({
    type: z.enum([UserType.company, UserType.individual]),
    firstName: z.string(),
    name: z.string(),
    email: z.string(),
    editEmail: z.boolean().optional(),
    otp: z.string().optional(),
    companyName: z.string(),
    identificationNumber: z.string(),
    companyNumber: z.string(),
    role: z.string(),
    showProfileAsContactOnDirectory: z.boolean(),
    showNameOnDirectory: z.boolean(),
    showLinkOnDirectory: z.boolean(),
    showEmailOnDirectory: z.boolean(),
    showPhoneOnDirectory: z.boolean(),
    linkedInLink: z.string(),
    mainPartner: z.string().optional(),
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
  )
  .refine(
    data => {
      if (data.editEmail) {
        if (!data.otp) return false;
      }
      return true;
    },
    {
      message: i18n.t('OTP is required'),
      path: ['otp'],
    },
  );

export default function Personal({
  settings: {
    type,
    companyName,
    identificationNumber,
    companyNumber,
    firstName,
    name,
    email: emailProp,
    picture: pictureProp,
    fullName,
    role,
    mainPartner,
    linkedinLink,
  },
  partners,
}: {
  settings: {
    type: UserType;
    companyName?: string;
    identificationNumber?: string;
    companyNumber?: string;
    firstName?: string;
    name: string;
    email: string;
    picture?: string;
    fullName?: string;
    role?: string;
    mainPartner?: string;
    linkedinLink?: string;
  };
  partners: Array<{id: ID; name: string}>;
}) {
  const {toast} = useToast();
  const {data: session, update: updateSession} = useSession();
  const {tenant, workspaceURL} = useWorkspace();
  const [confirmation, setConfirmation] = useState<any>(false);
  const [picture, setPicture] = useState<any>(pictureProp);
  const [updatingPicture, setUpdatingPicture] = useState(false);
  const pictureInputRef = useRef<any>(undefined);
  const router = useRouter();

  const {timeRemaining, isExpired, reset} = useCountDown(0);

  const isCompany = type === UserType.company;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type,
      companyName,
      identificationNumber: identificationNumber || '',
      companyNumber: companyNumber || '',
      firstName: firstName || '',
      name,
      email: emailProp,
      otp: '',
      role,
      showProfileAsContactOnDirectory: false,
      showNameOnDirectory: false,
      showLinkOnDirectory: false,
      showEmailOnDirectory: false,
      showPhoneOnDirectory: false,
      linkedInLink: linkedinLink || '',
      mainPartner,
    },
  });

  const email = form.watch('email');
  const editEmail = form.watch('editEmail');

  const updateEmailEdit = (value: boolean) => {
    form.setValue('editEmail', value, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleEmailEdit = () => {
    updateEmailEdit(true);
  };

  const handleCancelEditEmail = () => {
    updateEmailEdit(false);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res: any = await update(values);

      if ('success' in res) {
        toast({
          variant: 'success',
          title: res.message,
        });

        const isMainPartnerUpdated =
          mainPartner &&
          values.mainPartner &&
          mainPartner !== values.mainPartner;

        /**
         * Update session when change in email or main partner for contact
         */
        if (editEmail || isMainPartnerUpdated) {
          await updateSession({
            email,
            id: session?.user?.id,
            tenantId: tenant,
          });
        }

        handleCancelEditEmail();

        router.refresh();
      } else {
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

  const openConfirmation = () => {
    setConfirmation(true);
  };

  const closeConfirmation = () => {
    setConfirmation(false);
  };

  const openFileUpload = () => {
    pictureInputRef?.current?.click();
  };

  const handleDeletePicture = async () => {
    closeConfirmation();
    setUpdatingPicture(true);

    const formData = new FormData();
    formData.append('picture', '');

    const result = await updateProfileImage(formData);

    if ('error' in result) {
      toast({title: result.message, variant: 'destructive'});
    } else {
      toast({
        title: i18n.t('Picture deleted successfully.'),
        variant: 'success',
      });
      setPicture(null);
    }
    setUpdatingPicture(false);
  };

  const handleUpdatePicture = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event?.target?.files?.[0];

    if (!file) return;

    setUpdatingPicture(true);

    const formData = new FormData();
    formData.append('picture', file);

    const result = await updateProfileImage(formData);

    if ('error' in result) {
      toast({title: result.message, variant: 'destructive'});
    } else {
      toast({
        title: i18n.t('Picture updated successfully.'),
        variant: 'success',
      });
      setPicture(result.data?.id);
    }
    setUpdatingPicture(false);
  };

  const isValidEmail = useMemo(() => {
    try {
      z.string().email().parse(email);
      return true;
    } catch (err) {}
    return false;
  }, [email]);

  const handleGenerateOTP = async () => {
    try {
      await generateOTPForUpdate({email, workspaceURL});
      reset(1);
    } catch (err) {
      form.setError('email', {
        type: 'custom',
        message: i18n.t('Invalid email address'),
      });
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-2">
          <div className="space-y-10">
            <div className="space-y-4">
              <Title text={i18n.t('Profile Settings')} />
              <div className="space-y-4">
                <FormLabel>{i18n.t('Picture')}</FormLabel>
                <div className="flex items-center justify-between">
                  <div>
                    <Avatar className="size-20">
                      <AvatarImage
                        src={getPartnerImageURL(picture, tenant, {
                          noimage: true,
                          noimageSrc: '/images/profile.png',
                        })}
                      />
                      <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline-success"
                      onClick={openFileUpload}
                      type="button"
                      disabled={updatingPicture}>
                      <MdFileUpload className="size-6" />
                      {i18n.t('Upload a picture')}
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      ref={pictureInputRef}
                      onChange={handleUpdatePicture}
                    />
                    <Button
                      variant="outline-destructive"
                      onClick={openConfirmation}
                      type="button"
                      disabled={updatingPicture}>
                      <MdDeleteOutline className="size-6" />
                      {i18n.t('Delete')}
                    </Button>
                  </div>
                </div>
              </div>

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
                        <FormLabel>{i18n.t('Last name')}</FormLabel>
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

              <div
                className={cn(
                  'grid grid-cols-1 md:grid-cols-2 gap-4 items-start',
                  {
                    'items-end': !editEmail,
                  },
                )}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{i18n.t('Email')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!editEmail}
                          value={field.value}
                          placeholder={i18n.t('Enter email')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!editEmail ? (
                  <Button
                    variant="outline-success"
                    className="w-fit"
                    type="button"
                    onClick={handleEmailEdit}>
                    {i18n.t('Update Email')}
                  </Button>
                ) : (
                  <div
                    className={cn(
                      'grid grid-cols-1 md:grid-cols-2 gap-4 items-end',
                      {
                        'items-center': form.formState.errors.otp,
                      },
                    )}>
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

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline-success"
                        type="button"
                        disabled={!email || !isExpired || !isValidEmail}
                        onClick={handleGenerateOTP}>
                        {i18n.t('Generate OTP')}
                      </Button>
                      <Button
                        variant="outline-destructive"
                        type="button"
                        onClick={handleCancelEditEmail}>
                        {i18n.t('Cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {editEmail && (
                <div
                  className={cn('flex justify-end text-muted-foreground', {
                    hidden: isExpired,
                  })}>
                  <p>
                    {i18n.t('Resend OTP in ')}
                    {timeRemaining.minutes}:{timeRemaining.seconds}
                  </p>
                </div>
              )}
              {isCompany && (
                <>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>{i18n.t('Company name')}</FormLabel>
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
                    name="identificationNumber"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>{i18n.t('identification number')}</FormLabel>
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
              <FormField
                control={form.control}
                name="role"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Role')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={i18n.t((RoleLabel as any)[field.value])}
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {Boolean(partners?.length > 1) && (
                <FormField
                  control={form.control}
                  name="mainPartner"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>{i18n.t('Partner')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={i18n.t('Select your partner')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {partners.map((partner: any) => (
                            <SelectItem value={partner.id} key={partner.id}>
                              {partner.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {!isCompany && (
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
            )}
            <div className="sr-only space-y-4">
              <Title text={i18n.t('Directory')}></Title>
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
            </div>
            <div className="space-y-4 text-end">
              <Button variant="success">{i18n.t('Save Settings')}</Button>
            </div>
          </div>
        </form>
      </Form>
      <AlertDialog open={confirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Do you want to delete picture?')}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmation}>
              {i18n.t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePicture}>
              {i18n.t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
