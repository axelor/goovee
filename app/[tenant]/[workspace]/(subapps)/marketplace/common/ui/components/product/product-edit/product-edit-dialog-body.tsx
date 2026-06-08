import {i18n} from '@/locale';
import type {Currency} from '@/product/orm';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components/button';
import {Form} from '@/ui/components/form';
import {useToast} from '@/ui/hooks';
import {Loader2} from 'lucide-react';
import {useEffect, useRef, useState, type ElementType} from 'react';
import {loadProductVersions} from '../../../../actions';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  MyProductForEdit,
  MyProductVersion,
} from '../../../../orm';
import {VERSIONS_PAGE_SIZE} from '../../versions/version-form/validator';
import {ProductCollapsible} from './product-collapsible';
import {useProductEditForm} from './use-product-edit-form';
import {VersionSection} from './version-section';

export type ProductEditDialogBodyProps = {
  mode: 'create' | 'edit';
  workspaceURI: string;
  workspaceURL: string;
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
  listingCurrency: Cloned<Currency> | null;
  inAti: boolean;
  /** The product being edited; absent in create mode. */
  initial?: Cloned<MyProductForEdit>;
  /** Fixed product type for create mode. */
  defaultType?: MARKETPLACE_TYPE;
  /** Dismiss the dialog (Cancel / ✕). */
  onClose: () => void;
  /** A combined save persisted — the host closes and refreshes the listing. */
  onSaved: () => void;
  /* ---- host-injected chrome ---- */
  Title?: ElementType;
  Description?: ElementType;
  scrollContainerClassName: string;
};

/**
 * Combined editor mounted inside the dialog: the product (collapsible) and the
 * version surface in one scroll, saved once. On edit it loads the first page of
 * versions before mounting the form (the combined model seeds from them); create
 * starts with no versions. The full-page route uses `ProductEditPage` instead;
 * both drive the same `useProductEditForm`.
 */
export function ProductEditDialogBody({
  mode,
  workspaceURI,
  workspaceURL,
  categories,
  licenses,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  listingCurrency,
  inAti,
  initial,
  defaultType,
  onClose,
  onSaved,
  Title = 'h2',
  Description = 'p',
  scrollContainerClassName,
}: ProductEditDialogBodyProps) {
  const {toast} = useToast();
  const productId = initial?.id;

  const [versions, setVersions] = useState<Cloned<MyProductVersion>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  /* Edit: pull the first page of versions before mounting the form. Create has
   * no versions yet, so this never runs. */
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      const res = await loadProductVersions({
        productId,
        workspaceURL,
        skip: 0,
        take: VERSIONS_PAGE_SIZE,
      });
      if (cancelled) return;
      if (res.success) {
        setVersions(res.data.versions);
        setTotal(res.data.total);
      } else {
        setError(true);
        toast({variant: 'destructive', title: res.message});
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, workspaceURL, retry, toast]);

  const productName = initial?.name ?? '';
  const title =
    mode === 'edit'
      ? `${i18n.t('Edit')} · ${productName}`
      : defaultType === MARKETPLACE_TYPE.APP
        ? i18n.t('Publish a new app')
        : i18n.t('Publish a new skill');
  const subtitle =
    mode === 'edit'
      ? i18n.t('Update metadata or release a new version')
      : defaultType === MARKETPLACE_TYPE.APP
        ? i18n.t('Apps hub · Discover and ship')
        : i18n.t('Skills hub · Discover and ship');

  return (
    <div className={scrollContainerClassName}>
      <div className="sticky top-0 z-10 border-b border-border bg-background px-6 py-5">
        <Title className="text-2xl font-semibold text-foreground">
          {title}
        </Title>
        <Description className="mt-1 text-sm text-muted-foreground">
          {subtitle}
        </Description>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-sm text-muted-foreground">
            {i18n.t('Could not load versions.')}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRetry(n => n + 1)}>
            {i18n.t('Retry')}
          </Button>
        </div>
      ) : (
        <DialogForm
          mode={mode}
          initial={initial}
          defaultType={defaultType}
          initialVersions={versions}
          initialTotal={total}
          workspaceURI={workspaceURI}
          workspaceURL={workspaceURL}
          categories={categories}
          licenses={licenses}
          compatibilityVersions={compatibilityVersions}
          requiresReview={requiresReview}
          allowToPublish={allowToPublish}
          listingCurrency={listingCurrency}
          inAti={inAti}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

type DialogFormProps = Omit<
  ProductEditDialogBodyProps,
  'Title' | 'Description' | 'scrollContainerClassName'
> & {
  initialVersions: Cloned<MyProductVersion>[];
  initialTotal: number;
};

function DialogForm({
  mode,
  initial,
  defaultType,
  initialVersions,
  initialTotal,
  workspaceURI,
  workspaceURL,
  categories,
  licenses,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  listingCurrency,
  inAti,
  onClose,
  onSaved,
}: DialogFormProps) {
  /* Create opens with the product fields open (nothing to summarise yet); edit
   * opens collapsed so the version surface is the focus. */
  const [productExpanded, setProductExpanded] = useState(mode === 'create');
  const versionRef = useRef<HTMLDivElement>(null);

  const model = useProductEditForm({
    initial,
    defaultType,
    initialVersions,
    initialTotal,
    workspaceURL,
    onSaved,
    onInvalidLocation: location => {
      /* Reveal whatever the user can't currently see so the error is visible. */
      if (location === 'product') {
        setProductExpanded(true);
      } else {
        versionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },
  });
  /* True only for genuine edits: `loadMore` rebaselines appended rows, so
   * paginating doesn't dirty the form. */
  const isDirty = model.form.formState.isDirty;

  return (
    <Form {...model.form}>
      <div className="space-y-6 p-6 pb-24">
        <ProductCollapsible
          expanded={productExpanded}
          onOpenChange={setProductExpanded}
          categories={categories}
          licenses={licenses}
          initial={initial}
          listingCurrency={listingCurrency}
          inAti={inAti}
        />
        <div ref={versionRef}>
          <VersionSection
            model={model}
            requiresReview={requiresReview}
            allowToPublish={allowToPublish}
            compatibilityVersions={compatibilityVersions}
            workspaceURI={workspaceURI}
          />
        </div>
      </div>

      {/* One combined save for the whole dialog. */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border bg-background px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={model.pending}>
          {i18n.t('Cancel')}
        </Button>
        <Button
          type="button"
          onClick={model.save}
          disabled={model.pending || !isDirty}>
          {model.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {i18n.t('Save')}
        </Button>
      </div>
    </Form>
  );
}
