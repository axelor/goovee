import {cn} from '@/utils/css';
import {type LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';

interface NoticeBannerProps {
  title: ReactNode;
  description?: ReactNode;
  icon: LucideIcon;
  /** Optional slot rendered alongside (bar) or below (card) the title. */
  children?: ReactNode;
  /**
   * - `card`: boxed amber notice with a stacked title/description (default).
   * - `bar`: full-bleed horizontal strip with everything on one line.
   */
  variant?: 'card' | 'bar';
  className?: string;
}

export function NoticeBanner({
  title,
  description,
  icon: Icon,
  children,
  variant = 'card',
  className,
}: NoticeBannerProps) {
  if (variant === 'bar') {
    return (
      <div
        className={cn(
          'border-y border-palette-amber/40 bg-palette-amber/10',
          className,
        )}>
        <div className="container flex items-center gap-2 py-2.5 text-sm">
          <Icon className="h-4 w-4 shrink-0 text-palette-amber" />
          <span className="font-medium text-foreground">{title}</span>
          {children}
          {description && (
            <span className="text-muted-foreground">{description}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-palette-amber-light bg-palette-amber-light/40 p-4 flex items-start gap-3',
        className,
      )}>
      <div className="rounded-md bg-palette-amber-light p-2 flex-shrink-0">
        <Icon className="h-4 w-4 text-palette-amber" />
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-sm text-foreground">{title}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
