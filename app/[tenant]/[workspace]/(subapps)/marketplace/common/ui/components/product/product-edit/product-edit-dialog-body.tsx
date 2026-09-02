import {i18n} from '@/locale';
import type {Currency} from '@/product/orm';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components/button';
import {Form} from '@/ui/components/form';
import {Loader2} from 'lucide-react';
import {useRef, useState, type ElementType} from 'react';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  MyProductForEdit,
  MyProductVersion,
} from '../../../../orm';
import {ProductCollapsible} from './product-collapsible';
import {ScreenshotStagingProvider} from './screenshot-staging-context';
import {useProductEditForm} from './use-product-edit-form';
import {VersionSection} from './version-section';

export type ProductEditDialogBodyProps = {
  mode: 'create' | 'edit';
  workspaceURI: string;
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  compatibilityVersions: Cloned<CompatibilityVersion>[];
  requiresReview: boolean;
  allowToPublish: boolean;
  listingCurrency: Cloned<Currency> | null;
  inAti: boolean;
  /** The product being edited; absent in create mode. */
  initial?: Cloned<MyProductForEdit>;
  /** First page of existing versions, fetched alongside the product in one
   *  round-trip before the dialog opens, so it opens populated. Empty for
   *  create. */
  initialVersions?: Cloned<MyProductVersion>[];
  initialTotal?: number;
  /** Fixed product type for create mode. */
  defaultType?: MARKETPLACE_TYPE;
  /** Dismiss from the Cancel button. Closing via ✕ or Escape goes through
   *  the dialog wrapper's own visibility instead, never this. */
  onClose: () => void;
  /** Called once a combined save has persisted. */
  onSaved: () => void;
  /* ---- host-injected chrome ---- */
  Title?: ElementType;
  Description?: ElementType;
  scrollContainerClassName: string;
};

/**
 * Combined editor mounted inside the dialog: the product (collapsible) and the
 * version surface in one scroll, saved once. The product and its first page of
 * versions are passed in, so the dialog opens populated. The full-page route
 * is a parallel implementation in `ProductEditPage`; both drive the same
 * `useProductEditForm`, and behaviour changes belong in both.
 */
export function ProductEditDialogBody({
  mode,
  workspaceURI,
  categories,
  licenses,
  compatibilityVersions,
  requiresReview,
  allowToPublish,
  listingCurrency,
  inAti,
  initial,
  initialVersions = [],
  initialTotal = 0,
  defaultType,
  onClose,
  onSaved,
  Title = 'h2',
  Description = 'p',
  scrollContainerClassName,
}: ProductEditDialogBodyProps) {
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
      <div className="sticky top-0 z-10 border-b border-ink-100 bg-white px-6 py-5">
        <Title className="text-2xl font-semibold text-ink-900">{title}</Title>
        <Description className="mt-1 text-sm text-ink-500">
          {subtitle}
        </Description>
      </div>

      <DialogForm
        mode={mode}
        initial={initial}
        defaultType={defaultType}
        initialVersions={initialVersions}
        initialTotal={initialTotal}
        workspaceURI={workspaceURI}
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
      <ScreenshotStagingProvider value={model.screenshotStaging}>
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
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-6 py-4">
          {model.uploadsInFlight ? (
            <span className="mr-auto text-sm text-ink-500">
              {i18n.t('Uploads in progress…')}
            </span>
          ) : model.uploadsPaused ? (
            <span className="mr-auto text-sm text-status-pending-fg">
              {i18n.t('Resume or remove the paused uploads to save.')}
            </span>
          ) : (
            model.uploadsFailed && (
              <span className="mr-auto text-sm text-destructive">
                {i18n.t('Fix failed uploads to save.')}
              </span>
            )
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={model.pending}>
            {i18n.t('Cancel')}
          </Button>
          <Button
            variant="royal"
            type="button"
            onClick={model.save}
            disabled={model.pending || !isDirty || !model.uploadsStaged}>
            {model.pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {i18n.t('Save')}
          </Button>
        </div>
      </ScreenshotStagingProvider>
    </Form>
  );
}
