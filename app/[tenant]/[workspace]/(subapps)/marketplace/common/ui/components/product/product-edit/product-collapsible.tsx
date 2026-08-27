import {i18n} from '@/locale';
import type {Currency} from '@/product/orm';
import type {Cloned} from '@/types/util';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/ui/components/accordion';
import {useFormContext, useFormState, useWatch} from 'react-hook-form';
import {MARKETPLACE_TYPE} from '../../../../constants/marketplace-types';
import type {
  ListCategory,
  ListLicense,
  MyProductForEdit,
} from '../../../../orm';
import type {CombinedEditValues} from './combined-validator';
import {ProductFields} from './product-fields';

const ITEM_VALUE = 'product';

type ProductCollapsibleProps = {
  expanded: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Cloned<ListCategory>[];
  licenses: Cloned<ListLicense>[];
  initial?: Cloned<MyProductForEdit>;
  listingCurrency: Cloned<Currency> | null;
  inAti: boolean;
};

/**
 * The collapsed-state summary (name · type · price) plus a dot flagging unsaved
 * product edits that are folded out of sight. Isolated as its own component —
 * and rendered only while collapsed — so its `useWatch`/`useFormState`
 * subscriptions do not sit in the parent, where they would re-render the
 * expanded fields on every keystroke.
 */
function ProductSummary({
  listingCurrency,
}: {
  listingCurrency: Cloned<Currency> | null;
}) {
  const {control} = useFormContext<CombinedEditValues>();
  const {dirtyFields} = useFormState({control});
  /* Any dirty key other than the two version arrays is a product-field edit. */
  const productDirty = Object.keys(dirtyFields).some(
    key => key !== 'versions' && key !== 'newVersions',
  );

  const name = useWatch({control, name: 'name'});
  const type = useWatch({control, name: 'marketplaceTypeSelect'});
  const price = useWatch({control, name: 'salePrice'});

  const typeLabel =
    type === MARKETPLACE_TYPE.APP ? i18n.t('App') : i18n.t('Skill');
  const symbol = listingCurrency?.symbol ?? '';
  const summary = [
    name || i18n.t('Untitled'),
    typeLabel,
    price != null ? `${symbol}${price}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <span className="truncate text-sm font-normal text-ink-500">
        {summary}
      </span>
      {productDirty && (
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-royal"
          title={i18n.t('Unsaved changes')}
          aria-label={i18n.t('Unsaved changes')}
        />
      )}
    </>
  );
}

/**
 * Dialog-only single-item accordion around `ProductFields` — the full-page
 * editor renders those fields directly, always open, so it needs none of this.
 * Collapsed it shows a summary
 * row (name · type · price) so the version surface stays the focus; expanding
 * animates open to the bare fields. A dirty dot flags product edits that are
 * currently hidden.
 */
export function ProductCollapsible({
  expanded,
  onOpenChange,
  categories,
  licenses,
  initial,
  listingCurrency,
  inAti,
}: ProductCollapsibleProps) {
  return (
    <Accordion
      type="single"
      collapsible
      value={expanded ? ITEM_VALUE : ''}
      onValueChange={value => onOpenChange(value === ITEM_VALUE)}
      className="rounded-xl border border-ink-100 bg-white shadow-sm">
      <AccordionItem value={ITEM_VALUE} className="border-none">
        <AccordionTrigger icon className="px-4 hover:no-underline">
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
            <h3 className="whitespace-nowrap text-base font-semibold text-ink-900">
              {i18n.t('Product details')}
            </h3>
            {/* Only mounted while collapsed, so its form subscriptions don't
                re-render ProductFields as the user types. */}
            {!expanded && <ProductSummary listingCurrency={listingCurrency} />}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6 pt-0">
          <ProductFields
            bare
            categories={categories}
            licenses={licenses}
            initial={initial}
            listingCurrency={listingCurrency}
            inAti={inAti}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
