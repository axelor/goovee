import {cn} from '@/utils/css';
import type {Maybe} from '@/types/util';

export type AddressLinesProps = {
  /* The address block as the record stores it. AOS derives this on save from
   * the country's address template, one AFNOR line per row followed by the
   * country, so it is already laid out for the reader and needs no composing
   * here. */
  formattedFullName: Maybe<string>;
  className?: string;
  /* Narrow containers pass `truncate` here; the default lets a long line wrap
   * rather than clipping the rest of the address out of sight. */
  lineClassName?: string;
};

/* A template leaves an empty row wherever its field is unset, so the blanks are
 * dropped rather than rendered as gaps. */
function toLines(formattedFullName: Maybe<string>): string[] {
  return (formattedFullName ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

/* The same block on one line, for cards and list rows that cannot give an
 * address several rows. */
export function formatAddressLine(formattedFullName: Maybe<string>): string {
  return toLines(formattedFullName).join(', ');
}

export function AddressLines({
  formattedFullName,
  className,
  lineClassName,
}: AddressLinesProps) {
  const lines = toLines(formattedFullName);

  if (!lines.length) return null;

  return (
    <div className={cn('text-[12.5px] leading-tight text-ink-700', className)}>
      {lines.map((line, index) => (
        <p key={index} className={cn('m-0', lineClassName)}>
          {line}
        </p>
      ))}
    </div>
  );
}
