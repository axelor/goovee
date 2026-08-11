'use client';

import {MdHome} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Link} from '@/ui/components/link';
import {i18n} from '@/locale';

// ---- LOCAL IMPORTS ---- //
import {useWorkspace} from './workspace-context';

/**
 * "Resource not found" page — Error404Split design (design_handoff_full,
 * artboard `error-404-split`). Rendered inside the workspace shell (royal
 * sidebar + header) with no active nav item. Sober split layout: white
 * background, oversized royal-pale "404" watermark bottom-right, left-aligned
 * content with a single "back home" CTA.
 */
export default function NotFound() {
  const {workspaceURI} = useWorkspace();

  return (
    <div className="relative flex flex-grow items-center justify-center overflow-hidden bg-white p-6 md:p-10">
      {/* Oversized watermark — decorative, non-interactive */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-5 select-none font-extrabold leading-none tracking-[-0.05em] text-royal-pale"
        style={{fontSize: 'clamp(200px, 40vw, 420px)'}}>
        404
      </span>

      <div className="relative flex w-full max-w-[900px] items-center gap-10">
        <div className="flex-1">
          <span className="mb-[18px] inline-block rounded-full bg-royal-pale px-3 py-[5px] text-xs font-extrabold uppercase tracking-[0.08em] text-royal">
            {i18n.t('Error 404')}
          </span>
          <h1 className="m-0 text-[34px] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink-900">
            {i18n.t('This page seems to be unreachable')}
          </h1>
          <p className="mt-3.5 max-w-[420px] text-[15.5px] leading-[1.6] text-ink-500">
            {i18n.t(
              'The link may be outdated or the resource has been moved. Head back to your workspace to continue.',
            )}
          </p>
          <div className="mt-7 flex gap-2.5">
            <Link
              href={workspaceURI}
              className="inline-flex items-center gap-2 rounded-[11px] bg-royal px-6 py-[13px] text-[14.5px] font-bold text-white shadow-[0_2px_10px_rgba(21,84,181,0.28)] transition-colors hover:bg-royal-dark">
              <MdHome className="size-[18px]" />
              {i18n.t('Return Home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
