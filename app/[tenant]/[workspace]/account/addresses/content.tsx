'use client';

import {useRouter} from 'next/navigation';
import {useEffect, useState, useTransition} from 'react';

import {IconType} from 'react-icons';
import {MdAdd, MdCheck, MdLocalShipping, MdReceiptLong} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components';
import {i18n} from '@/locale';
import {ADDRESS_TYPE, SUBAPP_CODES, SUBAPP_PAGE} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useToast} from '@/ui/hooks';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {cn} from '@/utils/css';

// ---- LOCAL IMPORTS ---- //
import {AddressEditModal} from '@/app/[tenant]/[workspace]/account/addresses/common/ui/components';
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
  countries?: any[];
  fromQuotation?: boolean;
  fromCheckout?: boolean;
  callbackURL?: string;
}

function Content({
  quotation,
  invoicingAddresses,
  deliveryAddresses,
  countries = [],
  fromQuotation,
  fromCheckout,
  callbackURL,
}: ContentProps) {
  const [initiating, setInitiating] = useState(true);
  const [selectedAddresses, setSelectedAddresses] = useState({
    invoicing: null,
    delivery: null,
  });
  const [addressModal, setAddressModal] = useState<{
    kind: 'invoicing' | 'shipping';
    address?: any;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const {workspaceURI, workspaceURL} = useWorkspace();
  const router = useRouter();
  const {toast} = useToast();
  const {cart, updateAddress} = useCart();

  const isSubAppActive = fromQuotation || fromCheckout;

  const handleCreate = (type: ADDRESS_TYPE) => {
    setAddressModal({
      kind: type === ADDRESS_TYPE.invoicing ? 'invoicing' : 'shipping',
    });
  };

  const handleEdit = (type: ADDRESS_TYPE, record: any) => {
    setAddressModal({
      kind: type === ADDRESS_TYPE.invoicing ? 'invoicing' : 'shipping',
      address: record,
    });
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
    <div className="flex flex-col gap-4">
      {isSubAppActive && (
        <h4 className="text-lg font-bold text-ink-900 mb-0">
          {i18n.t('Choose your address')}
        </h4>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SelectableAddressSection
          icon={MdReceiptLong}
          title={i18n.t('Invoicing address')}
          type={ADDRESS_TYPE.invoicing}
          addresses={invoicingAddresses}
          currentAddress={selectedAddresses.invoicing}
          isFromQuotation={fromQuotation}
          selectable={isSubAppActive}
          onSelect={handleAddressSelection}
          onEdit={handleEdit}
          onDelete={setPendingDelete}
          onDefault={handleDefault}
          onAdd={handleCreate}
        />
        <SelectableAddressSection
          icon={MdLocalShipping}
          title={i18n.t('Delivery address')}
          type={ADDRESS_TYPE.delivery}
          addresses={deliveryAddresses}
          currentAddress={selectedAddresses.delivery}
          isFromQuotation={fromQuotation}
          selectable={isSubAppActive}
          onSelect={handleAddressSelection}
          onEdit={handleEdit}
          onDelete={setPendingDelete}
          onDefault={handleDefault}
          onAdd={handleCreate}
        />
      </div>

      {isSubAppActive && (
        <Button
          variant="royal"
          className="w-full py-1.5"
          onClick={handleConfirm}
          disabled={isPending}>
          {isPending ? i18n.t('Processing...') : i18n.t('Confirm address')}
        </Button>
      )}

      {addressModal && (
        <AddressEditModal
          open
          kind={addressModal.kind}
          address={addressModal.address ?? null}
          countries={countries}
          onClose={() => setAddressModal(null)}
          onSaved={() => {
            setAddressModal(null);
            router.refresh();
          }}
        />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={value => !value && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {i18n.t('Delete this address?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {i18n.t('This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{i18n.t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete);
                setPendingDelete(null);
              }}>
              {i18n.t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getLabel(address: any): string {
  return (
    address?.addressl2 ||
    address?.department ||
    address?.companyName ||
    [address?.firstName, address?.lastName].filter(Boolean).join(' ') ||
    i18n.t('Address')
  );
}

function getContact(address: any, label: string): string {
  const contact =
    address?.companyName ||
    [address?.firstName, address?.lastName].filter(Boolean).join(' ') ||
    '';
  return contact && contact !== label ? contact : '';
}

function formatAddressLine(address: any): string {
  if (!address) return '';
  const street = address.streetName || address.addressl4 || '';
  const town = address.townName || address.addressl6 || '';
  return [
    street,
    [address.zip, town].filter(Boolean).join(' '),
    address.country?.name,
  ]
    .filter(Boolean)
    .join(', ');
}

function SelectableAddressSection({
  icon: Icon,
  title,
  type,
  addresses,
  currentAddress,
  isFromQuotation,
  selectable,
  onSelect,
  onEdit,
  onDelete,
  onDefault,
  onAdd,
}: {
  icon: IconType;
  title: string;
  type: ADDRESS_TYPE;
  addresses: {id: string; isDefaultAddr?: boolean; address: any}[];
  currentAddress?: {id?: string} | null;
  isFromQuotation?: boolean;
  selectable?: boolean;
  onSelect: (type: ADDRESS_TYPE, partnerAddress: any) => void;
  onEdit: (type: ADDRESS_TYPE, record: any) => void;
  onDelete: (id: string) => void;
  onDefault: (type: ADDRESS_TYPE, id: string, isDefault: boolean) => void;
  onAdd: (type: ADDRESS_TYPE) => void;
}) {
  const isInvoicing = type === ADDRESS_TYPE.invoicing;

  return (
    <div className="bg-white border border-ink-100 rounded-xl shadow-xs p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-8 h-8 rounded-lg bg-royal-pale text-royal grid place-items-center">
          <Icon className="size-4" />
        </span>
        <h3 className="text-base font-bold text-ink-900 mb-0">{title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {(addresses ?? []).map(record => {
          const {id, address, isDefaultAddr} = record;
          const selected = isFromQuotation
            ? currentAddress?.id === address?.id
            : currentAddress?.id === id;
          const isDefault = Boolean(isDefaultAddr);
          const label = getLabel(address);
          const contact = getContact(address, label);

          return (
            <div
              key={String(id ?? address?.id)}
              role={selectable ? 'button' : undefined}
              tabIndex={selectable ? 0 : undefined}
              onClick={
                selectable ? () => onSelect(type, {id, address}) : undefined
              }
              onKeyDown={
                selectable
                  ? e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(type, {id, address});
                      }
                    }
                  : undefined
              }
              className={cn(
                'relative flex flex-col rounded-[14px] p-[18px] transition-all',
                selectable && 'cursor-pointer',
                selected
                  ? 'border-[1.5px] border-royal shadow-[0_0_0_3px_rgba(21,84,181,0.08)]'
                  : 'border border-ink-100 hover:border-ink-200',
              )}>
              <div className="flex items-start justify-between gap-2.5 mb-2">
                <span className="text-[14.5px] font-bold text-ink-900">
                  {label}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isDefault && (
                    <Tag mint={isInvoicing} label={i18n.t('Default')} />
                  )}
                  {selected && (
                    <span className="w-5 h-5 rounded-full bg-royal text-white grid place-items-center">
                      <MdCheck className="size-3" />
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[13px] text-ink-700 leading-relaxed">
                {formatAddressLine(address)}
              </div>
              {contact && (
                <div className="text-xs text-ink-500 mt-1.5">{contact}</div>
              )}

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ink-100">
                {!isDefault && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onDefault(type, String(id), true);
                    }}
                    className="text-[12.5px] font-bold text-royal">
                    {i18n.t('Set as default')}
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onEdit(type, record);
                  }}
                  className="text-[12.5px] font-semibold text-ink-600 hover:text-ink-900">
                  {i18n.t('Edit')}
                </button>
                <button
                  type="button"
                  disabled={isDefault}
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(String(id));
                  }}
                  title={
                    isDefault
                      ? i18n.t('Default address — reassign before deleting')
                      : i18n.t('Delete')
                  }
                  className={cn(
                    'text-[12.5px] font-semibold',
                    isDefault
                      ? 'text-ink-300 cursor-not-allowed'
                      : 'text-destructive',
                  )}>
                  {i18n.t('Delete')}
                </button>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => onAdd(type)}
          className="flex flex-col items-center justify-center gap-2 min-h-[110px] rounded-[14px] border border-dashed border-ink-200 p-[18px] text-[13px] font-semibold text-ink-500 transition-colors hover:border-royal hover:bg-ink-25">
          <span className="w-9 h-9 rounded-full bg-royal-pale text-royal grid place-items-center">
            <MdAdd className="size-4" />
          </span>
          {isInvoicing
            ? i18n.t('New invoicing address')
            : i18n.t('New delivery address')}
        </button>
      </div>
    </div>
  );
}

function Tag({label, mint}: {label: string; mint?: boolean}) {
  return (
    <span
      className={cn(
        'shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full',
        mint ? 'bg-mint-50 text-mint-700' : 'bg-royal-pale text-royal-dark',
      )}>
      {label}
    </span>
  );
}

export default Content;
