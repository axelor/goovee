import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {i18n} from '@/locale';
import {useStagedUpload} from '@/lib/core/upload/use-staged-upload';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import {packIntoFormData} from '@/utils/formdata';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import {useFieldArray, useForm, type FieldPath} from 'react-hook-form';
import {
  loadProductVersions,
  saveProductWithVersions,
} from '../../../../actions';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import {MARKETPLACE_VERSION_STATUS} from '../../../../constants/statuses';
import type {MyProductForEdit, MyProductVersion} from '../../../../orm';
import {formatVersionNumber} from '../../../../utils/version-number';
import {
  VERSIONS_PAGE_SIZE,
  VERSIONS_PREFETCH_AHEAD,
} from '../../versions/version-form/validator';
import {buildProductDefaults} from '../product-form/product-defaults';
import {
  combinedEditSchema,
  type CombinedEditValues,
  type VersionRowValues,
} from './combined-validator';

type ExistingVersion = Cloned<MyProductVersion>;
type VersionStatus = VersionRowValues['statusSelect'];

/**
 * Read-only context for a loaded version, kept *outside* the RHF form (it's
 * never edited or sent to the server): the real persisted lifecycle status
 * (drives the legal status transitions + "current state" label) and the
 * existing bundle (drives the dropzone's current-file display). Indexed
 * alongside the loaded rows; new rows have none.
 */
export type VersionMeta = {
  originalStatus: string;
  bundle?: {id: string; fileName?: string; sizeText?: string};
};

function versionToMeta(version: ExistingVersion): VersionMeta {
  return {
    originalStatus: version.statusSelect ?? MARKETPLACE_VERSION_STATUS.DRAFT,
    bundle: version.bundleFile?.id
      ? {
          id: version.bundleFile.id,
          fileName: version.bundleFile.fileName ?? undefined,
          sizeText: version.bundleFile.sizeText ?? undefined,
        }
      : undefined,
  };
}

/* Loaded version → editable row. `statusSelect` is the editable *intent* (only
 * draft/published/unpublished); it's seeded to the value that means "no change"
 * for the version's real status, so an untouched row keeps its state:
 *   published → published, unpublished → unpublished, draft → draft,
 *   in_review → published (re-saving keeps it in review under the review policy),
 *   rejected → draft (a rejected version edits down to a draft).
 * The real persisted status / bundle live in `VersionMeta`, not the row. */
function versionToRow(version: ExistingVersion): VersionRowValues {
  const statusSelect: VersionStatus =
    version.statusSelect === MARKETPLACE_VERSION_STATUS.PUBLISHED ||
    version.statusSelect === MARKETPLACE_VERSION_STATUS.IN_REVIEW
      ? MARKETPLACE_VERSION_STATUS.PUBLISHED
      : version.statusSelect === MARKETPLACE_VERSION_STATUS.UNPUBLISHED
        ? MARKETPLACE_VERSION_STATUS.UNPUBLISHED
        : MARKETPLACE_VERSION_STATUS.DRAFT;
  return {
    id: version.id,
    version: version.version ?? undefined,
    versionNumber: formatVersionNumber(version),
    changelog: version.changelog ?? '',
    statusSelect,
    compatibilitySetIds: (version.compatibilitySet ?? []).map(
      compatibility => compatibility.id,
    ),
  };
}

const blankVersionRow = (): VersionRowValues => ({
  versionNumber: '',
  changelog: '',
  statusSelect: MARKETPLACE_VERSION_STATUS.DRAFT,
  compatibilitySetIds: [],
});

type UseProductEditFormParams = {
  /** The product being edited; undefined in create mode. */
  initial?: Cloned<MyProductForEdit>;
  /** Fixed product type for create mode (the dialog/route preselects it). */
  defaultType?: MARKETPLACE_TYPE;
  /** First page of existing versions (server-fetched in the route). */
  initialVersions: ExistingVersion[];
  initialTotal: number;
  workspaceURL: string;
  /** Called after a successful combined save — the page navigates to the
   *  contributions listing. */
  onSaved: () => void;
  /** Reports where the first validation error is on a failed save, so a host
   *  that hides part of the form (the dialog: collapsed product / one version
   *  at a time) can reveal it. The page shows everything at once and omits it. */
  onInvalidLocation?: (location: 'product' | 'version') => void;
};

/**
 * Combined full-page edit form: one RHF form holding the product fields plus
 * two version arrays — `versions` (loaded existing rows, grown a page at a time
 * via `append`) and `newVersions` (rows added this session). A cursor selects
 * which single version is shown. Save sends the product + the existing rows the
 * user actually edited + all new rows to `saveProductWithVersions` (one
 * transactional, upsert-only batch).
 */
export function useProductEditForm({
  initial,
  defaultType,
  initialVersions,
  initialTotal,
  workspaceURL,
  onSaved,
  onInvalidLocation,
}: UseProductEditFormParams) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();

  /* Staged uploads live here — the editor session — not in the leaf fields, so
   * an in-flight screenshot/bundle upload survives version navigation and the
   * dialog's product-collapse (both unmount the leaves, which would otherwise
   * abort the upload). Only opaque tokens land in the form; bytes never do. */
  const {tenant} = useWorkspace();
  const screenshotUpload = useStagedUpload({tenant});
  const bundleUpload = useStagedUpload({tenant});
  /* Each version row's in-flight bundle item, keyed by its stable field-array
   * id (rhfId), so the per-version dropzone re-finds its progress after the
   * remount on navigation. */
  const bundleItemByRow = useRef<Map<string, string>>(new Map());
  /* Object-URL previews for new screenshots: by token once staged, by upload
   * item id while still in flight. Held here so they outlive the dialog
   * collapse that unmounts ScreenshotsFormField. */
  const previewByToken = useRef<Map<string, string>>(new Map());
  const previewByItem = useRef<Map<string, string>>(new Map());

  /* Aggregate upload state — drives the Save button's disabled state and the
   * submit guard. */
  const uploadsBusy = screenshotUpload.isUploading || bundleUpload.isUploading;
  const uploadsHaveError =
    screenshotUpload.uploads.some(item => item.status === 'error') ||
    bundleUpload.uploads.some(item => item.status === 'error');

  /* Revoke every screenshot object URL when the editor session unmounts. The
   * maps outlive individual field mounts (the dialog collapse), so the leaf
   * field can't own this cleanup. */
  useEffect(
    () => () => {
      previewByToken.current.forEach(url => URL.revokeObjectURL(url));
      previewByItem.current.forEach(url => URL.revokeObjectURL(url));
    },
    [],
  );

  const productId = initial?.id ?? '';
  /* Product seed for the combined form's root values (blank in create mode,
   * with the type preselected). */
  const productBaseline = useMemo(
    () => buildProductDefaults(initial, defaultType),
    [initial, defaultType],
  );

  /* First page seeds the form; further pages are `append`-ed, then
   * `resetDefaultValues` advances the form's baseline to include them (see
   * `loadMore`) so RHF's own dirty tracking stays honest for a growing array. */
  const initialRows = useMemo(
    () => initialVersions.map(versionToRow),
    [initialVersions],
  );
  /* Server-truth snapshot of every loaded row, index-aligned with the
   * `versions` field array and grown on pagination. Two uses: it's the new
   * `versions` baseline handed to `resetDefaultValues`, and it carries each
   * row's loaded optimistic-lock counter, injected on save (the counter isn't
   * an editable field, so this is its authoritative value). */
  const serverRowsRef = useRef<VersionRowValues[]>(initialRows);
  /* Per-loaded-version read-only context, index-aligned with the `versions`
   * field array and grown in lockstep on pagination. Lives outside the form so
   * it's never validated, dirtied, or sent. */
  const [loadedMeta, setLoadedMeta] = useState<VersionMeta[]>(() =>
    initialVersions.map(versionToMeta),
  );
  const [total, setTotal] = useState(initialTotal);
  const [cursor, setCursor] = useState(0);
  /* True only while a *parked* "next" waits for the next page (prefetch usually
   * loaded it already, so this is rare); drives the nav's loading affordance. */
  const [awaitingNext, setAwaitingNext] = useState(false);
  /* The in-flight next-page request, or null when idle — shared so a parked
   * "next" and a background prefetch await the same fetch, never double-load. */
  const loadingRef = useRef<Promise<boolean> | null>(null);

  const form = useForm<CombinedEditValues>({
    resolver: zodResolver(combinedEditSchema),
    defaultValues: {...productBaseline, versions: initialRows, newVersions: []},
    mode: 'onSubmit',
  });
  const {control, setValue, formState, handleSubmit, resetDefaultValues} = form;
  /* Read dirtyFields here, during render, so RHF's formState proxy actually
   * subscribes to and computes it — otherwise it stays empty and the
   * dirty-existing-rows filter at save time sends nothing. */
  const {dirtyFields} = formState;
  /* keyName defaults to "id", which would clash with our rows' own `id` — use a
   * distinct key so the DB id survives in the field-array values. */
  const versionsFA = useFieldArray({
    control,
    name: 'versions',
    keyName: 'rhfId',
  });
  const newVersionsFA = useFieldArray({
    control,
    name: 'newVersions',
    keyName: 'rhfId',
  });

  const loadedCount = versionsFA.fields.length;
  const newCount = newVersionsFA.fields.length;
  const totalShown = loadedCount + newCount;
  const hasMore = loadedCount < total;

  /* New (unsaved) versions occupy the front of the cursor space [0, newCount),
   * loaded existing rows follow at [newCount, totalShown). Keeping new rows at
   * the front gives them stable indices and leaves existing pagination growing
   * at the tail, so "load more" never collides with a new-version boundary. */
  const isNew = cursor < newCount;
  /* Field-path prefix for the version currently under the cursor. */
  const namePrefix = (
    isNew ? `newVersions.${cursor}` : `versions.${cursor - newCount}`
  ) as FieldPath<CombinedEditValues>;
  /* Stable identity (field-array rhfId) of the row under the cursor — keys its
   * bundle upload so live progress survives the per-version remount (namePrefix
   * is index-based and shifts as new rows are added/discarded). */
  const currentRowKey =
    (isNew
      ? newVersionsFA.fields[cursor]?.rhfId
      : versionsFA.fields[cursor - newCount]?.rhfId) ?? namePrefix;

  /* ---- pagination ---- */

  const loadMore = useCallback((): Promise<boolean> => {
    /* Dedupe: a parked "next" and a background prefetch share one request. */
    if (loadingRef.current) return loadingRef.current;
    if (versionsFA.fields.length >= total) return Promise.resolve(false);
    const request = (async () => {
      try {
        const result = await loadProductVersions({
          productId,
          workspaceURL,
          skip: versionsFA.fields.length,
          take: VERSIONS_PAGE_SIZE,
        });
        if (!result.success) {
          toast({variant: 'destructive', title: result.message});
          return false;
        }
        const next = result.data.versions.map(versionToRow);
        versionsFA.append(next);
        /* Fold the appended rows into the form's baseline: `resetDefaultValues`
         * recomputes dirty against the larger `defaultValues` without touching
         * current values, so appended rows read as pristine while edits already
         * made to earlier rows keep their value and stay dirty. An appended row
         * left out of the baseline would count as dirty and be re-written on save
         * (demoting a rejected version to draft). */
        const grownServerRows = [...serverRowsRef.current, ...next];
        serverRowsRef.current = grownServerRows;
        resetDefaultValues({
          ...productBaseline,
          versions: grownServerRows,
          newVersions: [],
        });
        setLoadedMeta(previous => [
          ...previous,
          ...result.data.versions.map(versionToMeta),
        ]);
        setTotal(result.data.total);
        return next.length > 0;
      } finally {
        loadingRef.current = null;
      }
    })();
    loadingRef.current = request;
    return request;
  }, [
    versionsFA,
    total,
    productId,
    workspaceURL,
    toast,
    resetDefaultValues,
    productBaseline,
  ]);

  /* Background-load the next page once only `VERSIONS_PREFETCH_AHEAD` loaded
   * entries remain ahead of `at`, so paging stays ahead of the user without a
   * blocking spinner. Deduped via loadMore's in-flight ref. */
  const prefetchAhead = useCallback(
    (at: number) => {
      if (!hasMore) return;
      if (totalShown - 1 - at <= VERSIONS_PREFETCH_AHEAD) void loadMore();
    },
    [hasMore, totalShown, loadMore],
  );

  /* ---- navigation ---- */

  const goPrev = useCallback(
    /* Wrap from the first entry to the last, but only once everything is loaded
     * — never jump to an unloaded tail. */
    () =>
      setCursor(prev => (prev > 0 ? prev - 1 : hasMore ? 0 : totalShown - 1)),
    [hasMore, totalShown],
  );

  const goNext = useCallback(() => {
    if (cursor < totalShown - 1) {
      const next = cursor + 1;
      setCursor(next);
      prefetchAhead(next);
      return;
    }
    /* On the last loaded entry with more pages remaining: park, pull the next
     * page, then step onto it. Prefetch has usually loaded it already, so this
     * rarely actually waits. */
    if (hasMore) {
      setAwaitingNext(true);
      loadMore()
        .then(appended => {
          if (appended) setCursor(cursor => cursor + 1);
        })
        .finally(() => setAwaitingNext(false));
      return;
    }
    /* Everything loaded, on the last entry — wrap to the first. */
    setCursor(0);
  }, [cursor, totalShown, hasMore, loadMore, prefetchAhead]);

  const addNew = useCallback(() => {
    /* New rows are at the front; the just-appended one is the last new row, so
     * its index is the pre-append new count. */
    newVersionsFA.append(blankVersionRow());
    setCursor(newVersionsFA.fields.length);
  }, [newVersionsFA]);

  const discardCurrentNew = useCallback(() => {
    if (!isNew) return;
    /* Drop this row's staged bundle too. Otherwise an in-flight or failed
     * upload lingers in the hook after the row is gone — a failed one would
     * keep `uploadsHaveError` true (Save stuck disabled) with no UI left to
     * clear it. */
    const itemId = bundleItemByRow.current.get(currentRowKey);
    if (itemId) bundleUpload.remove(itemId);
    bundleItemByRow.current.delete(currentRowKey);
    newVersionsFA.remove(cursor);
    setCursor(cursor => Math.max(0, cursor - 1));
  }, [isNew, cursor, currentRowKey, bundleUpload, newVersionsFA]);

  /* ---- status staging ---- */

  const setStatus = useCallback(
    (status: VersionStatus) => {
      setValue(
        `${namePrefix}.statusSelect` as FieldPath<CombinedEditValues>,
        status,
        {shouldDirty: true},
      );
    },
    [setValue, namePrefix],
  );

  /* ---- save ---- */

  const save = handleSubmit(
    values => {
      /* Tokens commit to the form only once their upload succeeds, so in-flight
       * or failed uploads are absent from `values` — guard here too (not just by
       * disabling Save) against a programmatic submit slipping through. */
      if (uploadsBusy) {
        toast({
          variant: 'destructive',
          title: i18n.t('Please wait for uploads to finish.'),
        });
        return;
      }
      if (uploadsHaveError) {
        toast({
          variant: 'destructive',
          title: i18n.t(
            'Some uploads failed. Remove or retry them, then save.',
          ),
        });
        return;
      }
      startTransition(async () => {
        try {
          /* Send only what changed (see `savePayloadSchema`):
           *  - `product`: on create, or when a product field is dirty. RHF's
           *    `dirtyFields` is the source — any dirty top-level key that isn't a
           *    version array or `images` is a product field. It carries the row's
           *    `version` lock and is omitted on a versions-only edit, so the
           *    product row (and its heavy `longDescription`) never goes over the
           *    wire.
           *  - `images`: only when the screenshot list changed — the full ordered
           *    list (positional), or `[]` when the user cleared them all.
           *  - `id`: always on edit, to scope ownership server-side.
           * Existing version rows stay upsert-only: only the dirty ones are sent,
           * each stamped with the lock counter the form was loaded with (not an
           * editable field, so the server snapshot is its source). */
          const {
            id,
            images,
            versions: existingRows,
            newVersions,
            ...productBlock
          } = values;
          const dirtyVersions = (dirtyFields.versions ?? []) as unknown[];
          const changedExisting = existingRows
            .map((row, index) => ({
              row,
              version: serverRowsRef.current[index]?.version,
              dirty: Boolean(dirtyVersions[index]),
            }))
            .filter(({dirty}) => dirty)
            .map(({row, version}) => ({...row, version}));
          const productChanged = Object.keys(dirtyFields).some(
            key =>
              key !== 'versions' && key !== 'newVersions' && key !== 'images',
          );
          const imagesChanged = ((dirtyFields.images ?? []) as unknown[]).some(
            Boolean,
          );
          const formData = packIntoFormData({
            id,
            ...(id == null || productChanged ? {product: productBlock} : {}),
            ...(imagesChanged ? {images} : {}),
            versions: changedExisting,
            newVersions,
            workspaceURL,
          });
          const result = await saveProductWithVersions(formData);
          if (!result.success) {
            toast({variant: 'destructive', title: result.message});
            return;
          }
          toast({variant: 'success', title: i18n.t('Saved')});
          onSaved();
        } catch {
          toast({
            variant: 'destructive',
            title: i18n.t('Failed to save. Please try again.'),
          });
        }
      });
    },
    errors => {
      /* Use the errors RHF passes in (the closed-over `formState.errors` is the
       * previous render's and is stale on the first failed submit). */
      const hasProductError = Object.keys(errors).some(
        key => key !== 'versions' && key !== 'newVersions',
      );
      if (hasProductError) {
        /* A product field is invalid — let the host reveal it (the dialog
         * expands the collapsed product) and don't yank the version cursor. */
        onInvalidLocation?.('product');
        return;
      }
      /* Otherwise the error is on a version the user can't see (only one shows
       * at a time) — move the cursor to the first invalid row and let the host
       * switch to the version view. */
      const vErrors = errors.versions as Record<number, unknown> | undefined;
      const nvErrors = errors.newVersions as
        | Record<number, unknown>
        | undefined;
      if (nvErrors) {
        /* New rows are at the front of the cursor space. */
        const firstInvalid = Object.keys(nvErrors)
          .map(Number)
          .sort((a, b) => a - b)[0];
        if (firstInvalid != null) setCursor(firstInvalid);
      } else if (vErrors) {
        /* Existing rows follow the new ones. */
        const firstInvalid = Object.keys(vErrors)
          .map(Number)
          .sort((a, b) => a - b)[0];
        if (firstInvalid != null) setCursor(newCount + firstInvalid);
      }
      onInvalidLocation?.('version');
    },
  );

  return {
    form,
    productId,
    pending,
    /* version navigator */
    namePrefix,
    currentRowKey,
    isNew,
    /* Read-only context for the version under the cursor (undefined for new
     * rows) — the status transitions and the existing-bundle display. */
    currentVersionMeta: isNew ? undefined : loadedMeta[cursor - newCount],
    /* `total` is the real count (existing versions + new rows this session),
     * not how many are currently loaded — pagination grows the loaded set on
     * demand, but the navigator should show the true total from the start. */
    position: {
      /* While parked at the frontier awaiting the next page, anticipate the
       * entry being fetched (the next slot) so the user lands on it with a
       * spinner instead of appearing stuck on the last loaded one. */
      current:
        totalShown === 0 ? 0 : awaitingNext ? totalShown + 1 : cursor + 1,
      total: total + newCount,
    },
    goPrev,
    goNext,
    /* Circular once fully loaded: prev wraps from the first to the last, next
     * wraps from the last to the first. While more pages remain, prev at the
     * first is disabled (can't wrap to an unloaded tail) and next keeps paging. */
    canPrev: cursor > 0 || (!hasMore && totalShown > 1),
    canNext: totalShown > 1 || hasMore,
    awaitingNext,
    addNew,
    discardCurrentNew,
    setStatus,
    save,
    /* staged uploads (lifted to the session) */
    screenshotStaging: {
      upload: screenshotUpload,
      previewByToken,
      previewByItem,
    },
    bundleUpload,
    bundleItemByRow,
    uploadsBusy,
    uploadsHaveError,
  };
}

export type ProductEditFormModel = ReturnType<typeof useProductEditForm>;
