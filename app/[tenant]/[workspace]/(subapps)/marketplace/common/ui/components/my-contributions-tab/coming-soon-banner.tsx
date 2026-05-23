import {t} from '@/locale/server';
import {Construction} from 'lucide-react';

type Props = {
  /** Optional tab name shown in the body line ("Revenue", "Profile", …). */
  area?: string;
};

/* Heads-up banner shown on My contributions tabs whose UI is still
 * placeholder / mocked. Keeps the hardcoded demo content visible
 * underneath so the page doesn't look empty. */
export async function ComingSoonBanner({area}: Props) {
  const [titleLabel, bodyLabel, bodyWithAreaLabel] = await Promise.all([
    t('Coming soon'),
    t(
      'The numbers and activity below are placeholder data — the live wiring is still on the way.',
    ),
    t(
      'The {0} tab is still being built; what you see below is a preview of the layout.',
      area ?? '',
    ),
  ]);

  return (
    <div className="rounded-lg border border-palette-amber-light bg-palette-amber-light/40 p-4 flex items-start gap-3">
      <div className="rounded-md bg-palette-amber-light p-2 flex-shrink-0">
        <Construction className="h-4 w-4 text-palette-amber" />
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-sm text-foreground">
          {titleLabel}
        </div>
        <p className="text-xs text-muted-foreground">
          {area ? bodyWithAreaLabel : bodyLabel}
        </p>
      </div>
    </div>
  );
}
