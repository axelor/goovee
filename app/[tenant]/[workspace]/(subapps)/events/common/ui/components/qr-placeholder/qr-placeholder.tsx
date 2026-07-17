import {cn} from '@/utils/css';

// Decorative QR placeholder — deterministic pattern for visual demo only.
// Not a real QR code; consumers should swap it for a real one when wiring
// up badge endpoints.
export function QRPlaceholder({
  size = 80,
  muted = false,
  className,
}: {
  size?: number;
  muted?: boolean;
  className?: string;
}) {
  const cells: boolean[][] = [];
  let seed = 7;
  for (let y = 0; y < 9; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 9; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const isCornerArea =
        (y < 3 && x < 3) || (y < 3 && x > 5) || (y > 5 && x < 3);
      row.push(!isCornerArea && seed % 2 === 0);
    }
    cells.push(row);
  }
  const dotColor = muted ? '#5a6472' : '#0e1319';

  return (
    <div
      className={cn('bg-white border border-ink-150 rounded-lg p-1', className)}
      style={{width: size, height: size}}>
      <svg
        viewBox="0 0 90 90"
        width={size - 8}
        height={size - 8}
        aria-hidden
        className="block">
        {[
          [0, 0],
          [70, 0],
          [0, 70],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <rect x={cx} y={cy} width={20} height={20} fill={dotColor} />
            <rect x={cx + 4} y={cy + 4} width={12} height={12} fill="#fff" />
            <rect x={cx + 7} y={cy + 7} width={6} height={6} fill={dotColor} />
          </g>
        ))}
        {cells.flatMap((row, y) =>
          row.map((on, x) => {
            if (!on) return null;
            return (
              <rect
                key={`${x}-${y}`}
                x={x * 10}
                y={y * 10}
                width={9}
                height={9}
                fill={dotColor}
              />
            );
          }),
        )}
      </svg>
    </div>
  );
}
