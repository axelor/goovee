// ---- CORE IMPORTS ---- //
import {cn} from '@/utils/css';

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-1', className)}>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-xl font-bold text-ink-900 tracking-[-0.015em]">
        {title}
      </h2>
      {description && <p className="text-sm text-ink-500">{description}</p>}
    </header>
  );
}

export default SectionHeader;
