'use client';

import {useMemo, useState} from 'react';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DropdownSelector,
  Input,
  Label,
} from '@/ui/components';
import {useToast} from '@/ui/hooks';
import {AccountToggle} from '@/app/[tenant]/[workspace]/account/common/ui/components';

// ---- LOCAL IMPORTS ---- //
import {
  createAddress,
  updateAddress,
} from '@/app/[tenant]/[workspace]/account/addresses/common/actions/action';

type Country = {id: string; name: string; version?: number};
type Kind = 'invoicing' | 'shipping';

export function AddressEditModal({
  open,
  kind,
  onClose,
  onSaved,
  address,
  countries = [],
}: {
  open: boolean;
  kind: Kind;
  onClose: () => void;
  onSaved: () => void;
  address?: any | null;
  countries?: Country[];
}) {
  const {toast} = useToast();
  const isEdit = Boolean(address);

  const [label, setLabel] = useState<string>(address?.address?.addressl2 ?? '');
  const [streetName, setStreetName] = useState<string>(
    address?.address?.streetName ?? address?.address?.addressl4 ?? '',
  );
  const [zip, setZip] = useState<string>(address?.address?.zip ?? '');
  const [townName, setTownName] = useState<string>(
    address?.address?.townName ?? address?.address?.addressl6 ?? '',
  );
  const [country, setCountry] = useState<Country | null>(
    address?.address?.country ?? null,
  );
  const [contact, setContact] = useState<string>(
    address?.address?.companyName ?? '',
  );
  // Usage flags (which section the address belongs to). Pre-checked by the
  // section the modal was opened from for a new address.
  const [invoicing, setInvoicing] = useState<boolean>(
    isEdit ? Boolean(address?.isInvoicingAddr) : kind === 'invoicing',
  );
  const [shipping, setShipping] = useState<boolean>(
    isEdit ? Boolean(address?.isDeliveryAddr) : kind === 'shipping',
  );
  const [submitting, setSubmitting] = useState(false);

  const valid = Boolean(label && streetName && zip && townName && country?.id);

  const computeFullName = () =>
    [streetName, zip, townName].filter(Boolean).join(' ').toUpperCase();
  const formattedFullName = () =>
    [streetName, zip, townName, country?.name]
      .filter(Boolean)
      .join('\n')
      .toUpperCase();

  const handleSave = async () => {
    if (!valid || !country) return;
    setSubmitting(true);

    const addressBody: any = {
      id: address?.address?.id,
      version: address?.address?.version,
      country: {
        id: country.id,
        name: country.name,
        version: country.version ?? 0,
      },
      addressl2: label,
      addressl4: streetName,
      addressl6: townName,
      zip,
      townName,
      streetName,
      companyName: contact || undefined,
      department: label,
      fullName: computeFullName(),
      formattedFullName: formattedFullName(),
    };

    try {
      const result = isEdit
        ? await updateAddress({
            address: addressBody,
            id: address.id,
            version: address.version,
            isInvoicingAddr: invoicing,
            isDeliveryAddr: shipping,
            isDefaultAddr: Boolean(address.isDefaultAddr),
          })
        : await createAddress({
            address: addressBody,
            isInvoicingAddr: invoicing,
            isDeliveryAddr: shipping,
            isDefaultAddr: false,
          });

      if (result?.error) {
        toast({variant: 'destructive', description: result.message});
        setSubmitting(false);
        return;
      }

      toast({
        variant: 'success',
        title: i18n.t('Address information saved successfully!'),
      });
      onSaved();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: i18n.t('Something went wrong while saving the address'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const countryOptions = useMemo(() => countries ?? [], [countries]);

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-ink-100">
          <DialogTitle className="text-[17px] font-bold text-ink-900">
            {isEdit ? i18n.t('Edit address') : i18n.t('New address')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          <Field label={i18n.t('Address label')}>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={i18n.t('E.g. Head office — Nice')}
            />
          </Field>
          <Field label={i18n.t('Address')}>
            <Input
              value={streetName}
              onChange={e => setStreetName(e.target.value)}
              placeholder={i18n.t('Street name and number')}
            />
          </Field>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <Field label={i18n.t('Zip code')}>
              <Input value={zip} onChange={e => setZip(e.target.value)} />
            </Field>
            <Field label={i18n.t('Town name')}>
              <Input
                value={townName}
                onChange={e => setTownName(e.target.value)}
              />
            </Field>
          </div>
          <DropdownSelector
            options={countryOptions}
            selectedValue={country?.id}
            label={i18n.t('Country')}
            placeholder={i18n.t('Select a country')}
            labelClassName="mb-0"
            rootClassName="space-y-2"
            onValueChange={(option: any) => setCountry(option)}
          />
          <Field label={i18n.t('Contact')}>
            <Input
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder={i18n.t('Contact name')}
            />
          </Field>

          <div className="border-t border-ink-100 pt-4 flex flex-col gap-3">
            <ToggleRow
              label={i18n.t('Use for invoicing')}
              checked={invoicing}
              onChange={setInvoicing}
            />
            <ToggleRow
              label={i18n.t('Use for delivery')}
              checked={shipping}
              onChange={setShipping}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-ink-100">
          <Button
            variant="royal-outline"
            onClick={onClose}
            disabled={submitting}>
            {i18n.t('Cancel')}
          </Button>
          <Button
            variant="royal"
            onClick={handleSave}
            disabled={!valid || submitting}>
            {i18n.t('Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-ink-800 mb-0">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-ink-800">{label}</span>
      <AccountToggle
        checked={checked}
        onCheckedChange={onChange}
        aria-label={label}
      />
    </div>
  );
}

export default AddressEditModal;
