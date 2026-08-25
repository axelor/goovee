'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import type {ProductSearchResult} from '../../../../orm';
import {ProductIcon} from '../product-icon';
import {ProductTypeBadge} from '../product-type-badge';

/* Kept byte-identical with the forum and news search-item highlights, so a
 * change here needs the same change in both. Index-based rather than a regex, so
 * a query containing regex metacharacters needs no escaping, and the original
 * casing survives a case-insensitive match. */
function highlight(text: string, query?: string) {
  const t = text || '';
  const q = (query || '').trim();
  if (!q) return t;
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return t;
  return (
    <>
      {t.slice(0, i)}
      <mark className="bg-[#fff1c2] text-inherit rounded-[2px] p-0">
        {t.slice(i, i + q.length)}
      </mark>
      {t.slice(i + q.length)}
    </>
  );
}

/* The description column is unbounded, so a match near its end would be clipped
 * away by the single-line truncation — the very case that makes a result look
 * unrelated. Keep LEAD characters of lead-in before the match and drop
 * everything earlier; the tail is left to the CSS truncation. */
const LEAD = 24;

function snippet(text: string, query?: string) {
  const t = (text || '')
    .replace(/<\/?[a-zA-Z][^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const q = (query || '').trim();
  if (!q) return t;
  const i = t.toLowerCase().indexOf(q.toLowerCase());
  if (i <= LEAD) return t;
  // prefer a word boundary near the cut so the snippet rarely opens mid-word
  const space = t.indexOf(' ', i - LEAD);
  const from = space === -1 || space >= i ? i - LEAD : space + 1;
  return `…${t.slice(from)}`;
}

export function SearchItem({
  result,
  query,
}: {
  result: ProductSearchResult;
  query?: string;
}) {
  const {name, description, iconCode, marketplaceTypeSelect} = result;
  const text = snippet(description ?? '', query);

  return (
    <div className="flex w-full items-center gap-3 min-w-0">
      <div className="w-8 h-8 shrink-0 rounded-md bg-ink-50 flex items-center justify-center">
        <ProductIcon code={iconCode} className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink-900 leading-snug truncate">
          {highlight(name ?? '', query)}
        </div>
        {text && (
          <div className="text-[11px] text-ink-500 leading-snug truncate mt-0.5">
            {highlight(text, query)}
          </div>
        )}
      </div>
      {marketplaceTypeSelect && (
        <ProductTypeBadge
          type={marketplaceTypeSelect}
          label={i18n.tattr(marketplaceTypeSelect)}
          className="shrink-0"
        />
      )}
    </div>
  );
}

export default SearchItem;
