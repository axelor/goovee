import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import {packIntoFormData} from '@/utils/formdata';
import {zodResolver} from '@hookform/resolvers/zod';
import {useEffect, useMemo, useRef, useState, useTransition} from 'react';
import {useForm} from 'react-hook-form';
import {
  loadProductVersions,
  saveVersion,
  unpublishVersion,
} from '../../../../actions';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import type {MyProductVersion} from '../../../../orm';
import {scrollToFirstError} from '../../../../utils/scroll-to-error';
import {formatVersionNumber} from '../../../../utils/version-number';
import {
  VERSIONS_PAGE_SIZE,
  VERSIONS_PREFETCH_AHEAD,
  versionSchema,
  type VersionFormValues,
} from './validator';

type ExistingVersion = Cloned<MyProductVersion>;

const blankVersion = (productId: string): VersionFormValues => ({
  productId,
  versionNumber: '',
  changelog: '',
  statusSelect: MARKETPLACE_VERSION_STATUS.DRAFT,
  compatibilitySetIds: [],
});

function versionToFormValues(
  current: ExistingVersion,
  productId: string,
): VersionFormValues {
  return {
    id: current.id,
    productId,
    versionNumber: formatVersionNumber(current),
    changelog: current.changelog ?? '',
    statusSelect:
      current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED
        ? MARKETPLACE_VERSION_STATUS.PUBLISHED
        : MARKETPLACE_VERSION_STATUS.DRAFT,
    compatibilitySetIds: (current.compatibilitySet ?? []).map(c => c.id),
    existingBundleFileId: current.bundleFile?.id,
  };
}

type UseVersionFormParams = {
  /** The product whose versions these are; undefined until a create-mode save. */
  productId: string | undefined;
  /** First page of versions, loaded and provided by the host (mirrors how the
   *  product form is seeded by its snapshot). Subsequent pages are fetched here
   *  via `loadMore`; re-seeding when this changes resets the window. */
  initialVersions: ExistingVersion[];
  initialTotal: number;
  /** The live version's id — drives the unpublish-confirmation wording. */
  productCurrentVersionId: string | null;
  /** Published (non-archived) count — drives the unpublish wording. */
  publishedCount: number;
  workspaceURL: string;
  /** Called after a save/unpublish persists; the host closes + refreshes. */
  onDone: () => void;
};

/**
 * Self-contained version-step model: the RHF form, the paged version window,
 * navigation/parking, and save/unpublish. The first page is provided by the
 * host (`initialVersions`/`initialTotal`); this hook only fetches subsequent
 * pages via `loadMore`. Driven entirely by its inputs — it knows nothing about
 * the product step or the dialog flow. The window survives an unmount because
 * this hook lives in the host that outlives the version step component.
 */
export function useVersionForm({
  productId,
  initialVersions,
  initialTotal,
  productCurrentVersionId,
  publishedCount,
  workspaceURL,
  onDone,
}: UseVersionFormParams) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);

  /* Loaded window of versions, seeded from the host's first page and grown a
   * page at a time by `loadMore`. */
  const [loaded, setLoaded] = useState<ExistingVersion[]>(initialVersions);
  const [total, setTotal] = useState(initialTotal);
  const [index, setIndex] = useState(0);
  const [creatingNew, setCreatingNew] = useState(initialTotal === 0);
  const [slideDir, setSlideDir] = useState<'next' | 'prev'>('next');
  const [awaitingNext, setAwaitingNext] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  /** The in-flight next-page request, or null when idle — shared so a parked
   *  "next" and a background prefetch await the same fetch. */
  const loadingRef = useRef<Promise<boolean> | null>(null);

  const current = creatingNew ? undefined : loaded[index];
  const allLoaded = loaded.length >= total;

  /* Re-seed the window when the host provides a new first page (product change,
   * re-open, or Retry), resetting the cursor so it starts clean. */
  useEffect(() => {
    setLoaded(initialVersions);
    setTotal(initialTotal);
    setIndex(0);
    setCreatingNew(initialTotal === 0);
    setAwaitingNext(false);
    loadingRef.current = null;
  }, [initialVersions, initialTotal]);

  const defaults = useMemo<VersionFormValues>(
    () =>
      current
        ? versionToFormValues(current, productId ?? '')
        : blankVersion(productId ?? ''),
    [current, productId],
  );
  /* `values` (not `defaultValues`) so RHF re-syncs to the new entry as the user
   * pages between versions in place. Safe because this memo is synchronous and
   * complete — RHF seeds the baseline from it at creation, so no field starts
   * undefined. */
  const form = useForm<VersionFormValues>({
    resolver: zodResolver(versionSchema),
    values: defaults,
    mode: 'onSubmit',
  });
  const isDirty = form.formState.isDirty;

  /* ---- paging ---- */

  const loadMore = (): Promise<boolean> => {
    if (loadingRef.current) return loadingRef.current;
    const request = (async () => {
      try {
        const res = await loadProductVersions({
          productId: productId ?? '',
          workspaceURL,
          skip: loaded.length,
          take: VERSIONS_PAGE_SIZE,
        });
        if (!res.success) {
          toast({variant: 'destructive', title: res.message});
          return false;
        }
        setLoaded(prev => [...prev, ...res.data.versions]);
        setTotal(res.data.total);
        return res.data.versions.length > 0;
      } finally {
        loadingRef.current = null;
      }
    })();
    loadingRef.current = request;
    return request;
  };

  const guardedNavigate = (move: () => void, dir: 'next' | 'prev') => {
    if (isDirty) {
      toast({
        variant: 'destructive',
        title: i18n.t('Save the current version before switching'),
      });
      return;
    }
    setSlideDir(dir);
    move();
  };

  const prefetchAhead = (at: number) => {
    if (allLoaded) return;
    const remainingAhead = loaded.length - 1 - at;
    if (remainingAhead <= VERSIONS_PREFETCH_AHEAD) void loadMore();
  };

  const goPrev = () =>
    guardedNavigate(
      () => setIndex(i => (i > 0 ? i - 1 : allLoaded ? total - 1 : 0)),
      'prev',
    );

  const goNext = () =>
    guardedNavigate(() => {
      if (index < loaded.length - 1) {
        const next = index + 1;
        setIndex(next);
        prefetchAhead(next);
        return;
      }
      if (!allLoaded) {
        // Park at the frontier and step forward once the next page settles.
        setAwaitingNext(true);
        loadMore()
          .then(gotMore => {
            if (gotMore) setIndex(i => i + 1);
          })
          .finally(() => setAwaitingNext(false));
        return;
      }
      setIndex(0); // everything loaded, on the last entry — wrap to the first
    }, 'next');

  const addNew = () => {
    if (isDirty) {
      toast({
        variant: 'destructive',
        title: i18n.t('Save the current version first'),
      });
      return;
    }
    setSlideDir('next');
    setCreatingNew(true);
  };

  /* Adding a new version never moved the cursor, so the position the user was
   * on is still in state — discarding just drops the draft and slides back to
   * it (rather than jumping to the top). */
  const discardNew = () => {
    setSlideDir('prev');
    setCreatingNew(false);
  };

  /* ---- save / unpublish ---- */

  const submit = form.handleSubmit(
    values => {
      startTransition(async () => {
        try {
          const formData = packIntoFormData({...values, workspaceURL});
          const result = await saveVersion(formData);
          if (!result.success) {
            toast({variant: 'destructive', title: result.message});
            return;
          }
          toast({variant: 'success', title: i18n.t('Version saved')});
          onDone();
        } catch {
          toast({
            variant: 'destructive',
            title: i18n.t('Failed to save the version. Please try again.'),
          });
        }
      });
    },
    () => scrollToFirstError(bodyRef.current),
  );
  const saveVersionAs = (status: VersionFormValues['statusSelect']) => {
    form.setValue('statusSelect', status);
    submit();
  };

  const runUnpublish = () => {
    if (!current?.id) return;
    setConfirmUnpublish(false);
    startTransition(async () => {
      try {
        const result = await unpublishVersion({
          versionId: current.id,
          productId: productId ?? '',
          workspaceURL,
        });
        if (!result.success) {
          toast({variant: 'destructive', title: result.message});
          return;
        }
        toast({variant: 'success', title: i18n.t('Version unpublished')});
        onDone();
      } catch {
        toast({
          variant: 'destructive',
          title: i18n.t('Failed to unpublish the version. Please try again.'),
        });
      }
    });
  };

  /* ---- derived view-state ---- */

  const displayTotal = total + (creatingNew ? 1 : 0);
  const isPublished =
    !!current?.id &&
    current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED;
  const canUnpublish =
    !!current?.id &&
    (current.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED ||
      current.statusSelect === MARKETPLACE_VERSION_STATUS.IN_REVIEW);
  // Save-as-draft makes sense for anything that isn't already live or queued.
  const canSaveAsDraft = !canUnpublish;
  const isUnpublishingCurrent =
    !!current?.id && current.id === productCurrentVersionId;
  /* The current (live) version is itself published, so "another published
   * version exists" reduces to count > 1 — pagination-proof. */
  const hasOtherPublished = isUnpublishingCurrent && publishedCount > 1;
  const positionLabel = creatingNew
    ? `${displayTotal} / ${displayTotal} (${i18n.t('new')})`
    : // While parked, point at the entry being fetched, not the one behind it.
      awaitingNext
      ? `${loaded.length + 1} / ${displayTotal}`
      : `${index + 1} / ${displayTotal}`;

  return {
    form,
    bodyRef,
    pending,
    isDirty,
    current,
    total,
    index,
    creatingNew,
    awaitingNext,
    slideDir,
    displayTotal,
    positionLabel,
    goPrev,
    goNext,
    addNew,
    discardNew,
    saveAsDraft: () => saveVersionAs(MARKETPLACE_VERSION_STATUS.DRAFT),
    publish: () => saveVersionAs(MARKETPLACE_VERSION_STATUS.PUBLISHED),
    isPublished,
    canUnpublish,
    canSaveAsDraft,
    isUnpublishingCurrent,
    hasOtherPublished,
    confirmUnpublish,
    setConfirmUnpublish,
    runUnpublish,
  };
}

export type VersionFormModel = ReturnType<typeof useVersionForm>;
