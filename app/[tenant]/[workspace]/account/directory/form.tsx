'use client';

import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  MdDeleteOutline,
  MdFileUpload,
  MdOutlineFolderShared,
  MdMailOutline,
  MdPhone,
  MdLanguage,
  MdLocationOn,
  MdPersonOutline,
  MdLink,
} from 'react-icons/md';
import {IconType} from 'react-icons';

// ---- CORE IMPORTS ---- //
import {NO_IMAGE_URL} from '@/constants';
import {i18n} from '@/locale';
import {Partner} from '@/orm/partner';
import {RichTextEditor} from '@/ui/components';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components/alert-dialog';
import {Button} from '@/ui/components/button';
import {Form as UIForm} from '@/ui/components/form';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {getPartnerImageURL} from '@/utils/files';

// ---- LOCAL IMPORTS ---- //
import {useWorkspace} from '../../workspace-context';
import {updateCompanyProfileImage, updateDirectorySettings} from './action';
import {
  directorySettingsSchema,
  type DirectorySettingsFormValues,
} from './schema';
import {
  PARTNER_PICTURE_PURPOSE,
  PARTNER_PICTURE_MAX_FILE_SIZE,
} from '../common/constants';
import {useStagedUpload} from '@/lib/core/upload/use-staged-upload';
import {AccountToggle, SectionHeader} from '../common/ui/components';

export default function Form({
  partner,
  isPartner,
  isAdminContact,
}: {
  partner: Partner;
  isPartner: boolean;
  isAdminContact: boolean;
}) {
  const {toast} = useToast();
  const router = useRouter();
  const {workspaceURL, tenant} = useWorkspace();
  const {upload} = useStagedUpload({tenant});
  const mainPartner = partner.mainPartner;
  const companyDataSource: any = isAdminContact
    ? mainPartner
    : isPartner
      ? partner
      : null;

  const [picture, setPicture] = useState<string | undefined>(
    companyDataSource?.picture?.id,
  );
  const pictureInputRef = useRef<HTMLInputElement | null>(null);
  const [updatingPicture, setUpdatingPicture] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(false);

  const form = useForm<DirectorySettingsFormValues>({
    resolver: zodResolver(directorySettingsSchema),
    defaultValues: {
      companyInDirectory: companyDataSource?.isInDirectory ?? false,
      companyEmail: companyDataSource?.isEmailInDirectory ?? false,
      companyPhone: companyDataSource?.isPhoneInDirectory ?? false,
      companyWebsite: companyDataSource?.isWebsiteInDirectory ?? false,
      companyAddress: companyDataSource?.isAddressInDirectory ?? false,
      companyDescription: companyDataSource?.directoryCompanyDescription ?? '',
      contactInDirectory: partner.isInDirectory ?? false,
      contactFunction: partner.isFunctionInDirectory ?? false,
      contactEmail: partner.isEmailInDirectory ?? false,
      contactPhone: partner.isPhoneInDirectory ?? false,
      contactLinkedin: partner.isLinkedinInDirectory ?? false,
    },
  });

  const showCompanySection = isPartner || isAdminContact;
  const showContactSection = partner.isContact;

  const onSubmit = async (values: DirectorySettingsFormValues) => {
    try {
      const response = await updateDirectorySettings({values, workspaceURL});
      if (response.error) {
        toast({variant: 'destructive', title: response.message});
      } else {
        toast({
          variant: 'success',
          title: i18n.t('Settings updated successfully.'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: i18n.t('An unexpected error occurred'),
      });
    } finally {
      router.refresh();
    }
  };

  const setField = (name: keyof DirectorySettingsFormValues, value: any) =>
    form.setValue(name, value, {shouldDirty: true, shouldValidate: true});

  const companyInDirectory = form.watch('companyInDirectory');
  const contactInDirectory = form.watch('contactInDirectory');
  const wEmail = form.watch('companyEmail');
  const wPhone = form.watch('companyPhone');
  const wWebsite = form.watch('companyWebsite');
  const wAddress = form.watch('companyAddress');

  // Real values shown next to each field toggle.
  const companyName =
    companyDataSource?.simpleFullName ||
    companyDataSource?.name ||
    partner.name ||
    '';
  const emailValue = companyDataSource?.emailAddress?.address || '';
  const phoneValue =
    companyDataSource?.fixedPhone || companyDataSource?.mobilePhone || '';
  const websiteValue = companyDataSource?.webSite || '';
  const addressList = companyDataSource?.partnerAddressList || [];
  const defaultAddress =
    addressList.find((a: any) => a.isInvoicingAddr && a.isDefaultAddr) ||
    addressList.find((a: any) => a.isDefaultAddr) ||
    addressList[0];
  const addressValue = (defaultAddress?.address?.formattedFullName || '')
    .split('\n')
    .filter(Boolean)
    .join(', ');

  const companyFields: {
    name: keyof DirectorySettingsFormValues;
    label: string;
    value: string;
    icon: IconType;
    checked: boolean;
  }[] = [
    {
      name: 'companyEmail',
      label: i18n.t('Email address'),
      value: emailValue,
      icon: MdMailOutline,
      checked: Boolean(wEmail),
    },
    {
      name: 'companyPhone',
      label: i18n.t('Phone'),
      value: phoneValue,
      icon: MdPhone,
      checked: Boolean(wPhone),
    },
    {
      name: 'companyWebsite',
      label: i18n.t('Website'),
      value: websiteValue,
      icon: MdLanguage,
      checked: Boolean(wWebsite),
    },
    {
      name: 'companyAddress',
      label: i18n.t('Postal address'),
      value: addressValue,
      icon: MdLocationOn,
      checked: Boolean(wAddress),
    },
  ];

  const openConfirmation = () => setConfirmation(true);
  const closeConfirmation = () => setConfirmation(false);
  const openFileUpload = () => pictureInputRef?.current?.click();

  const handleDeletePicture = async () => {
    closeConfirmation();
    try {
      setUpdatingPicture(true);
      const {error, message} = await updateCompanyProfileImage({
        token: null,
        workspaceURL,
      });

      if (error) {
        toast({title: message, variant: 'destructive'});
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

    try {
      setUpdatingPicture(true);
      const {done} = upload(file, {purpose: PARTNER_PICTURE_PURPOSE});
      const [staged] = await done;

      if (!staged) {
        toast({
          title: i18n.t('Error updating profile picture. Try again.'),
          variant: 'destructive',
        });
        return;
      }

      const {error, message, data} = await updateCompanyProfileImage({
        token: staged.token,
        workspaceURL,
      });

      if (error) {
        toast({title: message, variant: 'destructive'});
      } else {
        toast({
          title: i18n.t('Picture updated successfully.'),
          variant: 'success',
        });
        setPicture(data?.id ?? undefined);
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

  const logoSrc = getPartnerImageURL(picture, tenant, {
    noimage: true,
    noimageSrc: NO_IMAGE_URL,
  });

  return (
    <>
      <UIForm {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-7">
          {showCompanySection && (
            <div className="flex flex-col gap-[18px]">
              <SectionHeader
                title={i18n.t('Directory visibility')}
                description={i18n.t(
                  'Control what other partners see about your company.',
                )}
              />

              {/* Master switch */}
              <div className="bg-white border border-ink-100 rounded-[14px] shadow-xs p-[18px]">
                <div className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      'w-[42px] h-[42px] rounded-[10px] grid place-items-center shrink-0',
                      companyInDirectory
                        ? 'bg-royal-pale text-royal'
                        : 'bg-ink-50 text-ink-400',
                    )}>
                    <MdOutlineFolderShared className="size-5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-[14.5px] font-bold text-ink-900">
                      {i18n.t('List my company')}
                    </div>
                    <div className="text-[12.5px] text-ink-500 mt-0.5">
                      {companyInDirectory
                        ? i18n.t(
                            'Your listing is visible in the partner directory.',
                          )
                        : i18n.t(
                            'Your listing is hidden — invisible in searches.',
                          )}
                    </div>
                  </div>
                  <AccountToggle
                    size="lg"
                    checked={companyInDirectory}
                    onCheckedChange={v => setField('companyInDirectory', v)}
                    aria-label={i18n.t('List my company')}
                  />
                </div>
              </div>

              <div
                className={cn(
                  'flex flex-col gap-[18px] transition-opacity',
                  !companyInDirectory && 'opacity-50 pointer-events-none',
                )}>
                {isAdminContact && (
                  <div className="bg-white border border-ink-100 rounded-[14px] shadow-xs p-[18px] flex items-center gap-4">
                    <Image
                      width={64}
                      height={64}
                      className="rounded-xl object-cover w-16 h-16 bg-ink-50"
                      src={logoSrc}
                      alt={companyName}
                    />
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink-900 mb-0">
                          {i18n.t('Company logo')}
                        </p>
                        <p className="text-xs text-ink-500 mb-0">
                          {i18n.t('PNG or JPG, 256×256 px min.')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="royal"
                          size="sm"
                          type="button"
                          onClick={openFileUpload}
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
                          type="button"
                          onClick={openConfirmation}
                          disabled={updatingPicture}>
                          <MdDeleteOutline className="size-4" />
                          {i18n.t('Delete')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Displayed information */}
                <div className="bg-white border border-ink-100 rounded-[14px] shadow-xs overflow-hidden">
                  <div className="px-5 py-4 border-b border-ink-100">
                    <h3 className="text-sm font-bold text-ink-900 mb-0">
                      {i18n.t('Displayed information')}
                    </h3>
                    <p className="text-xs text-ink-500 mt-0.5 mb-0">
                      {i18n.t('Choose which fields are public')}
                    </p>
                  </div>
                  {companyFields.map((f, i) => (
                    <div
                      key={f.name}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3',
                        i < companyFields.length - 1 &&
                          'border-b border-ink-100',
                      )}>
                      <span className="w-[30px] h-[30px] rounded-[7px] bg-ink-50 text-ink-500 grid place-items-center shrink-0">
                        <f.icon className="size-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold text-ink-900">
                          {f.label}
                        </div>
                        <div className="text-xs text-ink-500 truncate">
                          {f.value || i18n.t('Not provided')}
                        </div>
                      </div>
                      <AccountToggle
                        checked={f.checked}
                        onCheckedChange={v => setField(f.name, v)}
                        aria-label={f.label}
                      />
                    </div>
                  ))}
                </div>

                {/* Company description — full width rich text */}
                <div className="bg-white border border-ink-100 rounded-[14px] shadow-xs p-[18px]">
                  <h3 className="text-sm font-bold text-ink-900 mb-1">
                    {i18n.t('Company description')}
                  </h3>
                  <p className="text-xs text-ink-500 mb-3">
                    {i18n.t('Introduce your business to other partners')}
                  </p>
                  <RichTextEditor
                    content={companyDataSource?.directoryCompanyDescription}
                    onChange={(value: any) =>
                      setField('companyDescription', value)
                    }
                    classNames={{
                      wrapperClassName: 'overflow-visible border',
                      toolbarClassName: 'mt-0',
                      editorClassName: 'px-4 min-h-[320px]',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {showContactSection && (
            <div className="flex flex-col gap-[18px]">
              {/* Contact master switch */}
              <div className="bg-white border border-ink-100 rounded-[14px] shadow-xs p-[18px]">
                <div className="flex items-center gap-3.5">
                  <span
                    className={cn(
                      'w-[42px] h-[42px] rounded-[10px] grid place-items-center shrink-0',
                      contactInDirectory
                        ? 'bg-royal-pale text-royal'
                        : 'bg-ink-50 text-ink-400',
                    )}>
                    <MdPersonOutline className="size-5" />
                  </span>
                  <div className="flex-1">
                    <div className="text-[14.5px] font-bold text-ink-900">
                      {i18n.t('Add my contact to the directory')}
                    </div>
                    <div className="text-[12.5px] text-ink-500 mt-0.5">
                      {contactInDirectory
                        ? i18n.t('Your contact details can be shown.')
                        : i18n.t('Your contact is hidden from the directory.')}
                    </div>
                  </div>
                  <AccountToggle
                    size="lg"
                    checked={contactInDirectory}
                    onCheckedChange={v => setField('contactInDirectory', v)}
                    aria-label={i18n.t('Add my contact to the directory')}
                  />
                </div>
              </div>

              <div
                className={cn(
                  'bg-white border border-ink-100 rounded-[14px] shadow-xs overflow-hidden transition-opacity',
                  !contactInDirectory && 'opacity-50 pointer-events-none',
                )}>
                <div className="px-5 py-4 border-b border-ink-100">
                  <h3 className="text-sm font-bold text-ink-900 mb-0">
                    {i18n.t('Displayed information')}
                  </h3>
                </div>
                <ContactRow
                  icon={MdPersonOutline}
                  label={i18n.t('Function')}
                  value=""
                  checked={Boolean(form.watch('contactFunction'))}
                  onChange={v => setField('contactFunction', v)}
                />
                <ContactRow
                  icon={MdMailOutline}
                  label={i18n.t('Email address')}
                  value={partner.emailAddress?.address || ''}
                  checked={Boolean(form.watch('contactEmail'))}
                  onChange={v => setField('contactEmail', v)}
                />
                <ContactRow
                  icon={MdPhone}
                  label={i18n.t('Phone')}
                  value={partner.fixedPhone || partner.mobilePhone || ''}
                  checked={Boolean(form.watch('contactPhone'))}
                  onChange={v => setField('contactPhone', v)}
                />
                <ContactRow
                  icon={MdLink}
                  label={i18n.t('LinkedIn')}
                  value={partner.linkedinLink || ''}
                  checked={Boolean(form.watch('contactLinkedin'))}
                  onChange={v => setField('contactLinkedin', v)}
                  last
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="royal"
              type="submit"
              disabled={form.formState.isSubmitting}>
              {i18n.t('Save Settings')}
            </Button>
          </div>
        </form>
      </UIForm>

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

function ContactRow({
  icon: Icon,
  label,
  value,
  checked,
  onChange,
  last,
}: {
  icon: IconType;
  label: string;
  value: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3',
        !last && 'border-b border-ink-100',
      )}>
      <span className="w-[30px] h-[30px] rounded-[7px] bg-ink-50 text-ink-500 grid place-items-center shrink-0">
        <Icon className="size-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-semibold text-ink-900">{label}</div>
        {value && <div className="text-xs text-ink-500 truncate">{value}</div>}
      </div>
      <AccountToggle
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}
