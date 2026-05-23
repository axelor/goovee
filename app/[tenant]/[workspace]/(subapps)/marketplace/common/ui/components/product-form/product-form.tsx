import {useMemo, useRef, useTransition} from 'react';
import Image from 'next/image';
import {useForm, useFormContext, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Plus, X} from 'lucide-react';
import {i18n} from '@/locale';
import {Button} from '@/ui/components/button';
import {Input} from '@/ui/components/input';
import {RichTextEditor} from '@/ui/components';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
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
import {packIntoFormData} from '@/utils/formdata';
import {saveProduct} from '../../../actions/actions';
import {
  productSchema,
  type ProductFormValues,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
} from './schema';
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
  currencySymbol: string | null;
  /** Workspace's `PortalAppConfig.marketplaceInAti`. Decides whether the
   *  price the supplier enters is interpreted as gross (tax-inclusive)
   *  or net (tax-exclusive). Drives the help-line wording. */
  inAti: boolean;
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
  inAti,
  onSaved,
  onContinue,
  onCancel,
}: ProductFormProps) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: buildDefaults(initial, defaultType),
    mode: 'onSubmit',
  });

  const {control, handleSubmit, formState} = form;
  const productId = initial?.id;

  const submit = handleSubmit(values => {
    startTransition(async () => {
      const formData = packIntoFormData({...values, workspaceURL});
      const result = await saveProduct(formData);
      if (!result.success) {
        toast({variant: 'destructive', title: result.message});
        return;
      }
      toast({variant: 'success', title: i18n.t('Saved')});
      /* Reset form to a state that reflects what's now persisted: any
       * just-uploaded `newImages` are now persisted as `existingImageIds`
       * (we won't know their ids until the next load, so just clear the
       * new bucket so the dirty check works). */
      form.reset({
        ...values,
        newImages: [],
      });
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

          {/* Type + Price share one wrapping row. Setting price to 0 (or
              leaving it blank) makes the product free; no separate
              Free/Paid toggle. */}
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
                      disabled={mode === 'edit'}>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="salePrice"
              render={({field}) => (
                <FormItem className="min-w-[200px] flex-1 sm:flex-none">
                  <FormLabel>{i18n.t('Price')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      {currencySymbol && (
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                          {currencySymbol}
                        </span>
                      )}
                      <Input
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
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {inAti
                      ? i18n.t('Price includes tax.')
                      : i18n.t('Price excludes tax.')}
                  </p>
                  <FormMessage />
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

          <ScreenshotsField initial={initial} />

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
      existingImageIds: [],
      newImages: [],
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
    existingImageIds: (initial.portalImageList ?? [])
      .map(row => row?.id)
      .filter((id): id is string => !!id),
    newImages: [],
  };
}

type ScreenshotsFieldProps = {
  initial?: Cloned<MyProductWithVersions>;
};

/* Multi-image upload for the product Overview tab screenshots.
 *   - Renders thumbnails of already-persisted images (rows in form
 *     `existingImageIds`). Removing one drops its row id from the array
 *     — the server then deletes the orphaned AOSProductPicture on save.
 *   - "Add images" appends to `newImages` (File[]).
 *   - Client-side caps: 5 MB per file, 10 total (existing + new). The
 *     same caps are enforced server-side by the Zod schema. */
function ScreenshotsField({initial}: ScreenshotsFieldProps) {
  const {tenant} = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const {control, setValue, getValues} = useFormContext<ProductFormValues>();
  const existingIds = useWatch({control, name: 'existingImageIds'}) ?? [];
  const newImages = useWatch({control, name: 'newImages'}) ?? [];
  const total = existingIds.length + newImages.length;
  const remaining = MAX_IMAGES - total;

  // Map existing AOSProductPicture rowId -> AOSMetaFile id (for URL).
  const initialImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of initial?.portalImageList ?? []) {
      if (row?.id && row?.picture?.id) {
        map.set(row.id, row.picture.id);
      }
    }
    return map;
  }, [initial?.portalImageList]);

  // TODO: per-file upload progress indicator.
  // Server Actions don't expose upload progress; would need to either
  // switch this to an XHR-backed route handler (universal — boring but
  // proven) or to `fetch` + ReadableStream body (no Firefox support yet,
  // HTTP/2 + HTTPS only, `duplex: 'half'`). For now we lean on the
  // submit button's pending spinner; revisit if users complain.
  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files);
    const acceptable = picked
      .filter(f => f.size <= MAX_IMAGE_SIZE)
      .slice(0, Math.max(0, remaining));
    setValue('newImages', [...newImages, ...acceptable], {
      shouldValidate: true,
      shouldDirty: true,
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <FormField
      control={control}
      name="newImages"
      render={({fieldState}) => (
        <FormItem>
          <FormLabel>
            {i18n.t('Screenshots')}{' '}
            <span className="text-xs text-muted-foreground">
              {i18n.t(
                '({0}/{1}, up to 5 MB each)',
                String(total),
                String(MAX_IMAGES),
              )}
            </span>
          </FormLabel>
          <FormControl>
            <div className="flex flex-wrap gap-3">
              {existingIds.map(rowId => {
                const pictureId = initialImageMap.get(rowId);
                if (!pictureId) return null;
                return (
                  <div
                    key={rowId}
                    className="relative aspect-video w-32 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={`/api/tenant/${tenant}/product/image/${pictureId}`}
                      alt=""
                      width={256}
                      height={144}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={i18n.t('Remove image')}
                      onClick={() =>
                        setValue(
                          'existingImageIds',
                          getValues('existingImageIds').filter(
                            id => id !== rowId,
                          ),
                          {shouldValidate: true, shouldDirty: true},
                        )
                      }
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {newImages.map((file, i) => {
                const url = URL.createObjectURL(file);
                return (
                  <div
                    key={`${file.name}-${i}`}
                    className="relative aspect-video w-32 overflow-hidden rounded-lg border border-border bg-muted">
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full object-cover"
                      onLoad={() => URL.revokeObjectURL(url)}
                    />
                    <button
                      type="button"
                      aria-label={i18n.t('Remove image')}
                      onClick={() =>
                        setValue(
                          'newImages',
                          newImages.filter((_, j) => j !== i),
                          {shouldValidate: true, shouldDirty: true},
                        )
                      }
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground">
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
              {remaining > 0 && (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex aspect-video w-32 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground">
                  <Plus size={20} />
                  <span className="text-xs">{i18n.t('Add images')}</span>
                </button>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={e => onPickFiles(e.target.files)}
              />
            </div>
          </FormControl>
          {fieldState.error && <FormMessage />}
          <p className="text-xs text-muted-foreground">
            {i18n.t(
              'Any image format. Max 5 MB per image, up to {0} per product.',
              String(MAX_IMAGES),
            )}
          </p>
        </FormItem>
      )}
    />
  );
}
