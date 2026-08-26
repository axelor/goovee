'use client';

import {useMemo} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {MdClose, MdOutlineLocationOn} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import type {PartnerAddress} from '@/types';
import {
  Button,
  Dialog,
  DialogContent,
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

/* Reported back on a create so the caller can act on the new address, which
 * of the two uses it was saved for included — that is decided in this form. */
export type SavedAddress = {
  id: string;
  isInvoicingAddr: boolean;
  isDeliveryAddr: boolean;
};

const CountrySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  version: z.number().nullish(),
});

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
  onSaved: (created: SavedAddress | null) => void;
  address?: PartnerAddress | null;
  countries?: Country[];
}) {
  const {toast} = useToast();
  const isEdit = Boolean(address);

  /* Built here rather than at module scope so the messages are translated with
   * the locale the viewer actually has. */
  const schema = useMemo(
    () =>
      z
        .object({
          label: z.string().trim().min(1, i18n.t('Address label is required')),
          firstName: z.string(),
          lastName: z.string(),
          streetName: z
            .string()
            .trim()
            .min(1, i18n.t('Street name is required')),
          addressAddition: z.string(),
          zip: z.string().trim().min(1, i18n.t('Zip code is required')),
          townName: z.string().trim().min(1, i18n.t('Town name is required')),
          /* superRefine rather than refine: refine would narrow the parsed type
           * to a non-null country, leaving the form's input and output types
           * disagreeing about the empty state the field starts in. */
          country: CountrySchema.nullable().superRefine((value, ctx) => {
            if (value) return;
            ctx.addIssue({
              code: 'custom',
              message: i18n.t('Country is required'),
            });
          }),
          contact: z.string(),
          invoicing: z.boolean(),
          shipping: z.boolean(),
        })
        /* An address must be usable for at least one purpose, otherwise it is
         * filtered out of every list and picker and cannot be reached again. */
        .refine(values => values.invoicing || values.shipping, {
          message: i18n.t('An address must be used for invoicing or delivery.'),
          path: ['invoicing'],
        }),
    [],
  );

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      /* The label lives in `subDepartment`; legacy rows kept it in addressl2
       * too, so read either. */
      label:
        address?.address?.addressl2 || address?.address?.subDepartment || '',
      /* First and last name are captured so editing a legacy address does not
       * drop the stored name. */
      firstName: address?.address?.firstName ?? '',
      lastName: address?.address?.lastName ?? '',
      streetName:
        address?.address?.streetName ?? address?.address?.addressl4 ?? '',
      /* Address precisions / addition — the AFNOR L3 line the redesign dropped. */
      addressAddition: address?.address?.addressl3 ?? '',
      zip: address?.address?.zip ?? '',
      townName: address?.address?.townName ?? address?.address?.addressl6 ?? '',
      country: address?.address?.country
        ? {
            id: String(address.address.country.id),
            name: address.address.country.name ?? '',
            version: address.address.country.version,
          }
        : null,
      contact: address?.address?.companyName ?? '',
      /* A new address is pre-checked for the section it was opened from. */
      invoicing: isEdit
        ? Boolean(address?.isInvoicingAddr)
        : kind === 'invoicing',
      shipping: isEdit ? Boolean(address?.isDeliveryAddr) : kind === 'shipping',
    },
  });

  const {errors, isSubmitting} = form.formState;
  const country = form.watch('country');
  const invoicing = form.watch('invoicing');
  const shipping = form.watch('shipping');

  const handleSave = async (values: FormValues) => {
    if (!values.country) return;

    const streetName = values.streetName;
    const zip = values.zip;
    const townName = values.townName;
    const addressAddition = values.addressAddition;

    /* AOS lays a postal address out as AFNOR lines L2..L6 and builds fullName by
     * joining them with single spaces, uppercased (AddressServiceImpl.
     * computeFullName). We write straight through the ORM, bypassing the AOS
     * Java save that would regenerate these — so replicate it here, or the stored
     * fullName drifts from what AOS produces. L6 is the "zip city" line. */
    const addressL6 = [zip, townName].filter(Boolean).join(' ');
    const lines = [
      '', // L2 — recipient; left empty (the Goovee label lives in subDepartment)
      addressAddition, // L3 — address precisions / addition
      streetName, // L4 — number and street
      '', // L5 — distribution precisions (unused)
      addressL6, // L6 — zip and city
    ];
    const computeFullName = () => lines.filter(Boolean).join(' ').toUpperCase();
    const formattedFullName = () =>
      [...lines, values.country?.name].filter(Boolean).join('\n').toUpperCase();

    const addressBody = {
      id: address?.address?.id != null ? String(address.address.id) : undefined,
      version: address?.address?.version,
      country: {
        id: String(values.country.id),
        name: values.country.name,
        version: values.country.version ?? 0,
      },
      /* AFNOR lines feeding fullName. addressl2 is cleared so a legacy label
       * stored there no longer leaks into fullName; the label lives in
       * `subDepartment`, where the address book reads it from. */
      addressl2: '',
      addressl3: addressAddition,
      addressl4: streetName,
      addressl6: addressL6,
      zip,
      townName,
      streetName,
      /* null, not undefined: the ORM saves a partial entity, so an undefined
       * field is left untouched and clearing one would keep the stored value. */
      companyName: values.contact || null,
      firstName: values.firstName || null,
      lastName: values.lastName || null,
      subDepartment: values.label,
      fullName: computeFullName(),
      formattedFullName: formattedFullName(),
    };

    try {
      const result =
        isEdit && address
          ? await updateAddress({
              address: {
                ...addressBody,
                id: String(address.address?.id ?? ''),
                version: address.address?.version ?? 0,
              },
              id: String(address.id),
              version: address.version ?? 0,
              isInvoicingAddr: values.invoicing,
              isDeliveryAddr: values.shipping,
              isDefaultAddr: Boolean(address.isDefaultAddr),
            })
          : await createAddress({
              address: addressBody,
              isInvoicingAddr: values.invoicing,
              isDeliveryAddr: values.shipping,
              isDefaultAddr: false,
            });

      if (result?.error) {
        toast({variant: 'destructive', description: result.message});
        return;
      }

      toast({
        variant: 'success',
        title: i18n.t('Address information saved successfully!'),
      });
      /* Only a create is reported back: on an edit the caller already holds the
       * record, and re-claiming it would move a selection the user did not
       * touch. */
      const created =
        !isEdit && 'data' in result && result.data
          ? {
              id: String(result.data.id),
              isInvoicingAddr: values.invoicing,
              isDeliveryAddr: values.shipping,
            }
          : null;
      onSaved(created);
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: i18n.t('Something went wrong while saving the address'),
      });
    }
  };

  const countryOptions = useMemo(() => countries ?? [], [countries]);

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent
        className="max-w-[520px] p-0 gap-0 overflow-hidden"
        hideClose>
        {/* Header — royal gradient + dots pattern (matches the forum modal) */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-royal-dark to-royal px-6 py-[22px] text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={i18n.t('Close')}
            className="absolute right-4 top-4 z-10 grid size-8 place-items-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25">
            <MdClose className="size-4" />
          </button>
          <div className="relative flex items-center gap-3.5">
            <div className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-white/[0.18]">
              <MdOutlineLocationOn className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-[19px] font-extrabold tracking-[-0.015em] text-white">
                {isEdit ? i18n.t('Edit address') : i18n.t('New address')}
              </DialogTitle>
              <p className="mt-0.5 text-[13px] text-white/85">
                {i18n.t('Invoicing and delivery details')}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(handleSave)} noValidate>
          <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            <Field
              label={i18n.t('Address label')}
              error={errors.label?.message}>
              <Input
                {...form.register('label')}
                placeholder={i18n.t('E.g. Head office — Nice')}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={i18n.t('First name')}>
                <Input {...form.register('firstName')} />
              </Field>
              <Field label={i18n.t('Last name')}>
                <Input {...form.register('lastName')} />
              </Field>
            </div>
            <Field label={i18n.t('Address')} error={errors.streetName?.message}>
              <Input
                {...form.register('streetName')}
                placeholder={i18n.t('Street name and number')}
              />
            </Field>
            <Field label={i18n.t('Address addition')}>
              <Input
                {...form.register('addressAddition')}
                placeholder={i18n.t('Building, floor, unit… (optional)')}
              />
            </Field>
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <Field label={i18n.t('Zip code')} error={errors.zip?.message}>
                <Input {...form.register('zip')} />
              </Field>
              <Field
                label={i18n.t('Town name')}
                error={errors.townName?.message}>
                <Input {...form.register('townName')} />
              </Field>
            </div>
            <div className="flex flex-col gap-1.5">
              <DropdownSelector
                options={countryOptions}
                selectedValue={country?.id}
                label={i18n.t('Country')}
                placeholder={i18n.t('Select a country')}
                labelClassName="mb-0"
                rootClassName="space-y-2"
                hasError={Boolean(errors.country)}
                onValueChange={(option: Country) =>
                  form.setValue('country', option, {shouldValidate: true})
                }
              />
              <FieldError message={errors.country?.message} />
            </div>
            <Field label={i18n.t('Contact')}>
              <Input
                {...form.register('contact')}
                placeholder={i18n.t('Contact name')}
              />
            </Field>

            <div className="border-t border-ink-100 pt-4 flex flex-col gap-3">
              <ToggleRow
                label={i18n.t('Use for invoicing')}
                checked={invoicing}
                onChange={value =>
                  form.setValue('invoicing', value, {shouldValidate: true})
                }
              />
              <ToggleRow
                label={i18n.t('Use for delivery')}
                checked={shipping}
                onChange={value =>
                  form.setValue('shipping', value, {shouldValidate: true})
                }
              />
              {!invoicing && !shipping && (
                <FieldError
                  message={i18n.t(
                    'An address must be used for invoicing or delivery.',
                  )}
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-ink-100">
            <Button
              type="button"
              variant="royal-outline"
              onClick={onClose}
              disabled={isSubmitting}>
              {i18n.t('Cancel')}
            </Button>
            {/* Not gated on validity: pressing Save is how the form reports
                which fields still need filling. */}
            <Button type="submit" variant="royal" disabled={isSubmitting}>
              {i18n.t('Save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-semibold text-ink-800 mb-0">
        {label}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FieldError({message}: {message?: string}) {
  if (!message) return null;

  return (
    <p className="text-[12.5px] text-status-rejected-fg mb-0">{message}</p>
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
