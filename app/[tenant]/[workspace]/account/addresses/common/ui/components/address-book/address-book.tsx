'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {MdAdd, MdCheck, MdReceiptLong, MdLocalShipping} from 'react-icons/md';
import {IconType} from 'react-icons';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {cn} from '@/utils/css';
import {useToast} from '@/ui/hooks';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/components';

// ---- LOCAL IMPORTS ---- //
import {SectionHeader} from '@/app/[tenant]/[workspace]/account/common/ui/components';
import {
  assignAddressDefault,
  deleteAddress,
} from '@/app/[tenant]/[workspace]/account/addresses/common/actions/action';
import {AddressEditModal} from '../address-edit-modal';

type Country = {id: string; name: string; version?: number};
type Kind = 'invoicing' | 'shipping';
type Editing = {mode: 'new' | 'edit'; kind: Kind; address?: any} | null;

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

function getLabel(a: any): string {
  return a?.address?.addressl2 || a?.address?.department || i18n.t('Address');
}

function getContact(a: any): string {
  const addr = a?.address;
  if (!addr) return '';
  return (
    addr.companyName ||
    [addr.firstName, addr.lastName].filter(Boolean).join(' ') ||
    ''
  );
}

export function AddressBook({
  addresses = [],
  countries = [],
}: {
  addresses: any[];
  countries: Country[];
}) {
  const router = useRouter();
  const {toast} = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const invoicingAddrs = addresses.filter(a => a.isInvoicingAddr);
  const shippingAddrs = addresses.filter(a => a.isDeliveryAddr);

  const handleSetDefault = async (id: string, kind: Kind) => {
    setBusyId(id);
    const result = await assignAddressDefault({
      id,
      kind: kind === 'invoicing' ? 'invoicing' : 'delivery',
    });
    setBusyId(null);
    if (result?.error) {
      toast({variant: 'destructive', description: result.message});
    } else {
      toast({variant: 'success', title: i18n.t('Default address updated')});
      router.refresh();
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    const result = await deleteAddress(id);
    setBusyId(null);
    if (result?.error) {
      toast({variant: 'destructive', description: result.message});
    } else {
      toast({
        variant: 'success',
        title: i18n.t('Address deleted successfully'),
      });
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <SectionHeader
        title={i18n.t('Addresses')}
        description={i18n.t('Manage your invoicing and delivery addresses.')}
      />

      <AddressSection
        kind="invoicing"
        icon={MdReceiptLong}
        title={i18n.t('Invoicing addresses')}
        addrs={invoicingAddrs}
        busyId={busyId}
        onAdd={() => setEditing({mode: 'new', kind: 'invoicing'})}
        onEdit={a => setEditing({mode: 'edit', kind: 'invoicing', address: a})}
        onSetDefault={id => handleSetDefault(id, 'invoicing')}
        onDelete={setPendingDelete}
      />

      <AddressSection
        kind="shipping"
        icon={MdLocalShipping}
        title={i18n.t('Delivery addresses')}
        addrs={shippingAddrs}
        busyId={busyId}
        onAdd={() => setEditing({mode: 'new', kind: 'shipping'})}
        onEdit={a => setEditing({mode: 'edit', kind: 'shipping', address: a})}
        onSetDefault={id => handleSetDefault(id, 'shipping')}
        onDelete={setPendingDelete}
      />

      {editing && (
        <AddressEditModal
          open
          kind={editing.kind}
          address={editing.mode === 'edit' ? editing.address : null}
          countries={countries}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
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

function AddressSection({
  kind,
  icon: Icon,
  title,
  addrs,
  busyId,
  onAdd,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  kind: Kind;
  icon: IconType;
  title: string;
  addrs: any[];
  busyId: string | null;
  onAdd: () => void;
  onEdit: (a: any) => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const otherUsageLabel =
    kind === 'invoicing' ? i18n.t('delivery') : i18n.t('invoicing');

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-lg bg-royal-pale text-royal grid place-items-center">
          <Icon className="size-4" />
        </span>
        <h3 className="text-base font-bold text-ink-900 mb-0">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {addrs.map(a => {
          const isDefault = Boolean(a.isDefaultAddr);
          const alsoOther =
            kind === 'invoicing'
              ? Boolean(a.isDeliveryAddr)
              : Boolean(a.isInvoicingAddr);
          const contact = getContact(a);
          const disabled = busyId === String(a.id);

          return (
            <div
              key={a.id}
              className={cn(
                'relative flex flex-col bg-white rounded-[14px] p-[18px]',
                isDefault
                  ? 'border-[1.5px] border-royal shadow-[0_0_0_3px_rgba(21,84,181,0.08)]'
                  : 'border border-ink-100 shadow-xs',
              )}>
              <div className="flex items-start justify-between gap-2.5 mb-2">
                <span className="text-[14.5px] font-bold text-ink-900">
                  {getLabel(a)}
                </span>
                {isDefault && (
                  <Tag mint={kind === 'invoicing'} label={i18n.t('Default')} />
                )}
              </div>

              <div className="text-[13px] text-ink-700 leading-relaxed">
                {formatAddressLine(a.address)}
              </div>
              {contact && (
                <div className="text-xs text-ink-500 mt-1.5">{contact}</div>
              )}

              {alsoOther && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-ink-400">
                  <MdCheck className="size-3" />
                  {i18n.t('Also used for {0}', otherUsageLabel)}
                </div>
              )}

              <div className="flex items-center gap-2.5 mt-auto pt-3 border-t border-ink-100">
                {!isDefault && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSetDefault(String(a.id))}
                    className="text-[12.5px] font-bold text-royal disabled:opacity-60">
                    {i18n.t('Set as default')}
                  </button>
                )}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="text-[12.5px] font-semibold text-ink-600 hover:text-ink-900">
                  {i18n.t('Edit')}
                </button>
                <button
                  type="button"
                  disabled={isDefault || disabled}
                  onClick={() => onDelete(String(a.id))}
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

        {/* Add card */}
        <button
          type="button"
          onClick={onAdd}
          className="flex flex-col items-center justify-center gap-2 min-h-[120px] rounded-[14px] border border-dashed border-ink-200 p-[18px] text-[13px] font-semibold text-ink-500 transition-colors hover:border-royal hover:bg-ink-25">
          <span className="w-9 h-9 rounded-full bg-royal-pale text-royal grid place-items-center text-lg">
            <MdAdd className="size-4" />
          </span>
          {kind === 'invoicing'
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

export default AddressBook;
