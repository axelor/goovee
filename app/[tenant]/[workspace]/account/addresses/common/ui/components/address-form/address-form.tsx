'use client';

import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {capitalise} from '@/utils';
import {ADDRESS_TYPE, SUBAPP_PAGE} from '@/constants';
import {i18n} from '@/locale';
import {Button, Form} from '@/ui/components';
import {Country} from '@/types';
import {useSearchParams, useToast} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {UserType} from '@/lib/core/auth/types';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';

// ---- LOCAL IMPORTS ---- //
import {
  AddressInformation,
  PersonalInformation,
} from '@/app/[tenant]/[workspace]/account/addresses/common/ui/components';
import {
  createAddress,
  updateAddress,
} from '@/app/[tenant]/[workspace]/account/addresses/common/actions/action';

const personalInformationSchema = z.object({
  addressName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string(),
  companyName: z.string(),
});

const addressInformationSchema = z.object({
  country: z.object({
    id: z.string().min(1, i18n.t('Country is required')),
    name: z.string().min(1, i18n.t('Country name is required')),
  }),
  streetName: z.string().min(1, i18n.t('Street name is required')),
  addressAddition: z.string().optional(),
  zip: z.string().min(1, i18n.t('Zip code is required')),
  townName: z.string().min(1, i18n.t('Town name is required')),
  multipletype: z.boolean().default(false),
});

const formSchema = z.object({
  personalInformation: personalInformationSchema,
  addressInformation: addressInformationSchema,
});

export const AddressForm = ({
  type,
  countries = [],
  address = null,
  userType,
}: {
  type: ADDRESS_TYPE;
  countries?: Country[];
  address?: any;
  userType: UserType;
}) => {
  const title = i18n.t(`${capitalise(type)} Address`);
  const isCompany = userType === UserType.company;

  const {toast} = useToast();
  const router = useRouter();
  const {updateAddress: updateCartAddress} = useCart();

  const {searchParams} = useSearchParams();
  const queryString = new URLSearchParams(searchParams).toString();

  const checkout = searchParams.get('checkout') === 'true';
  const quotation = searchParams.get('quotation') ?? '';

  const {workspaceURI, workspaceURL} = useWorkspace();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personalInformation: {
        addressName: address?.address?.addressl2 ?? '',
        firstName: address?.address?.firstName ?? '',
        lastName: address?.address?.lastName ?? '',
        companyName: address?.address?.companyName ?? '',
      },
      addressInformation: {
        country: {
          id: address?.address?.country?.id ?? '',
          name: address?.address?.country?.name ?? '',
        },
        streetName: address?.address?.streetName ?? '',
        addressAddition: address?.address?.countrySubDivision ?? '',
        zip: address?.address?.zip ?? '',
        townName: address?.address?.townName ?? '',
        multipletype: address?.isInvoicingAddr && address?.isDeliveryAddr,
      },
    },
  });

  const country = form.watch('addressInformation.country');
  const zip = form.watch('addressInformation.zip');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const {addressInformation, personalInformation} = values;
    const {multipletype, townName, country, addressAddition, streetName, zip} =
      addressInformation;
    const {addressName, firstName, lastName, companyName} = personalInformation;

    const isDeliveryAddr = multipletype || type === ADDRESS_TYPE.delivery;
    const isInvoicingAddr = multipletype || type === ADDRESS_TYPE.invoicing;

    const computeFullName = () => {
      return [streetName, addressAddition, zip, townName]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
    };
    const formattedFullName = () => {
      return [streetName, addressAddition, zip, townName, country?.name]
        .filter(Boolean)
        .join('\n')
        .toUpperCase();
    };

    const addressBody = {
      country: country.id,
      addressl2: addressName,
      addressl4: streetName,
      addressl3: addressAddition,
      addressl6: townName,
      zip,
      townName,
      streetName,
      countrySubDivision: addressAddition,
      department: addressName,
      fullName: computeFullName(),
      formattedFullName: formattedFullName(),
      firstName,
      lastName,
      companyName,
    };

    try {
      const action = address ? updateAddress : createAddress;
      const result = await action({
        address: addressBody as any,
        id: address?.id,
        isInvoicingAddr,
        isDeliveryAddr,
      });

      if (result) {
        if (checkout) {
          updateCartAddress({
            addressType: type,
            address: result?.id,
          });
        }
        router.push(
          `${workspaceURI}/${SUBAPP_PAGE.account}/${SUBAPP_PAGE.addresses}?${queryString}`,
        );
      }

      toast({
        variant: result ? 'success' : 'destructive',
        title: result
          ? i18n.t(`Address information saved successfully!`)
          : i18n.t(
              `Something went wrong while ${address ? 'saving' : 'creating'} the address!`,
            ),
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: i18n.t(`Error while ${address ? 'saving' : 'creating'} address`),
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="font-medium text-xl">{title}</div>
          <PersonalInformation form={form} isCompany={isCompany} />
          <AddressInformation countries={countries} form={form} />
        </div>

        <Button
          variant="success"
          className="w-full py-1.5"
          disabled={form.formState.isSubmitting}
          onClick={e => {
            e.preventDefault();
            form.handleSubmit(onSubmit)();
          }}>
          {address ? i18n.t('Save changes') : i18n.t('Create address')}
        </Button>
      </form>
    </Form>
  );
};

export default AddressForm;
