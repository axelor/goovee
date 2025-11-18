'use client';
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
import {Checkbox} from '@/ui/components/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form as UIForm,
} from '@/ui/components/form';
import {useToast} from '@/ui/hooks';
import {getPartnerImageURL} from '@/utils/files';
import {packIntoFormData} from '@/utils/formdata';
import {zodResolver} from '@hookform/resolvers/zod';
import Image from 'next/image';
import {useRouter} from 'next/navigation';
import {useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {MdDeleteOutline, MdFileUpload} from 'react-icons/md';
import {useWorkspace} from '../../workspace-context';
import {updateCompanyProfileImage, updateDirectorySettings} from './action';
import {
  directorySettingsSchema,
  type DirectorySettingsFormValues,
} from './schema';

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
  const mainPartner = partner.mainPartner;
  const companyDataSource = isAdminContact
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

  const companyInDirectory = form.watch('companyInDirectory');
  const contactInDirectory = form.watch('contactInDirectory');

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
    try {
      setUpdatingPicture(true);
      const formData = packIntoFormData({picture: null, workspaceURL});
      const {error, message} = await updateCompanyProfileImage(formData);

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

    try {
      setUpdatingPicture(true);
      const formData = packIntoFormData({picture: file, workspaceURL});

      const {error, message, data} = await updateCompanyProfileImage(formData);

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

  return (
    <>
      <UIForm {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {showCompanySection && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{i18n.t('Company')}</h3>
              <hr className="my-4" />
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyInDirectory"
                  render={({field}) => (
                    <FormItem className="flex items-center space-y-0 space-x-2">
                      <FormControl>
                        <Checkbox
                          variant="success"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>
                        {i18n.t('Display my company in directory')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {companyInDirectory && (
                  <div className="ps-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="companyEmail"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>
                            {i18n.t('Display company email')}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>
                            {i18n.t('Display company phone number')}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyWebsite"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>
                            {i18n.t('Display company website')}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>
                            {i18n.t('Display company address')}
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyDescription"
                      render={({field}) => (
                        <FormItem>
                          <FormLabel>{i18n.t('Company Description')}</FormLabel>
                          <FormControl>
                            <RichTextEditor
                              content={
                                companyDataSource?.directoryCompanyDescription
                              }
                              onChange={field.onChange}
                              classNames={{
                                wrapperClassName: 'overflow-visible border-2',
                                toolbarClassName: 'mt-0',
                                editorClassName: 'px-4',
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isAdminContact && (
                      <div className="space-y-4">
                        <FormLabel>{i18n.t('Company picture')}</FormLabel>
                        <div className="flex flex-col lg:flex-row items-center gap-4 justify-between">
                          <div>
                            <Image
                              width={150}
                              height={150}
                              className="rounded-lg object-cover w-36 h-36"
                              src={getPartnerImageURL(picture, tenant, {
                                noimage: true,
                                noimageSrc: NO_IMAGE_URL,
                              })}
                              alt="Company Logo"
                            />
                          </div>
                          <div className="flex items-center gap-4">
                            <Button
                              variant="outline-success"
                              onClick={openFileUpload}
                              type="button"
                              disabled={updatingPicture}>
                              <MdFileUpload className="size-6" />
                              <span className="hidden lg:inline">
                                {i18n.t('Upload a picture')}
                              </span>
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
                              <span className="hidden lg:inline">
                                {i18n.t('Delete')}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {showContactSection && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{i18n.t('Contact')}</h3>
              <hr className="my-4" />
              <div className="space-y-4">
                <FormField
                  name="contactInDirectory"
                  control={form.control}
                  render={({field}) => (
                    <FormItem className="flex items-center space-y-0 space-x-2">
                      <FormControl>
                        <Checkbox
                          variant="success"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>
                        {i18n.t('Add my contact to the directory')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                {contactInDirectory && (
                  <div className="ps-6 space-y-4">
                    <FormField
                      control={form.control}
                      name="contactFunction"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>{i18n.t('Display function')}</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>{i18n.t('Display email')}</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>
                            {i18n.t('Display phone number')}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactLinkedin"
                      render={({field}) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              variant="success"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>{i18n.t('Display LinkedIn')}</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="success"
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
