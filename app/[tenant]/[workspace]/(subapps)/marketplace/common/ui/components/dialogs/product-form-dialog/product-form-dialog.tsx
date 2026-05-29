import {RESPONSIVE_SIZES} from '@/constants';
import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogTitle,
} from '@/ui/components/responsive-dialog';
import {useResponsive} from '@/ui/hooks';
import {useRouter} from 'next/navigation';
import {useCallback, useEffect, useRef, useState} from 'react';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  CompatibilityVersion,
  ListCategory,
  ListLicense,
  MyProductWithVersions,
  Currency,
} from '../../../../orm';
import {ProductForm} from '../../forms/product-form';
import {VersionForm} from '../../forms/version-form';
import {Stepper} from '../../primitives/stepper';

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
  const isSmall = RESPONSIVE_SIZES.some(size => responsive[size]);

  const [step, setStep] = useState<Step>('product');
  const [productId, setProductId] = useState<string | undefined>(initial?.id);

  // Each step is taller than the viewport; without this the scroll position
  // carries over when switching steps (e.g. land at the bottom of the version
  // form after scrolling down the product form). Reset to the top on change.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({top: 0});
  }, [step]);

  const productName =
    initial?.name ?? (defaultType === MARKETPLACE_TYPE.APP ? '' : '');
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
        : i18n.t('Skills hub · Open source, free for everyone');

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const onDone = useCallback(() => {
    close();
    router.refresh();
  }, [close, router]);

  const productSaved = Boolean(productId);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} isSmall={isSmall}>
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
              mode={mode}
              workspaceURL={workspaceURL}
              categories={categories}
              licenses={licenses}
              initial={initial}
              defaultType={defaultType}
              listingCurrency={listingCurrency}
              inAti={inAti}
              onSaved={id => setProductId(id)}
              onContinue={() => setStep('version')}
              onCancel={close}
            />
          )}
          {step === 'version' && productId && (
            <VersionForm
              workspaceURI={workspaceURI}
              workspaceURL={workspaceURL}
              productId={productId}
              versions={initial?.versionList ?? []}
              productCurrentVersionId={initial?.currentVersion?.id ?? null}
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
