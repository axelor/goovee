import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {RichTextEditor} from '@/ui/components';
import {Button} from '@/ui/components/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/components/form';
import {Input} from '@/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import {useToast} from '@/ui/hooks';
import {cn} from '@/utils/css';
import {packIntoFormData} from '@/utils/formdata';
import {zodResolver} from '@hookform/resolvers/zod';
import {Plus, X} from 'lucide-react';
import Image from 'next/image';
import {useEffect, useMemo, useRef, useState, useTransition} from 'react';
import {useForm, useFormContext, useWatch} from 'react-hook-form';
import {saveProduct} from '../../../../actions';
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from '../../multi-select';
import {GRADIENT_MAP} from '../../../../constants/gradients';
import {
  DEFAULT_ICON_CODE,
  MARKETPLACE_ICONS,
} from '../../../../constants/icons';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  ListCategory,
  ListLicense,
  MyProductWithVersions,
  Currency,
} from '../../../../orm';
import {scrollToFirstError} from '../../../../utils/scroll-to-error';
import {ProductIcon} from '../../primitives/product-icon';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  productSchema,
  type ProductFormValues,
} from './validator';

const COVER_CODES = Object.keys(GRADIENT_MAP);

type ProductFormProps = {
  mode: 'create' | 'edit';
  workspaceURL: string;
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  initial?: Cloned<MyProductWithVersions>;
  defaultType?: MARKETPLACE_TYPE;
  /** Currency of the existing listing, or the resolved new-listing fallback
   *  (partner → app default) for create. Drives the input's currency
   *  adornment via `.symbol`. */
  listingCurrency: Cloned<Currency> | null;
  /** Pulled from the workspace's backing product
   *  (`PortalAppConfig.defaultProductForMarketplace.inAti`). Decides whether
   *  the price the supplier enters is interpreted as gross (tax-inclusive)
   *  or net (tax-exclusive), and drives the input label wording. */
  inAti: boolean;
  onSaved: (productId: string) => void;
  onContinue: () => void;
  onCancel: () => void;
};

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
      categoryIds: [],
      licenseId: '',
      coverStyle: 'gradient-1',
      iconCode: DEFAULT_ICON_CODE,
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
    categoryIds:
      initial.categorySet?.map(c => c?.id).filter((id): id is string => !!id) ??
      [],
    licenseId: initial.license?.id ?? '',
    coverStyle: initial.coverStyle ?? 'gradient-1',
    iconCode: initial.iconCode ?? DEFAULT_ICON_CODE,
    documentationUrl: initial.documentationUrl ?? '',
    supportIssuesUrl: initial.supportIssuesUrl ?? '',
    supportContactUrl: initial.supportContactUrl ?? '',
    salePrice:
      initial.salePrice != null ? Number(initial.salePrice) : undefined,
    existingImageIds: (initial.pictureList ?? [])
      .map(row => row?.id)
      .filter((id): id is string => !!id),
    newImages: [],
  };
}

export function ProductForm({
  mode,
  workspaceURL,
  categories,
  licenses,
  initial,
  defaultType,
  listingCurrency,
  inAti,
  onSaved,
  onContinue,
  onCancel,
}: ProductFormProps) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();

  const currencySymbol = listingCurrency?.symbol ?? null;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: buildDefaults(initial, defaultType),
    mode: 'onSubmit',
  });

  const {control, handleSubmit, formState} = form;
  const productId = initial?.id;
  const bodyRef = useRef<HTMLDivElement>(null);

  const submit = handleSubmit(
    values => {
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
    },
    () => scrollToFirstError(bodyRef.current),
  );

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
      <div ref={bodyRef} className="bg-muted/30 p-6" data-vaul-no-drag>
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
                        {licenses.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {l.code}
                            </span>
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
                        categories.find(c => c.id === value)?.name
                      }>
                      <MultiSelectorInput
                        placeholder={i18n.t('Select categories')}
                      />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      <MultiSelectorList>
                        {categories.map(c => (
                          <MultiSelectorItem key={c.id} value={c.id}>
                            {c.name}
                          </MultiSelectorItem>
                        ))}
                      </MultiSelectorList>
                    </MultiSelectorContent>
                  </MultiSelector>
                </FormControl>
                <FormMessage />
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
                    content={initial?.longDescription ?? ''}
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
            name="coverStyle"
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
                <FormMessage />
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

type ExistingImage = {
  /** AOSProductPicture row id (the form field value). */
  rowId: string;
  /** AOSMetaFile id used to fetch the image. */
  pictureId: string;
};

type ScreenshotsFieldProps = {
  existingImages: ExistingImage[];
  newImages: File[];
  onExistingImagesChange: (next: ExistingImage[]) => void;
  onNewImagesChange: (next: File[]) => void;
  /** Tenant slug used to build image URLs. */
  tenant: string;
  /** Max number of files (existing + new) the user can keep. */
  maxImages: number;
  /** Per-file size cap; oversize files are silently dropped on pick. */
  maxImageSize: number;
};

/* Controlled multi-image uploader. Knows nothing about react-hook-form;
 * caller drives state via the two value/onChange pairs.
 *   - Renders thumbnails of already-persisted images (`existingImages`).
 *     Removing one filters the array — the server then deletes the
 *     orphaned AOSProductPicture on save.
 *   - "Add images" appends to `newImages` (File[]).
 *   - Caps applied client-side: oversize files dropped, total slice'd
 *     at maxImages. */
function ScreenshotsField({
  existingImages,
  newImages,
  onExistingImagesChange,
  onNewImagesChange,
  tenant,
  maxImages,
  maxImageSize,
}: ScreenshotsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* Depth counter so the highlight doesn't flicker as the cursor crosses
   * child thumbnails (dragenter/dragleave fire per element boundary). */
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const total = existingImages.length + newImages.length;
  const remaining = maxImages - total;

  /* Object URLs for the not-yet-uploaded files. Created in an effect (never
   * during render) and revoked on cleanup so they don't leak across re-renders
   * or unmount. `previews` mirrors `newImages` order, so indices line up. */
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = newImages.map(file => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [newImages]);

  // TODO: per-file upload progress indicator.
  // Server Actions don't expose upload progress; would need to either
  // switch this to an XHR-backed route handler (universal — boring but
  // proven) or to `fetch` + ReadableStream body (no Firefox support yet,
  // HTTP/2 + HTTPS only, `duplex: 'half'`). For now we lean on the
  // submit button's pending spinner; revisit if users complain.
  const onPickFiles = (files: FileList | null) => {
    if (!files) return;
    const acceptable = Array.from(files)
      .filter(
        f =>
          (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type) &&
          f.size <= maxImageSize,
      )
      .slice(0, Math.max(0, remaining));
    onNewImagesChange([...newImages, ...acceptable]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (remaining <= 0) return;
    onPickFiles(event.dataTransfer.files);
  };

  return (
    <div
      onDragEnter={e => {
        e.preventDefault();
        dragDepth.current += 1;
        if (remaining > 0) setIsDragging(true);
      }}
      onDragOver={e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = remaining > 0 ? 'copy' : 'none';
      }}
      onDragLeave={e => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={handleDrop}
      className={cn(
        'flex flex-wrap gap-3 rounded-lg border-2 border-dashed p-3 transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-transparent',
      )}>
      {existingImages.map(({rowId, pictureId}, index) => (
        <div
          key={rowId}
          className="relative aspect-video w-32 overflow-hidden rounded-lg border border-border bg-muted">
          <Image
            src={`/api/tenant/${tenant}/product/image/${pictureId}`}
            alt={i18n.t('Product screenshot {0}', String(index + 1))}
            width={256}
            height={144}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            aria-label={i18n.t('Remove image')}
            onClick={() =>
              onExistingImagesChange(
                existingImages.filter(img => img.rowId !== rowId),
              )
            }
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground">
            <X size={12} />
          </button>
        </div>
      ))}
      {newImages.map((file, i) => {
        const url = previews[i];
        if (!url) return null;
        return (
          <div
            key={`${file.name}-${i}`}
            className="relative aspect-video w-32 overflow-hidden rounded-lg border border-border bg-muted">
            <Image
              src={url}
              alt={file.name}
              width={256}
              height={144}
              unoptimized
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              aria-label={i18n.t('Remove image')}
              onClick={() =>
                onNewImagesChange(newImages.filter((_, j) => j !== i))
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
          <span className="text-xs">{i18n.t('Add or drop images')}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        hidden
        onChange={e => onPickFiles(e.target.files)}
      />
    </div>
  );
}

/* Binds ScreenshotsField to RHF (existingImageIds + newImages fields)
 * and wraps it in FormField scaffolding. Kept as a subcomponent so the
 * useWatch subscriptions don't re-render the whole ProductForm. */
function ScreenshotsFormField({
  initial,
}: {
  initial?: Cloned<MyProductWithVersions>;
}) {
  const {tenant} = useWorkspace();
  const {control, setValue} = useFormContext<ProductFormValues>();
  const existingIds = useWatch({control, name: 'existingImageIds'});
  const newImages = useWatch({control, name: 'newImages'});

  // Map existing AOSProductPicture rowId -> AOSMetaFile id (for URL).
  const initialImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of initial?.pictureList ?? []) {
      if (row?.id && row?.picture?.id) {
        map.set(row.id, row.picture.id);
      }
    }
    return map;
  }, [initial?.pictureList]);

  const existingImages = useMemo<ExistingImage[]>(
    () =>
      existingIds
        .map(rowId => {
          const pictureId = initialImageMap.get(rowId);
          return pictureId ? {rowId, pictureId} : null;
        })
        .filter((x): x is ExistingImage => x !== null),
    [existingIds, initialImageMap],
  );

  const total = existingIds.length + newImages.length;

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
            <ScreenshotsField
              existingImages={existingImages}
              newImages={newImages}
              onExistingImagesChange={next =>
                setValue(
                  'existingImageIds',
                  next.map(img => img.rowId),
                  {shouldValidate: true, shouldDirty: true},
                )
              }
              onNewImagesChange={next =>
                setValue('newImages', next, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              tenant={tenant}
              maxImages={MAX_IMAGES}
              maxImageSize={MAX_IMAGE_SIZE}
            />
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
