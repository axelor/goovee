import {Construction} from 'lucide-react';

export async function ComingSoonBanner() {
  return (
    <div className="rounded-lg border border-palette-amber-light bg-palette-amber-light/40 p-4 flex items-start gap-3">
      <div className="rounded-md bg-palette-amber-light p-2 flex-shrink-0">
        <Construction className="h-4 w-4 text-palette-amber" />
      </div>
      <div className="space-y-1">
        <div className="font-semibold text-sm text-foreground">Coming soon</div>
        <p className="text-xs text-muted-foreground">
          Thes section is still being built; what you see below is a preview of
          the layout.
        </p>
      </div>
    </div>
  );
}
