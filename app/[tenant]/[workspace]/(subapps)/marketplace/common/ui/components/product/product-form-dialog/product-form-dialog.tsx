import {RESPONSIVE_SIZES} from '@/constants';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {Button} from '@/ui/components/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '@/ui/components/responsive-dialog';
import {useResponsive} from '@/ui/hooks';
import {Loader2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useRef} from 'react';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  MyProductForEdit,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import {ProductForm} from '../product-form';
import {VersionForm} from '../../versions/version-form';
import {Stepper} from '../../shared/stepper';
import {useProductEdit} from './use-product-edit';

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  initial?: Cloned<MyProductForEdit>;
  /** Published-version count loaded with `initial` (edit mode); 0 for create. */
  initialPublishedCount?: number;
  defaultType?: MARKETPLACE_TYPE;
};

/**
 * Dialog shell: owns visibility and the listing refresh. The edit model lives
 * in `ProductEditBody`, which is mounted only while open (so it resets by
 * fresh-mount and never needs to know about the dialog lifecycle).
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  ...body
}: ProductFormDialogProps) {
  const router = useRouter();
  const responsive = useResponsive();
  const isSmall = RESPONSIVE_SIZES.some(size => responsive[size]);

  /* Whether this session persisted anything — drives a listing refresh on
   * close (the product save commits before the version step, so even a later
   * Cancel must refresh the now-stale table). Lives here, not in the model:
   * closing via Esc/✕/outside-click only flows through `onOpenChange`. */
  const savedRef = useRef(false);
  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next && savedRef.current) {
        savedRef.current = false;
        router.refresh();
      }
    },
    [onOpenChange, router],
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      isSmall={isSmall}>
      <ResponsiveDialogContent className="max-w-6xl gap-0 p-0">
        <ProductEditBody
          {...body}
          onClose={() => handleOpenChange(false)}
          onPersisted={() => {
            savedRef.current = true;
          }}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

type ProductEditBodyProps = Omit<
  ProductFormDialogProps,
  'open' | 'onOpenChange'
> & {
  onClose: () => void;
  onPersisted: () => void;
};

function ProductEditBody({
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
  initialPublishedCount,
  defaultType,
  onClose,
  onPersisted,
}: ProductEditBodyProps) {
  const edit = useProductEdit({
    workspaceURL,
    initial,
    initialPublishedCount,
    defaultType,
    onClose,
    onPersisted,
  });
  const {step, productSaved, productSnapshot, versions} = edit;

  // Each step is taller than the viewport; reset the scroll to the top on
  // change so the next step doesn't inherit the previous scroll position.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({top: 0});
  }, [step]);

  const productName = productSnapshot?.name ?? '';
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
    <div
      ref={scrollRef}
      className="max-h-[90vh] overflow-y-auto overscroll-contain">
      {/* Sticky top: Header + Stepper */}
      <div className="sticky top-0 z-10 bg-background">
        <div className="border-b border-border px-6 py-5">
          <ResponsiveDialogTitle className="text-2xl font-semibold text-foreground">
            {title}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="mt-1 text-sm text-muted-foreground">
            {subtitle}
          </ResponsiveDialogDescription>
        </div>
        <div className="border-b border-border px-6 py-5">
          <Stepper
            steps={[
              {id: 'product', name: i18n.t('Product')},
              {id: 'version', name: i18n.t('Version'), disabled: !productSaved},
            ]}
            current={step}
            onChange={id => edit.changeStep(id as typeof step)}
          />
        </div>
      </div>

      {/* Body — step owns its own scroll container + sticky footer. Each step
          unmounts when inactive; the forms and the version paging cursor live
          in `useProductEdit`, so nothing is lost. */}
      {step === 'product' && (
        <ProductForm
          vm={edit.product}
          mode={mode}
          categories={categories}
          licenses={licenses}
          initial={productSnapshot}
          listingCurrency={listingCurrency}
          inAti={inAti}
        />
      )}
      {step === 'version' &&
        edit.productId &&
        (versions.loadingFirstPage ? (
          <div className="flex items-center justify-center bg-muted/30 p-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : versions.firstPageError ? (
          <div className="flex flex-col items-center justify-center gap-4 bg-muted/30 p-12">
            <p className="text-sm text-muted-foreground">
              {i18n.t('Could not load versions.')}
            </p>
            <Button type="button" variant="outline" onClick={versions.retry}>
              {i18n.t('Retry')}
            </Button>
          </div>
        ) : (
          <VersionForm
            vm={versions}
            workspaceURI={workspaceURI}
            productId={edit.productId}
            compatibilityVersions={compatibilityVersions}
            requiresReview={requiresReview}
            allowToPublish={allowToPublish}
          />
        ))}
    </div>
  );
}
