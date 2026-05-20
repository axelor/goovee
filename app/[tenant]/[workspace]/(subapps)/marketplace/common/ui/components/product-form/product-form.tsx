import {useState, useTransition} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {RichTextEditor} from '@/ui/components';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import type {Cloned} from '@/types/util';
import {MARKETPLACE_TYPE} from '../../../constants/marketplace-types';
import {GRADIENT_MAP} from '../../../constants/gradients';
import {ProductIcon} from '../product-icon';
import {saveProduct} from '../../../actions/actions';
import {isPaid} from '../../../utils/price';
import {productSchema, type ProductFormValues} from './schema';
import type {ListCategory, MyProductWithVersions} from '../../../orm/orm';

const ICON_CODES = Array.from({length: 12}, (_, i) => `icon-${i + 1}`);
const COVER_CODES = Object.keys(GRADIENT_MAP);

type ProductFormProps = {
  mode: 'create' | 'edit';
  workspaceURL: string;
  categories: Cloned<ListCategory>[];
  initial?: Cloned<MyProductWithVersions>;
  defaultType?: MARKETPLACE_TYPE;
  /** Currency symbol from workspace config (e.g. "$", "€"). Optional —
   *  if absent we render the input without an adornment. */
  currencySymbol?: string | null;
  onSaved: (productId: string) => void;
  onContinue: () => void;
  onCancel: () => void;
};

export function ProductForm({
  mode,
  workspaceURL,
  categories,
  initial,
  defaultType,
  currencySymbol,
  onSaved,
  onContinue,
  onCancel,
}: ProductFormProps) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();
  /* UI-only Free/Paid toggle. Not part of the form values — derived from
   * salePrice when initializing, drives whether the price input is shown.
   * Switching to "free" clears the salePrice so a hidden non-zero value
   * can never sneak through. */
  const [pricingMode, setPricingMode] = useState<'free' | 'paid'>(
    isPaid(initial?.salePrice) ? 'paid' : 'free',
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: buildDefaults(initial, defaultType),
    mode: 'onSubmit',
  });

  const {control, handleSubmit, formState} = form;
  const productId = initial?.id;

  const submit = handleSubmit(values => {
    startTransition(async () => {
      const result = await saveProduct({...values, workspaceURL});
      if (!result.success) {
        toast({variant: 'destructive', title: result.message});
        return;
      }
      toast({variant: 'success', title: i18n.t('Saved')});
      form.reset(values);
      onSaved(result.data.productId);
      onContinue();
    });
  });

  const handleContinue = () => {
    if (!productId && !formState.isDirty) {
      // Nothing to continue with yet — must save first.
      submit();
      return;
    }
    if (formState.isDirty) {
      submit();
    } else {
      onContinue();
    }
  };

  return (
    <Form {...form}>
      <div className="bg-muted/30 p-6" data-vaul-no-drag>
        <div className="space-y-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            {i18n.t('Product details')}
          </h3>

          <FormField
            control={control}
            name="marketplaceTypeSelect"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Type')} *</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={mode === 'edit'}>
                    <SelectTrigger className="w-full md:w-[260px]">
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
                <FormMessage />
              </FormItem>
            )}
          />

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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="productCategoryId"
              render={({field}) => (
                <FormItem>
                  <FormLabel>{i18n.t('Category')} *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={i18n.t('Select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                <FormMessage />
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
                    content={field.value}
                    onChange={field.onChange}
                    classNames={{
                      wrapperClassName: 'overflow-visible',
                      toolbarClassName: 'mt-0',
                      editorClassName: 'px-4',
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="marketplaceCoverStyle"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Cover style')} *</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                    {COVER_CODES.map(code => {
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="marketplaceIconCode"
            render={({field}) => (
              <FormItem>
                <FormLabel>{i18n.t('Icon')} *</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {ICON_CODES.map(code => {
                      const selected = field.value === code;
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => field.onChange(code)}
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
                <FormMessage />
              </FormItem>
            )}
          />

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
                  <FormMessage />
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
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_280px] md:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">{i18n.t('Pricing')}</label>
              <Select
                value={pricingMode}
                onValueChange={value => {
                  const next = value as 'free' | 'paid';
                  setPricingMode(next);
                  if (next === 'free') {
                    form.setValue('salePrice', undefined, {shouldDirty: true});
                  }
                }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">{i18n.t('Free')}</SelectItem>
                  <SelectItem value="paid">{i18n.t('Paid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pricingMode === 'paid' && (
              <FormField
                control={control}
                name="salePrice"
                render={({field}) => (
                  <FormItem>
                    <FormLabel>{i18n.t('Price')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0"
                          className={currencySymbol ? 'pr-12' : undefined}
                          value={field.value ?? ''}
                          onChange={e =>
                            field.onChange(
                              e.target.value === ''
                                ? undefined
                                : Number(e.target.value),
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                        {currencySymbol && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
                            {currencySymbol}
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      {i18n.t('Price excludes tax.')}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border bg-background px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={pending}>
          {i18n.t('Cancel')}
        </Button>
        <Button type="button" disabled={pending} onClick={handleContinue}>
          {formState.isDirty || !productId
            ? i18n.t('Save & continue')
            : i18n.t('Continue')}
        </Button>
      </div>
    </Form>
  );
}

function buildDefaults(
  initial: Cloned<MyProductWithVersions> | undefined,
  defaultType: MARKETPLACE_TYPE | undefined,
): ProductFormValues {
  if (!initial) {
    return {
      marketplaceTypeSelect: defaultType ?? MARKETPLACE_TYPE.SKILL,
      name: '',
      description: '',
      longDescription: '',
      productCategoryId: '',
      marketplaceCoverStyle: 'gradient-1',
      marketplaceIconCode: 'icon-1',
      documentationUrl: '',
      supportIssuesUrl: '',
      supportContactUrl: '',
      salePrice: undefined,
    };
  }
  return {
    id: initial.id,
    marketplaceTypeSelect:
      (initial.marketplaceTypeSelect as MARKETPLACE_TYPE) ??
      MARKETPLACE_TYPE.SKILL,
    name: initial.name ?? '',
    description: initial.description ?? '',
    longDescription: initial.longDescription ?? '',
    productCategoryId: initial.productCategory?.id ?? '',
    marketplaceCoverStyle: initial.marketplaceCoverStyle ?? 'gradient-1',
    marketplaceIconCode: initial.marketplaceIconCode ?? 'icon-1',
    documentationUrl: initial.documentationUrl ?? '',
    supportIssuesUrl: initial.supportIssuesUrl ?? '',
    supportContactUrl: initial.supportContactUrl ?? '',
    salePrice:
      initial.salePrice != null ? Number(initial.salePrice) : undefined,
  };
}
