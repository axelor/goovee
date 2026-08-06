'use client';

import {Link} from '@/ui/components/link';
import {usePathname} from 'next/navigation';

import {cn} from '@/utils/css';

export type EventsTabT2Key = 'all' | 'mine';

export interface EventsTabsT2Props {
  allHref: string;
  mineHref: string;
  allLabel: string;
  mineLabel: string;
  registeredCount?: number;
  className?: string;
}

export function EventsTabsT2({
  allHref,
  mineHref,
  allLabel,
  mineLabel,
  registeredCount,
  className,
}: EventsTabsT2Props) {
  const pathname = usePathname() ?? '';
  const active: EventsTabT2Key =
    pathname.includes('/my-registrations') ||
    pathname.includes('/register/confirmation')
      ? 'mine'
      : 'all';

  const tabs = [
    {key: 'all' as const, label: allLabel, href: allHref, badge: undefined},
    {
      key: 'mine' as const,
      label: mineLabel,
      href: mineHref,
      badge: registeredCount,
    },
  ];

  return (
    <nav className={cn('flex gap-8', className)}>
      {tabs.map(tab => {
        const isActive = active === tab.key;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={cn(
              'py-4 text-sm font-semibold border-b-2 -mb-px transition-colors',
              isActive
                ? 'border-royal text-ink-900'
                : 'border-transparent text-ink-500 hover:text-ink-700',
            )}>
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={cn(
                  'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] tabular-nums',
                  isActive ? 'bg-royal text-white' : 'bg-ink-100 text-ink-600',
                )}>
                {tab.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
