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
import {useResponsive, useToast} from '@/ui/hooks';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useRef, useState} from 'react';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  MyProductWithVersions,
} from '../../../../orm';
import type {Currency} from '@/product/orm';
import {ProductForm} from '../product-form';
import {VersionForm} from '../../versions/version-form';
import {Stepper} from '../../shared/stepper';
import {loadMyProductForEdit} from '../../../../actions';

type Step = 'product' | 'version';

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
  initial?: Cloned<MyProductWithVersions>;
  defaultType?: MARKETPLACE_TYPE;
};

export function ProductFormDialog({
  open,
  onOpenChange,
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
}: ProductFormDialogProps) {
  const router = useRouter();
  const responsive = useResponsive();
  const {toast} = useToast();
  const isSmall = RESPONSIVE_SIZES.some(size => responsive[size]);

  const [step, setStep] = useState<Step>('product');
  const [productId, setProductId] = useState<string | undefined>(initial?.id);
  /* Live snapshot, re-seeded after each save so a repeat save doesn't re-derive
   * from a stale load (stale version, re-create on create, or drop the
   * just-uploaded screenshots). */
  const [product, setProduct] = useState(initial);
  /* Whether this session persisted anything — drives a listing refresh on
   * close. The product save commits at "Save & continue" (before the version
   * step), so even a later Cancel/✕ must refresh the now-stale table. */
  const savedRef = useRef(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      // Refresh the listing once on close if anything was persisted — covers
      // Cancel / ✕ / Esc / outside-click uniformly, and skips the refresh when
      // the user opened and closed without saving.
      if (!next && savedRef.current) {
        savedRef.current = false;
        router.refresh();
      }
    },
    [onOpenChange, router],
  );
  const close = useCallback(() => handleOpenChange(false), [handleOpenChange]);
  const onDone = useCallback(() => {
    savedRef.current = true;
    close();
  }, [close]);

  const onProductSaved = useCallback(
    async (id: string) => {
      savedRef.current = true;
      setProductId(id); // sync — unblocks the version step before the refetch
      /* The save itself already succeeded (ProductForm toasted "Saved"); this
       * only re-seeds the dialog snapshot. If the reload fails the persisted
       * data is fine, but the in-session form would be stale (and, on create,
       * still id-less — a follow-up save would create a duplicate). So warn and
       * close; `savedRef` makes the close refresh the listing, and the user can
       * reopen via Edit to keep going. */
      try {
        const res = await loadMyProductForEdit({productId: id, workspaceURL});
        if (res.success) {
          setProduct(res.data);
          return;
        }
        toast({variant: 'destructive', title: res.message});
      } catch {
        toast({
          variant: 'destructive',
          title: i18n.t(
            'Saved, but could not reload the latest data. Reopen the product to keep editing.',
          ),
        });
      }
      close();
    },
    [workspaceURL, toast, close],
  );

  /* The dialog stays mounted across close/reopen, so reset the session from the
   * current `initial` on each open. Render-phase adjustment (not an effect);
   * the `wasOpen` guard fires it once per open. */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setProduct(initial);
      setProductId(initial?.id);
      setStep('product');
      savedRef.current = false;
    }
  }

  // Each step is taller than the viewport; without this the scroll position
  // carries over when switching steps (e.g. land at the bottom of the version
  // form after scrolling down the product form). Reset to the top on change.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({top: 0});
  }, [step]);

  const productName =
    product?.name ?? (defaultType === MARKETPLACE_TYPE.APP ? '' : '');
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

  const productSaved = Boolean(productId);

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      isSmall={isSmall}>
      <ResponsiveDialogContent className="max-w-6xl gap-0 p-0">
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
                  {
                    id: 'version',
                    name: i18n.t('Version'),
                    disabled: !productSaved,
                  },
                ]}
                current={step}
                onChange={id => setStep(id as Step)}
              />
            </div>
          </div>

          {/* Body — step owns its own scroll container + sticky footer */}
          {step === 'product' && (
            <ProductForm
              /* Remount on identity/version change so buildDefaults re-seeds
               * from the freshly-refetched snapshot after a save. */
              key={`${product?.id ?? 'new'}:${product?.version ?? 0}`}
              mode={mode}
              workspaceURL={workspaceURL}
              categories={categories}
              licenses={licenses}
              initial={product}
              defaultType={defaultType}
              listingCurrency={listingCurrency}
              inAti={inAti}
              onSaved={({productId}) => {
                setStep('version'); // advance immediately; snapshot reloads async
                onProductSaved(productId);
              }}
              onCancel={close}
              renderPrimaryAction={({submit, pending, isDirty, isSaved}) =>
                isDirty || !isSaved ? (
                  <Button type="button" disabled={pending} onClick={submit}>
                    {i18n.t('Save & continue')}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={() => setStep('version')}>
                    {i18n.t('Continue')}
                  </Button>
                )
              }
            />
          )}
          {step === 'version' && productId && (
            <VersionForm
              workspaceURI={workspaceURI}
              workspaceURL={workspaceURL}
              productId={productId}
              versions={product?.versionList ?? []}
              productCurrentVersionId={product?.currentVersion?.id ?? null}
              compatibilityVersions={compatibilityVersions}
              requiresReview={requiresReview}
              allowToPublish={allowToPublish}
              onCancel={close}
              onDone={onDone}
            />
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
