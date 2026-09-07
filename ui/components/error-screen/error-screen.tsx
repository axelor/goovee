'use client';

import type {ReactNode} from 'react';

// ---- CORE IMPORTS ---- //
import {Link} from '@/ui/components/link';
import {cn} from '@/utils/css';

/**
 * The look every "this address leads nowhere" screen shares.
 *
 * Presentational only. Each boundary supplies its own words and its own way
 * back, because what "back" means differs by how much of the address still
 * resolved — the deployment, the tenant, or the workspace.
 */
export function ErrorScreen({
  watermark,
  badge,
  heading,
  description,
  action,
  standalone = false,
}: {
  /** Drawn behind the text, and cropped by design. Kept short: two or three glyphs. */
  watermark: string;
  badge: string;
  heading: string;
  description: string;
  action: {href: string; label: string; icon?: ReactNode};
  /** Whether this screen is the whole page. Inside the workspace shell it is one
   * pane of a column that already fills the viewport, so it grows to fill what
   * is left; rendered on its own — above the workspace, where there is no such
   * column — nothing gives it a height and it would collapse to the height of
   * its text. */
  standalone?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-white p-6 md:p-10',
        standalone ? 'min-h-screen' : 'flex-grow',
      )}>
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-5 select-none font-extrabold leading-none tracking-[-0.05em] text-royal-pale"
        style={{fontSize: 'clamp(200px, 40vw, 420px)'}}>
        {watermark}
      </span>

      <div className="relative flex w-full max-w-[900px] items-center gap-10">
        <div className="flex-1">
          <span className="mb-[18px] inline-block rounded-full bg-royal-pale px-3 py-[5px] text-xs font-extrabold uppercase tracking-[0.08em] text-royal">
            {badge}
          </span>
          <h1 className="m-0 text-[34px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink-900">
            {heading}
          </h1>
          <p className="mt-3.5 max-w-[420px] text-[15.5px] leading-[1.6] text-ink-500">
            {description}
          </p>
          <div className="mt-7 flex gap-2.5">
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 rounded-[11px] bg-royal px-6 py-[13px] text-[14.5px] font-bold text-white shadow-[0_2px_10px_rgba(21,84,181,0.28)] transition-colors hover:bg-royal-dark">
              {action.icon}
              {action.label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
