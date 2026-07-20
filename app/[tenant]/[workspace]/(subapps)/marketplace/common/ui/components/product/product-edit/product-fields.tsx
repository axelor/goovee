import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {RichTextEditor} from '@/ui/components';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import type {Currency} from '@/product/orm';
import {cn} from '@/utils/css';
import {useFormContext} from 'react-hook-form';
import {COVER_STYLES, GRADIENT_MAP} from '../../../../constants/gradients';
import {MARKETPLACE_ICONS} from '../../../../constants/icons';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  ListCategory,
  ListLicense,
  MyProductForEdit,
} from '../../../../orm';
import {FormMessageSpace} from '../../shared/form-message-space';
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '../../shared/multi-select';
import {ProductIcon} from '../../shared/product-icon';
import {ScreenshotsFormField} from '../product-form/screenshots-form-field';
import type {CombinedEditValues} from './combined-validator';

type ProductFieldsProps = {
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  initial?: Cloned<MyProductForEdit>;
  listingCurrency: Cloned<Currency> | null;
  /** Tax basis of the existing listing (its own `inAti`), or the workspace
   *  default product's (`PortalAppConfig.defaultProductForMarketplace.inAti`)
   *  for create. Decides whether the price the supplier enters is interpreted
   *  as gross (tax-inclusive) or net (tax-exclusive), and drives the input
   *  label wording. */
  inAti: boolean;
  /** Render just the fields, without the card surface + heading. The dialog
   *  wraps them in a collapsible; the page shows the full card (default). */
  bare?: boolean;
};

/**
 * Product fields for the combined editor — bound to the form's root product
 * values via `useFormContext`. Shared by the full-page editor (always-open
 * card) and the dialog (wrapped in a collapsible). The Type select is always
 * disabled: it's fixed at create (preselected) and immutable on edit.
 */
export function ProductFields({
  categories,
  licenses,
  initial,
  listingCurrency,
  inAti,
  bare = false,
}: ProductFieldsProps) {
  const {control} = useFormContext<CombinedEditValues>();
  const currencySymbol = listingCurrency?.symbol ?? null;

  const body = (
    <>
      <div className="flex flex-wrap gap-4">
        <FormField
          control={control}
          name="marketplaceTypeSelect"
          render={({field}) => (
            <FormItem className="min-w-[200px] flex-1 sm:flex-none">
              <FormLabel>{i18n.t('Type')} *</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled>
                  <SelectTrigger className="w-full sm:w-[260px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MARKETPLACE_TYPE.SKILL}>
                      {i18n.t('Skill')}
                    </SelectItem>
                    <SelectItem value={MARKETPLACE_TYPE.APP}>
                      {i18n.t('App')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="salePrice"
          render={({field}) => (
            <FormItem className="min-w-[200px] flex-1 sm:flex-none">
              <FormLabel>
                {inAti
                  ? i18n.t('Price (incl. tax)')
                  : i18n.t('Price (excl. tax)')}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  {currencySymbol && (
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                      {currencySymbol}
                    </span>
                  )}
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0"
                    className={cn('sm:w-[200px]', currencySymbol && 'pl-8')}
                    value={field.value ?? ''}
                    onChange={e =>
                      field.onChange(
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </div>
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
        <FormField
          control={control}
          name="name"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Name')} *</FormLabel>
              <FormControl>
                <Input
                  placeholder={i18n.t('e.g. BPM Workflow Generator')}
                  {...field}
                />
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="licenseId"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('License')} *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={i18n.t('Select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map(license => (
                      <SelectItem key={license.id} value={license.id}>
                        {license.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="categoryIds"
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Categories')} *</FormLabel>
            <FormControl>
              <MultiSelector
                onValuesChange={field.onChange}
                values={field.value ?? []}
                className="space-y-0">
                <MultiSelectorTrigger
                  renderLabel={value =>
                    categories.find(category => category.id === value)?.name
                  }>
                  <MultiSelectorInput
                    placeholder={i18n.t('Select categories')}
                  />
                </MultiSelectorTrigger>
                <MultiSelectorContent>
                  <MultiSelectorList>
                    {categories.map(category => (
                      <MultiSelectorItem key={category.id} value={category.id}>
                        {category.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorList>
                </MultiSelectorContent>
              </MultiSelector>
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Short description')} *</FormLabel>
            <FormControl>
              <Input
                placeholder={i18n.t('One-line summary, ~140 characters')}
                {...field}
              />
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="longDescription"
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Long description')}</FormLabel>
            <FormControl>
              <RichTextEditor
                content={initial?.longDescription ?? ''}
                onChange={field.onChange}
                classNames={{
                  wrapperClassName: 'overflow-visible',
                  toolbarClassName: 'mt-0',
                  editorClassName: 'px-4',
                }}
              />
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="coverStyle"
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Cover style')} *</FormLabel>
            <FormControl>
              <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                {COVER_STYLES.map(code => {
                  const selected = field.value === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => field.onChange(code)}
                      className={cn(
                        'aspect-square rounded-lg bg-gradient-to-br transition-all',
                        GRADIENT_MAP[code],
                        selected
                          ? 'ring-2 ring-primary ring-offset-2'
                          : 'hover:ring-2 hover:ring-foreground/20',
                      )}
                      aria-label={code}
                    />
                  );
                })}
              </div>
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="iconCode"
        render={({field}) => (
          <FormItem>
            <FormLabel>{i18n.t('Icon')} *</FormLabel>
            <FormControl>
              <div className="flex flex-wrap gap-2">
                {MARKETPLACE_ICONS.map(({code, label}) => {
                  const selected = field.value === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => field.onChange(code)}
                      title={i18n.t(label)}
                      aria-label={i18n.t(label)}
                      aria-pressed={selected}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg border transition-all',
                        selected
                          ? 'border-palette-indigo bg-palette-indigo/10 text-palette-indigo ring-1 ring-palette-indigo'
                          : 'border-border bg-background text-foreground hover:ring-1 hover:ring-foreground/20',
                      )}>
                      <ProductIcon
                        code={code}
                        className={cn(
                          'h-5 w-5',
                          selected && 'text-palette-indigo',
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </FormControl>
            <FormMessageSpace />
          </FormItem>
        )}
      />

      <ScreenshotsFormField initial={initial} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField
          control={control}
          name="documentationUrl"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Documentation URL')}</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://" {...field} />
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="supportIssuesUrl"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Issues URL')}</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://" {...field} />
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="supportContactUrl"
          render={({field}) => (
            <FormItem>
              <FormLabel>{i18n.t('Contact URL')}</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://" {...field} />
              </FormControl>
              <FormMessageSpace />
            </FormItem>
          )}
        />
      </div>
    </>
  );

  if (bare) return <div className="space-y-8">{body}</div>;

  return (
    <div className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">
        {i18n.t('Product details')}
      </h3>
      {body}
    </div>
  );
}
