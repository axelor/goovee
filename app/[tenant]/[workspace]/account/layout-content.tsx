'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/locale';
import {useSearchParams} from '@/ui/hooks';

// ---- LOCAL IMPORTS ---- //
import Menubar from './menubar';

export default function LayoutContent({
  children,
  isAdmin,
  companyName,
  role,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  companyName?: string;
  role?: string;
}) {
  const {searchParams} = useSearchParams();
  const quotation = searchParams.get('quotation') || '';
  const checkout = searchParams.get('checkout') || '';

  // Checkout / quotation address confirmation: full-width, no rail.
  if (quotation || checkout) {
    return (
      <div className="bg-ink-25 min-h-full">
        <div className="container py-8 space-y-6">
          {quotation && (
            <header>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
                {i18n.t('Account')}
              </p>
              <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
                {i18n.t(`Quotation number ${quotation}`)}
              </h1>
            </header>
          )}
          {checkout && (
            <header>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400 mb-1">
                {i18n.t('Account')}
              </p>
              <h1 className="text-3xl font-bold text-ink-900 tracking-[-0.01em]">
                {i18n.t('Confirm cart')}
              </h1>
            </header>
          )}
          <div className="overflow-auto flex flex-col gap-6">{children}</div>
        </div>
      </div>
    );
  }

  // Grouped lateral rail + capped content pane.
  // The portal window-scrolls (html/body aren't viewport-bounded), so the rail
  // is sticky. It pins at top-16 (just below the 64px global header) from the
  // first scrolled pixel — no glide, whether or not the header is fixed.
  return (
    <div className="bg-ink-25 min-h-full flex flex-col lg:flex-row lg:items-start">
      <div className="shrink-0 p-4 lg:p-6 lg:sticky lg:top-16 lg:self-start">
        <Menubar isAdmin={isAdmin} companyName={companyName} role={role} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-2 lg:px-6 lg:pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
