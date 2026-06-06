import {i18n} from '@/locale';
import type {Cloned} from '@/types/util';
import {useToast} from '@/ui/hooks';
import {packIntoFormData} from '@/utils/formdata';
import {zodResolver} from '@hookform/resolvers/zod';
import {useMemo, useRef, useTransition} from 'react';
import {useForm} from 'react-hook-form';
import {saveProduct} from '../../../../actions';
import {type CoverStyle} from '../../../../constants/gradients';
import {DEFAULT_ICON_CODE} from '../../../../constants/icons';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {MyProductForEdit} from '../../../../orm';
import {scrollToFirstError} from '../../../../utils/scroll-to-error';
import {productSchema, type ProductFormValues} from '../product-form/validator';

/** The data a successful `saveProduct` returns ({productId, version}). */
export type SaveProductData = Extract<
  Awaited<ReturnType<typeof saveProduct>>,
  {success: true}
>['data'];

function buildProductDefaults(
  initial: Cloned<MyProductForEdit> | undefined,
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
    /* Ordered by `sequence` at load (see findMyProductForEdit). Array
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

type UseProductFormParams = {
  /** Current snapshot — the form re-seeds (via `values`) whenever it changes. */
  initial: Cloned<MyProductForEdit> | undefined;
  defaultType: MARKETPLACE_TYPE | undefined;
  workspaceURL: string;
  /** Called after a successful save; the host advances the step and reloads the
   *  snapshot. This hook owns nothing beyond the form itself. */
  onSaved: (data: SaveProductData) => void;
};

/**
 * Self-contained product-step form: the RHF instance, its submit, and dirty
 * state. Knows nothing about the version step or the dialog flow — the host
 * orchestrates what happens after a save via `onSaved`.
 */
export function useProductForm({
  initial,
  defaultType,
  workspaceURL,
  onSaved,
}: UseProductFormParams) {
  const {toast} = useToast();
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);

  const defaults = useMemo(
    () => buildProductDefaults(initial, defaultType),
    [initial, defaultType],
  );
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    values: defaults,
    mode: 'onSubmit',
  });

  const save = form.handleSubmit(
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
          /* Settle the dirty check against what's now persisted; the new items
           * have no row ids until the reload, so drop them here. The host's
           * reload then re-syncs `values` to the canonical snapshot. */
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

  return {
    form,
    bodyRef,
    pending,
    isDirty: form.formState.isDirty,
    save,
  };
}

export type ProductFormModel = ReturnType<typeof useProductForm>;
