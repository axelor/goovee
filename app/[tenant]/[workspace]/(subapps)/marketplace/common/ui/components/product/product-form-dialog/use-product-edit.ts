import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import {useCallback, useEffect, useState} from 'react';
import {loadMyProductForEdit, loadProductVersions} from '../../../../actions';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {MyProductForEdit, MyProductVersion} from '../../../../orm';
import {useProductForm, type SaveProductData} from './use-product-form';
import {useVersionForm} from '../../versions/version-form/use-version-form';
import {VERSIONS_PAGE_SIZE} from '../../versions/version-form/validator';

export type Step = 'product' | 'version';

type ExistingVersion = Cloned<MyProductVersion>;

type UseProductEditParams = {
  workspaceURL: string;
  initial?: Cloned<MyProductForEdit>;
  initialPublishedCount?: number;
  defaultType?: MARKETPLACE_TYPE;
  /** Close the dialog. The hook never touches dialog visibility itself. */
  onClose: () => void;
  /** Signal that something persisted this session (the dialog refreshes the
   *  listing on close). */
  onPersisted: () => void;
};

/**
 * Composes the two step forms (`useProductForm` + `useVersionForm`) and owns the
 * bits that span them: the active step, the product snapshot/id/published-count
 * those forms are driven by, the version first page (provided to the version
 * form as its seed, just as the snapshot seeds the product form), and the save
 * →advance→reload handoff. It knows nothing about where it's mounted — the
 * dialog owns visibility and refresh and feeds in `onClose`/`onPersisted`. It is
 * mounted only while the dialog is open, so it resets by fresh-mount.
 */
export function useProductEdit({
  workspaceURL,
  initial,
  initialPublishedCount,
  defaultType,
  onClose,
  onPersisted,
}: UseProductEditParams) {
  const {toast} = useToast();

  const [step, setStep] = useState<Step>('product');
  const [productId, setProductId] = useState<string | undefined>(initial?.id);
  /* Live snapshot, re-seeded after each save so a repeat save doesn't re-derive
   * from a stale load. Drives both forms (product values + version inputs). */
  const [product, setProduct] = useState(initial);
  const [publishedCount, setPublishedCount] = useState(
    initialPublishedCount ?? 0,
  );

  /* Version first page — fetched here and handed to the version form as its
   * seed, mirroring how the product snapshot seeds the product form. The
   * version form owns only pagination (`loadMore`) from there. */
  const [firstVersions, setFirstVersions] = useState<ExistingVersion[]>([]);
  const [firstTotal, setFirstTotal] = useState(0);
  const [loadingFirstPage, setLoadingFirstPage] = useState(
    Boolean(initial?.id),
  );
  const [firstPageError, setFirstPageError] = useState(false);
  const [firstPageRetry, setFirstPageRetry] = useState(0);

  /* Load the first page once the product has an id (on open while still on the
   * product step, and again when a create-mode save mints the id, or on Retry). */
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoadingFirstPage(true);
    setFirstPageError(false);
    (async () => {
      const res = await loadProductVersions({
        productId,
        workspaceURL,
        skip: 0,
        take: VERSIONS_PAGE_SIZE,
      });
      if (cancelled) return;
      if (res.success) {
        setFirstVersions(res.data.versions);
        setFirstTotal(res.data.total);
      } else {
        setFirstPageError(true);
        toast({variant: 'destructive', title: res.message});
      }
      setLoadingFirstPage(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, workspaceURL, toast, firstPageRetry]);

  /* ---- product → version handoff ---- */

  const reloadSnapshot = useCallback(
    async (id: string) => {
      onPersisted();
      setProductId(id); // sync — unblocks the version step before the refetch
      /* The save already succeeded; this only re-seeds the snapshot. If the
       * reload fails the persisted data is fine but the in-session form would
       * be stale (and id-less on create), so warn and close. */
      try {
        const res = await loadMyProductForEdit({productId: id, workspaceURL});
        if (res.success) {
          setProduct(res.data.product);
          setPublishedCount(res.data.publishedCount);
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
      onClose();
    },
    [workspaceURL, toast, onClose, onPersisted],
  );

  const onProductSaved = useCallback(
    (data: SaveProductData) => {
      setStep('version'); // advance immediately; snapshot reloads async
      void reloadSnapshot(data.productId);
    },
    [reloadSnapshot],
  );

  const onDone = useCallback(() => {
    onPersisted();
    onClose();
  }, [onPersisted, onClose]);

  /* ---- sub-hooks ---- */

  const productStep = useProductForm({
    initial: product,
    defaultType,
    workspaceURL,
    onSaved: onProductSaved,
  });
  const versions = useVersionForm({
    productId,
    initialVersions: firstVersions,
    initialTotal: firstTotal,
    productCurrentVersionId: product?.currentVersion?.id ?? null,
    publishedCount,
    workspaceURL,
    onDone,
  });

  /* ---- step navigation (dirty-guarded; reads each form's own dirty flag) ---- */

  const continueToVersion = useCallback(() => setStep('version'), []);
  const changeStep = useCallback(
    (next: Step) => {
      if (next === step) return;
      const dirty = step === 'product' ? productStep.isDirty : versions.isDirty;
      if (dirty) {
        toast({
          variant: 'destructive',
          title: i18n.t('Save your changes before switching steps'),
        });
        return;
      }
      setStep(next);
    },
    [step, productStep.isDirty, versions.isDirty, toast],
  );

  return {
    step,
    changeStep,
    productSaved: Boolean(productId),
    productSnapshot: product,
    productId,
    // Inject the step/close concerns the sub-hooks deliberately don't own.
    product: {
      ...productStep,
      saved: Boolean(productId),
      continueToVersion,
      cancel: onClose,
    },
    versions: {
      ...versions,
      loadingFirstPage,
      firstPageError,
      retry: () => setFirstPageRetry(n => n + 1),
      cancel: onClose,
    },
  };
}

export type ProductEditModel = ReturnType<typeof useProductEdit>;
export type ProductStepModel = ProductEditModel['product'];
export type VersionStepModel = ProductEditModel['versions'];
