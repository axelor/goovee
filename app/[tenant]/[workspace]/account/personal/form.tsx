'use client';

import {useMemo, useRef, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {z} from 'zod';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {MdDeleteOutline, MdFileUpload} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {Avatar, AvatarImage, AvatarFallback} from '@/ui/components/avatar';
import {Button} from '@/ui/components/button';
import {Checkbox} from '@/ui/components/checkbox';
import {Input} from '@/ui/components/input';
import {ProgressRing} from '@/ui/components';
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
  AlertDialogDescription,
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
import {useSignOut} from '@/ui/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';

// ---- LOCAL IMPORTS ---- //
import {
  PictureUploadAction,
  PictureUploadCancel,
  Title,
} from '../common/ui/components';
import {update, updateProfileImage, generateOTPForUpdate} from './action';
import {
  RoleLabel,
  PARTNER_PICTURE_PURPOSE,
  PARTNER_PICTURE_MAX_FILE_SIZE,
} from '../common/constants';
import {getLoginURL} from '@/utils/url';
import {withBasePath} from '@/lib/core/path/base-path';
import {useStagedUpload} from '@/lib/core/upload/use-staged-upload';

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
  )
  .refine(
    data => {
      if (data.editEmail && data.otp) {
        if (!/^\d{6}$/.test(data.otp)) return false;
      }
      return true;
    },
    {
      message: i18n.t('OTP must be a 6-digit number'),
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
  const pathname = usePathname();
  const {toast} = useToast();
  const {tenant, url} = useWorkspace();
  const {
    uploads,
    upload,
    pause,
    resume,
    remove: removeUpload,
  } = useStagedUpload({tenant});
  const signOut = useSignOut();
  const [confirmation, setConfirmation] = useState<any>(false);
  const [picture, setPicture] = useState<string | undefined>(pictureProp);
  const [updatingPicture, setUpdatingPicture] = useState(false);
  const [pictureUploadId, setPictureUploadId] = useState<string | null>(null);
  const pictureInputRef = useRef<HTMLInputElement | null>(null);
  const pictureUpload = uploads.find(item => item.id === pictureUploadId);
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
      const res: any = await update({
        ...values,
        otp: values.otp || undefined,
      });

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
          await signOut();

          const loginURL = getLoginURL({
            callbackurl: pathname,
            workspaceURI: url.forRouter(),
            tenant,
          });
          window.location.href = withBasePath(loginURL);
        } else {
          handleCancelEditEmail();
          router.refresh();
        }
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

    /* Deleting the picture settles what it should be, so an upload left parked
     * is given up rather than kept resumable — resuming it would put back the
     * picture that was just removed. */
    handleCancelPicture();

    setUpdatingPicture(true);
    try {
      const result = await updateProfileImage({token: null});

      if ('error' in result) {
        toast({title: result.message, variant: 'destructive'});
      } else {
        toast({
          title: i18n.t('Picture deleted successfully.'),
          variant: 'success',
        });
        setPicture(undefined);
      }
    } catch (e) {
      toast({
        title: i18n.t('An unexpected error occurred'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingPicture(false);
    }
  };

  const handleUpdatePicture = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event?.target?.files?.[0];

    if (!file) return;

    /* Clear the input straight away, so picking the same file again — after a
     * rejection or a failure — still counts as a pick rather than as no change
     * at all. The File itself is already in hand and outlives the reset. */
    event.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast({
        title: i18n.t('Only images are allowed.'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > PARTNER_PICTURE_MAX_FILE_SIZE) {
      toast({title: i18n.t('Image is too large.'), variant: 'destructive'});
      return;
    }

    /* Picking again gives up on whatever the last attempt left parked, so a
     * paused or failed upload cannot go on holding server-side storage with
     * nothing on screen still pointing at it. */
    if (pictureUploadId) removeUpload(pictureUploadId);

    setUpdatingPicture(true);
    try {
      const {ids, done} = upload(file, {
        purpose: PARTNER_PICTURE_PURPOSE,
        maxBytes: PARTNER_PICTURE_MAX_FILE_SIZE,
      });
      setPictureUploadId(ids[0] ?? null);
      const [staged] = await done;

      /* Nothing staged means the picture was cancelled, paused or failed. Only
       * the first is finished with — the other two keep their entry, and the
       * ring over the avatar carries the state and the way to carry on. */
      if (!staged) return;

      setPictureUploadId(null);
      await applyStagedPicture(staged.token);
    } catch (error) {
      toast({
        title: i18n.t('An unexpected error occurred'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingPicture(false);
    }
  };

  const applyStagedPicture = async (token: string) => {
    const result = await updateProfileImage({token});

    if ('error' in result) {
      toast({title: result.message, variant: 'destructive'});
    } else {
      toast({
        title: i18n.t('Picture updated successfully.'),
        variant: 'success',
      });
      setPicture(result.data?.id);
    }
  };

  /** Carry on a picture that was paused or that failed part-way. */
  const handleResumePicture = async () => {
    if (!pictureUploadId || updatingPicture) return;

    setUpdatingPicture(true);
    try {
      const staged = await resume(pictureUploadId);
      if (!staged) return;

      setPictureUploadId(null);
      await applyStagedPicture(staged.token);
    } catch (error) {
      toast({
        title: i18n.t('An unexpected error occurred'),
        variant: 'destructive',
      });
    } finally {
      setUpdatingPicture(false);
    }
  };

  const handleCancelPicture = () => {
    if (!pictureUploadId) return;

    removeUpload(pictureUploadId);
    setPictureUploadId(null);
  };

  const isValidEmail = useMemo(() => {
    try {
      z.email().parse(email);
      return true;
    } catch (err) {}
    return false;
  }, [email]);

  const handleGenerateOTP = async () => {
    try {
      const res = await generateOTPForUpdate({email});
      if (res && 'error' in res) {
        toast({title: i18n.t(res.message), variant: 'destructive'});
      } else {
        reset(1);
      }
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="relative size-[72px] shrink-0">
                  <Avatar className="size-[72px] rounded-2xl">
                    <AvatarImage
                      src={getPartnerImageURL(picture, tenant, {
                        noimage: true,
                        noimageSrc: '/images/profile.png',
                      })}
                      alt={fullName}
                      size={72}
                    />
                    <AvatarFallback>{getInitials(fullName)}</AvatarFallback>
                  </Avatar>
                  {pictureUpload && pictureUpload.status !== 'success' && (
                    <div className="absolute inset-0 grid place-items-center rounded-2xl bg-ink-900/50">
                      <ProgressRing
                        value={pictureUpload.progress}
                        tone={
                          pictureUpload.status === 'error'
                            ? 'error'
                            : pictureUpload.status === 'paused'
                              ? 'paused'
                              : 'active'
                        }
                        size={52}
                        label={i18n.t('Uploading profile picture')}>
                        <PictureUploadAction
                          status={pictureUpload.status}
                          onPause={() => pause(pictureUpload.id)}
                          onResume={handleResumePicture}
                        />
                      </ProgressRing>
                      <PictureUploadCancel onCancel={handleCancelPicture} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-sm font-bold text-ink-900">
                      {i18n.t('Profile picture')}
                    </p>
                    <p className="text-xs text-ink-500">
                      {i18n.t('PNG or JPG, 256×256 px min.')}
                    </p>
                    {pictureUpload?.status === 'paused' && (
                      <p className="text-xs text-status-pending-fg">
                        {i18n.t('Upload paused')}
                      </p>
                    )}
                    {pictureUpload?.status === 'error' && (
                      <p className="text-xs text-destructive">
                        {pictureUpload.error}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="royal"
                      size="sm"
                      onClick={openFileUpload}
                      type="button"
                      disabled={updatingPicture}>
                      <MdFileUpload className="size-4" />
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
                      size="sm"
                      onClick={openConfirmation}
                      type="button"
                      disabled={updatingPicture}>
                      <MdDeleteOutline className="size-4" />
                      {i18n.t('Delete')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!isCompany ? (
                  <>
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
                  </>
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
                    variant="royal-outline"
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
                        variant="royal-outline"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
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
              <Button variant="royal">{i18n.t('Save Settings')}</Button>
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
            <AlertDialogDescription>
              {i18n.t('This action cannot be undone.')}
            </AlertDialogDescription>
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
