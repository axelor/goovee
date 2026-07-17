import {Skeleton} from '@/ui/components/skeleton';

/**
 * Loading skeletons matching the redesigned quotations / orders / invoices:
 * - SplitViewListSkeleton: left list panel + right preview (list pages)
 * - RecordDetailSkeleton: editorial hero + two-column cards (detail pages)
 */

export function SplitViewListSkeleton() {
  return (
    <div className="bg-ink-25 flex-1 min-h-0">
      <div className="w-full max-w-[1280px] mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Left — list */}
          <aside className="bg-white rounded-xl border border-ink-100 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg mb-4" />
            <div className="flex flex-col gap-2">
              {Array.from({length: 6}).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg px-3 py-3 border border-ink-100">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right — preview */}
          <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-7">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-8 w-40" />
              </div>
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            <div className="bg-ink-25 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-3">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                    {i < 2 && <Skeleton className="h-0.5 flex-1" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {Array.from({length: 3}).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailCard({rows = 4}: {rows?: number}) {
  return (
    <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
      <Skeleton className="h-6 w-40 mb-5" />
      <div className="flex flex-col gap-3">
        {Array.from({length: rows}).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecordDetailSkeleton({
  variant = 'timeline',
}: {
  variant?: 'timeline' | 'document';
}) {
  return (
    <div className="bg-ink-25 min-h-full">
      {/* Hero */}
      <div className="border-b border-ink-100 px-8 pt-6 pb-10 bg-gradient-to-br from-royal-pale to-ink-25">
        <div className="max-w-[1100px] mx-auto">
          <Skeleton className="h-4 w-16 mb-6" />
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex flex-col gap-2 min-w-0">
              <Skeleton className="h-4 w-40 rounded-full" />
              <Skeleton className="h-11 w-56" />
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1100px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-7">
          <div className="flex flex-col gap-7">
            {variant === 'timeline' ? (
              <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
                <Skeleton className="h-6 w-40 mb-5" />
                <div className="flex flex-col gap-5">
                  {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="flex flex-col gap-1.5 pt-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              /* Document (invoice) — informations + PDF viewer */
              <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
                <Skeleton className="h-6 w-40 mb-5" />
                <div className="grid grid-cols-2 gap-4 mb-5">
                  {Array.from({length: 4}).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <Skeleton className="h-3 w-20 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-[420px] w-full rounded-lg" />
              </section>
            )}
            {/* Products / lines card */}
            <section className="bg-white rounded-xl border border-ink-100 shadow-xs p-6">
              <Skeleton className="h-6 w-32 mb-5" />
              <div className="flex flex-col gap-4">
                {Array.from({length: 3}).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-7">
            <DetailCard rows={3} />
            <DetailCard rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
