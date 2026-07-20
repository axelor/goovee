'use client';

import {useRouter} from 'next/navigation';
import {useEffect, useState, useTransition} from 'react';

// ---- CORE IMPORTS ---- //
import {Button, Separator} from '@/ui/components';
import {i18n} from '@/locale';
import {ADDRESS_TYPE, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';
import {useCart} from '@/app/[tenant]/[workspace]/(subapps)/shop/common/context/cart-context';

// ---- LOCAL IMPORTS ---- //
import {AddressesList} from '@/app/[tenant]/[workspace]/account/addresses/common/ui/components';
import {
  confirmAddresses,
  deleteAddress,
  updateDefaultAddress,
} from '@/app/[tenant]/[workspace]/account/addresses/common/actions/action';

interface ContentProps {
  quotation: {
    id: string | null;
    invoicingAddress: {
      id: string;
    } | null;
    deliveryAddress: {
      id: string;
    } | null;
  };
  invoicingAddresses: any;
  deliveryAddresses: any;
  fromQuotation?: boolean;
  fromCheckout?: boolean;
  callbackURL?: string;
}

function Content({
  quotation,
  invoicingAddresses,
  deliveryAddresses,
  fromQuotation,
  fromCheckout,
  callbackURL,
}: ContentProps) {
  const [initiating, setInitiating] = useState(true);
  const [selectedAddresses, setSelectedAddresses] = useState({
    invoicing: null,
    delivery: null,
  });

  const [isPending, startTransition] = useTransition();

  const {workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();
  const {toast} = useToast();
  const {cart, updateAddress} = useCart();

  const isSubAppActive = fromQuotation || fromCheckout;

  const queryParams: any = {};

  if (fromQuotation) {
    queryParams.quotation = quotation.id;
  } else if (fromCheckout) {
    queryParams.checkout = true;
  }

  if (callbackURL) {
    queryParams.callbackURL = callbackURL;
  }

  const queryString = new URLSearchParams(queryParams).toString();

  const handleCreate = (type: ADDRESS_TYPE) => {
    router.push(
      `${workspaceURI}/${SUBAPP_PAGE.account}/${SUBAPP_PAGE.addresses}/${type}/${SUBAPP_PAGE.create}${queryString ? `?${queryString}` : ''}`,
    );
  };

  const handleEdit = (type: ADDRESS_TYPE, id: string | number) => {
    router.push(
      `${workspaceURI}/${SUBAPP_PAGE.account}/${SUBAPP_PAGE.addresses}/${type}/${SUBAPP_PAGE.edit}/${id}${queryString ? `?${queryString}` : ''}`,
    );
  };

  const handleDefault = async (
    type: ADDRESS_TYPE,
    id: string,
    isDefault: boolean,
  ) => {
    const result = await updateDefaultAddress({type, id, isDefault});

    if (result) {
      toast({
        title: i18n.t('Default address updated'),
        variant: 'success',
      });
      router.refresh();
    } else {
      toast({
        title: i18n.t('Error updating default address'),
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAddress(id);

    if (result?.error) {
      toast({
        title: i18n.t('Error deleting address'),
        description: result.message,
        variant: 'destructive',
      });
    } else if (result?.success) {
      toast({
        title: i18n.t('Address deleted successfully'),
        variant: 'success',
      });
      router.refresh();
    }
  };

  const handleAddressSelection = (type: ADDRESS_TYPE, partnerAddress: any) => {
    if (fromCheckout) {
      updateAddress({addressType: type, address: partnerAddress?.id});
    }
    setSelectedAddresses(prev => ({...prev, [type]: partnerAddress.address}));
  };

  const handleQuotationConfirm = () => {
    const quotationId = quotation.id;
    const invoicingAddress = selectedAddresses.invoicing;
    const deliveryAddress = selectedAddresses.delivery;

    if (!quotationId || !invoicingAddress || !deliveryAddress) {
      toast({
        variant: 'destructive',
        description: i18n.t(
          'Please select both invoicing and delivery addresses.',
        ),
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await confirmAddresses({
          workspaceURL,
          subAppCode: SUBAPP_CODES.quotations,
          record: {
            id: quotationId,
            deliveryAddress: deliveryAddress,
            mainInvoicingAddress: invoicingAddress,
          },
        });

        if (result.error) {
          toast({
            variant: 'destructive',
            description: i18n.t(result?.message || ''),
          });
        } else {
          toast({
            variant: 'success',
            title: i18n.t('Address changes saved successfully!'),
          });
          router.refresh();
          router.push(
            `${workspaceURI}/${SUBAPP_CODES.quotations}/${quotation.id}`,
          );
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: i18n.t('Something went wrong while saving address!'),
        });
      }
    });
  };

  const handleConfirm = () => {
    if (fromCheckout) {
      router.refresh();
      router.push(callbackURL || `${workspaceURI}/${SUBAPP_PAGE.checkout}`);
    } else if (fromQuotation) {
      handleQuotationConfirm();
    }
  };

  useEffect(() => {
    let invoicingAddress: any, deliveryAddress: any;

    if (fromQuotation) {
      invoicingAddress = quotation?.invoicingAddress || null;
      deliveryAddress = quotation?.deliveryAddress || null;
    } else if (fromCheckout) {
      invoicingAddress = {id: cart?.invoicingAddress || null};
      deliveryAddress = {id: cart?.deliveryAddress || null};
    }

    setSelectedAddresses({
      invoicing: invoicingAddress,
      delivery: deliveryAddress,
    });
    setInitiating(false);
  }, [fromCheckout, fromQuotation, cart, quotation]);

  useEffect(() => {
    router.refresh();
  }, [router]);

  if (initiating) {
    return <p>{i18n.t('Loading')}...</p>;
  }

  return (
    <>
      <div className="bg-white p-4 rounded-lg flex flex-col gap-4">
        {isSubAppActive && (
          <>
            <h4 className="text-xl font-medium mb-0">
              {i18n.t('Choose your address')}
            </h4>
            <Separator className="my-2" />
          </>
        )}

        <div className="border border-gray-400 p-4 rounded-lg flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            <div className="font-semibold text-xl">
              {i18n.t('Invoicing address')}
            </div>
            <AddressesList
              isFromQuotation={fromQuotation}
              currentAddress={selectedAddresses.invoicing}
              addresses={invoicingAddresses}
              type={ADDRESS_TYPE.invoicing}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onSelect={isSubAppActive ? handleAddressSelection : undefined}
              onDelete={handleDelete}
              onDefault={handleDefault}
            />
          </div>

          <Separator className="my-2" />

          <div className="flex flex-col gap-4">
            <div className="font-semibold text-xl">
              {i18n.t('Delivery address')}
            </div>
            <AddressesList
              isFromQuotation={fromQuotation}
              currentAddress={selectedAddresses.delivery}
              addresses={deliveryAddresses}
              type={ADDRESS_TYPE.delivery}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onSelect={isSubAppActive ? handleAddressSelection : undefined}
              onDelete={handleDelete}
              onDefault={handleDefault}
            />
          </div>
        </div>
      </div>
      {isSubAppActive && (
        <Button
          variant="success"
          className="w-full py-1.5"
          onClick={handleConfirm}
          disabled={isPending}>
          {isPending ? i18n.t('Processing...') : i18n.t('Confirm address')}
        </Button>
      )}
    </>
  );
}

export default Content;
