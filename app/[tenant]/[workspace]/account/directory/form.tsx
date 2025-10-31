'use client';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Checkbox} from '@/ui/components/checkbox';
import {RichTextEditor} from '@/ui/components';
import {
  Form as UIForm,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {updateDirectorySettings} from './action';
import {useToast} from '@/ui/hooks';
import {Partner} from '@/orm/partner';
import {
  directorySettingsSchema,
  type DirectorySettingsFormValues,
} from './schema';
import {useWorkspace} from '../../workspace-context';
import {useRouter} from 'next/navigation';

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
  const {workspaceURL} = useWorkspace();
  const mainPartner = partner.mainPartner;
  const companyDataSource = isAdminContact
    ? mainPartner
    : isPartner
      ? partner
      : null;

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
          title: i18n.t('Settings updated successfully'),
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

  return (
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
                        <FormLabel>{i18n.t('Display company email')}</FormLabel>
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
                        <FormLabel>{i18n.t('Display phone number')}</FormLabel>
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
  );
}
