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
import {ChevronLeft, ChevronRight, Plus, Star, X} from 'lucide-react';
import Image from 'next/image';
import type {ReactNode} from 'react';
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
} from '../../shared/multi-select';
import {
  COVER_STYLES,
  GRADIENT_MAP,
  type CoverStyle,
} from '../../../../constants/gradients';
import {
  DEFAULT_ICON_CODE,
  MARKETPLACE_ICONS,
} from '../../../../constants/icons';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  ListCategory,
  ListLicense,
  MyProductWithVersions,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import {scrollToFirstError} from '../../../../utils/scroll-to-error';
import {getProductScreenshotURL} from '../../../../utils/images';
import {ProductIcon} from '../../shared/product-icon';
import {FormMessageSpace} from '../../shared/form-message-space';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  productSchema,
  type ProductFormValues,
  type ProductImage,
} from './validator';

/** The data a successful `saveProduct` returns ({productId, version}). */
type SaveProductData = Extract<
  Awaited<ReturnType<typeof saveProduct>>,
  {success: true}
>['data'];

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
  /** Pulled from the workspace default product
   *  (`PortalAppConfig.defaultProductForMarketplace.inAti`). Decides whether
   *  the price the supplier enters is interpreted as gross (tax-inclusive)
   *  or net (tax-exclusive), and drives the input label wording. */
  inAti: boolean;
  onSaved: (data: SaveProductData) => void;
  onCancel: () => void;
  /** Mounter-supplied primary action, so the form stays unaware of any
   *  surrounding flow (e.g. the dialog's "continue to version" step). When
   *  omitted, a plain Save button is rendered for standalone mounts. */
  renderPrimaryAction?: (api: {
    submit: () => void;
    pending: boolean;
    isDirty: boolean;
    isSaved: boolean;
  }) => ReactNode;
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
      images: [],
    };
  }
  return {
    id: initial.id,
    version: initial.version ?? undefined,
    marketplaceTypeSelect:
      (initial.marketplaceTypeSelect as MARKETPLACE_TYPE) ??
      MARKETPLACE_TYPE.SKILL,
    name: initial.name,
    description: initial.description ?? '',
    longDescription: initial.longDescription ?? '',
    categoryIds:
      initial.categorySet?.map(c => c?.id).filter((id): id is string => !!id) ??
      [],
    licenseId: initial.license?.id ?? '',
    coverStyle: (initial.coverStyle as CoverStyle) ?? 'gradient-1',
    iconCode: initial.iconCode ?? DEFAULT_ICON_CODE,
    documentationUrl: initial.documentationUrl ?? '',
    supportIssuesUrl: initial.supportIssuesUrl ?? '',
    supportContactUrl: initial.supportContactUrl ?? '',
    salePrice:
      initial.salePrice != null ? Number(initial.salePrice) : undefined,
    /* Ordered by `sequence` at load (see findMyProductWithVersions). Array
     * position here becomes the persisted sequence on the next save; id +
     * version round-trip so re-sequencing is optimistic-locked. */
    images: (initial.pictureList ?? [])
      .filter((row): row is NonNullable<typeof row> => !!row?.id)
      .map(row => ({
        kind: 'existing' as const,
        id: row.id,
        version: row.version ?? 0,
      })),
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
  onCancel,
  renderPrimaryAction,
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
        try {
          const formData = packIntoFormData({...values, workspaceURL});
          const result = await saveProduct(formData);
          if (!result.success) {
            toast({variant: 'destructive', title: result.message});
            return;
          }
          toast({variant: 'success', title: i18n.t('Saved')});
          /* Reset to what's now persisted so the dirty check settles. Adopt the
           * new row version the save returned so a follow-up in-session save
           * doesn't trip the optimistic lock against a stale version. The
           * just-uploaded `new` items don't have row ids until the next load,
           * so drop them here; surviving existing items keep their order. */
          form.reset({
            ...values,
            version: result.data.version,
            images: values.images.filter(img => img.kind === 'existing'),
          });
          onSaved(result.data);
        } catch {
          toast({
            variant: 'destructive',
            title: i18n.t('Failed to save the product. Please try again.'),
          });
        }
      });
    },
    () => scrollToFirstError(bodyRef.current),
  );

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
                        {licenses.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
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
        {renderPrimaryAction ? (
          renderPrimaryAction({
            submit,
            pending,
            isDirty: formState.isDirty,
            isSaved: Boolean(productId),
          })
        ) : (
          <Button type="button" disabled={pending} onClick={submit}>
            {i18n.t('Save')}
          </Button>
        )}
      </div>
    </Form>
  );
}

type ScreenshotsFieldProps = {
  /** The ordered form value; array position is the persisted `sequence`. */
  images: ProductImage[];
  /** Resolves the thumbnail URL for an existing picture (per-product route).
   *  Returns null for an unknown id (renders a placeholder slot). */
  getImgSrc: (id: string) => string | null;
  onReorder: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  onAddFiles: (files: FileList | null) => void;
  /** Max number of images (existing + new) the user can keep. */
  maxImages: number;
};

/* Ordered multi-image manager. Owns everything about *presenting* the
 * screenshots — object-URL previews for new files, stable thumbnail keys,
 * the move/remove/add controls, and the native file-drop dropzone. Knows
 * nothing about react-hook-form; the caller owns the ordered `images` value
 * and the mutation callbacks.
 *   - Renders thumbnails 1:1 with `images`, in order; the first is the cover.
 *   - Each has move-left / make-cover / move-right / remove controls.
 *   - "Add or drop images" appends via onAddFiles (picker or file-drop).
 *     Reordering is button-based, so it never collides with the file drop. */
function ScreenshotsField({
  images,
  getImgSrc,
  onReorder,
  onRemove,
  onAddFiles,
  maxImages,
}: ScreenshotsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  /* Depth counter so the highlight doesn't flicker as the cursor crosses
   * child thumbnails (dragenter/dragleave fire per element boundary). */
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const remaining = maxImages - images.length;

  /* Stable React keys for new files: File refs persist across reorders, so a
   * WeakMap keyed by File gives each one a key that survives array moves
   * (preventing preview <Image> remounts / flicker). */
  const keyMap = useRef(new WeakMap<File, string>());
  const keySeq = useRef(0);
  const keyForFile = (file: File) => {
    let k = keyMap.current.get(file);
    if (!k) {
      k = `new-${++keySeq.current}`;
      keyMap.current.set(file, k);
    }
    return k;
  };

  /* Object URLs for the not-yet-uploaded files, held in state (so render
   * reflects them) and cached per File so a URL is minted once and survives
   * reorders without flicker. The effect mints URLs for newly-seen files and
   * revokes ones whose file left the list. `urlsRef` mirrors the live set so
   * the unmount cleanup can revoke whatever's outstanding. */
  const [objectUrls, setObjectUrls] = useState<Map<File, string>>(
    () => new Map(),
  );
  const urlsRef = useRef(objectUrls);
  useEffect(() => {
    const prev = urlsRef.current;
    const wanted = new Set(
      images.flatMap(img => (img.kind === 'new' ? [img.file] : [])),
    );
    const next = new Map(prev);
    let changed = false;
    for (const [file, url] of prev) {
      if (!wanted.has(file)) {
        URL.revokeObjectURL(url);
        next.delete(file);
        changed = true;
      }
    }
    for (const file of wanted) {
      if (!next.has(file)) {
        next.set(file, URL.createObjectURL(file));
        changed = true;
      }
    }
    if (changed) {
      urlsRef.current = next;
      setObjectUrls(next);
    }
  }, [images]);
  useEffect(
    () => () => {
      urlsRef.current.forEach(url => URL.revokeObjectURL(url));
      urlsRef.current = new Map();
    },
    [],
  );

  // TODO: per-file upload progress indicator.
  // Server Actions don't expose upload progress; would need to either
  // switch this to an XHR-backed route handler (universal — boring but
  // proven) or to `fetch` + ReadableStream body (no Firefox support yet,
  // HTTP/2 + HTTPS only, `duplex: 'half'`). For now we lean on the
  // submit button's pending spinner; revisit if users complain.
  const handlePick = (files: FileList | null) => {
    onAddFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    if (remaining <= 0) return;
    handlePick(event.dataTransfer.files);
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
      {images.map((img, index) => {
        const isFirst = index === 0;
        const isLast = index === images.length - 1;
        /* Resolve preview inline so the thumbnail list stays 1:1 with
         * `images` — the index below indexes the form array directly. A
         * not-yet-ready URL just renders an empty (muted) slot for a frame. */
        const key = img.kind === 'existing' ? img.id : keyForFile(img.file);
        const src =
          img.kind === 'existing'
            ? getImgSrc(img.id)
            : (objectUrls.get(img.file) ?? null);
        return (
          <div
            key={key}
            className="group relative aspect-video w-32 overflow-hidden rounded-lg border border-border bg-muted">
            {src && (
              <Image
                src={src}
                alt={i18n.t('Product screenshot {0}', String(index + 1))}
                width={256}
                height={144}
                unoptimized={img.kind === 'new'}
                className="h-full w-full object-cover"
              />
            )}
            {isFirst && (
              <span className="absolute left-1 top-1 rounded bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                {i18n.t('Cover')}
              </span>
            )}
            <button
              type="button"
              aria-label={i18n.t('Remove image')}
              onClick={() => onRemove(index)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background hover:bg-foreground">
              <X size={12} />
            </button>
            {/* Move controls — shown on hover/focus. Reordering rewrites the
                ordered `images` array; array position becomes `sequence`. */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-foreground/70 py-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
              <button
                type="button"
                aria-label={i18n.t('Move left')}
                disabled={isFirst}
                onClick={() => onReorder(index, index - 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-background hover:bg-background/20 disabled:opacity-30">
                <ChevronLeft size={14} />
              </button>
              {!isFirst && (
                <button
                  type="button"
                  aria-label={i18n.t('Make cover image')}
                  onClick={() => onReorder(index, 0)}
                  className="flex h-5 w-5 items-center justify-center rounded text-background hover:bg-background/20">
                  <Star size={12} />
                </button>
              )}
              <button
                type="button"
                aria-label={i18n.t('Move right')}
                disabled={isLast}
                onClick={() => onReorder(index, index + 1)}
                className="flex h-5 w-5 items-center justify-center rounded text-background hover:bg-background/20 disabled:opacity-30">
                <ChevronRight size={14} />
              </button>
            </div>
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
        onChange={e => handlePick(e.target.files)}
      />
    </div>
  );
}

/* Thin RHF adapter: watches the single ordered `images` field, supplies the
 * existing-image URL resolver + mutation callbacks, and renders the
 * FormField scaffold. All presentation/preview concerns live in
 * ScreenshotsField. Separate subcomponent so the useWatch subscription
 * doesn't re-render the whole ProductForm. */
function ScreenshotsFormField({
  initial,
}: {
  initial?: Cloned<MyProductWithVersions>;
}) {
  const {workspaceURI} = useWorkspace();
  const {toast} = useToast();
  const {control, setValue} = useFormContext<ProductFormValues>();
  const images = useWatch({control, name: 'images'});
  const productId = initial?.id ?? '';

  // Map existing AOSMarketplaceProductPicture rowId -> AOSMetaFile id (for URL).
  const initialImageMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of initial?.pictureList ?? []) {
      if (row?.id && row?.picture?.id) {
        map.set(row.id, row.picture.id);
      }
    }
    return map;
  }, [initial?.pictureList]);

  const getImgSrc = (id: string) => {
    const fileId = initialImageMap.get(id);
    return fileId
      ? getProductScreenshotURL({workspaceURI, productId, fileId})
      : null;
  };

  const commit = (next: ProductImage[]) =>
    setValue('images', next, {shouldValidate: true, shouldDirty: true});

  const onReorder = (from: number, to: number) => {
    if (to < 0 || to >= images.length || from === to) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const onRemove = (index: number) =>
    commit(images.filter((_, i) => i !== index));

  const onAddFiles = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files);
    const remaining = MAX_IMAGES - images.length;
    const valid = picked.filter(
      f =>
        (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type) &&
        f.size <= MAX_IMAGE_SIZE,
    );
    const accepted = valid.slice(0, Math.max(0, remaining));
    if (accepted.length) {
      commit([
        ...images,
        ...accepted.map(file => ({kind: 'new' as const, file})),
      ]);
    }
    /* Tell the user when files were dropped on the floor — otherwise an
     * oversize/unsupported image, or one past the cap, just silently
     * vanishes (it never enters `images`, so Zod can't flag it either). */
    const skipped = picked.length - accepted.length;
    if (skipped > 0) {
      toast({
        variant: 'destructive',
        title: i18n.t(
          '{0} image(s) skipped — unsupported type, over 5 MB, or past the {1}-image limit.',
          String(skipped),
          String(MAX_IMAGES),
        ),
      });
    }
  };

  return (
    <FormField
      control={control}
      name="images"
      render={() => (
        <FormItem>
          <FormLabel>
            {i18n.t('Screenshots')}{' '}
            <span className="text-xs text-muted-foreground">
              {i18n.t(
                '({0}/{1}, up to 5 MB each)',
                String(images.length),
                String(MAX_IMAGES),
              )}
            </span>
          </FormLabel>
          <FormControl>
            <ScreenshotsField
              images={images}
              getImgSrc={getImgSrc}
              onReorder={onReorder}
              onRemove={onRemove}
              onAddFiles={onAddFiles}
              maxImages={MAX_IMAGES}
            />
          </FormControl>
          <FormMessageSpace />
          <p className="text-xs text-muted-foreground">
            {i18n.t(
              'Any image format. Max 5 MB per image, up to {0} per product. The first image is the cover.',
              String(MAX_IMAGES),
            )}
          </p>
        </FormItem>
      )}
    />
  );
}
