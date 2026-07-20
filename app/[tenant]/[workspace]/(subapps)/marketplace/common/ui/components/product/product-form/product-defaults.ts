import type {Cloned} from '@/types/util';
import {type CoverStyle} from '../../../../constants/gradients';
import {DEFAULT_ICON_CODE} from '../../../../constants/icons';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {MyProductForEdit} from '../../../../orm';
import {type ProductFormValues} from './validator';

/**
 * Seeds the product form's root values from a loaded product, or blank defaults
 * (with the type preselected) in create mode. Shared by the combined editor's
 * page and dialog hosts via `useProductEditForm`.
 */
export function buildProductDefaults(
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
      initial.categorySet
        ?.map(category => category?.id)
        .filter((id): id is string => !!id) ?? [],
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
