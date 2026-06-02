/* The cover-style presets a publisher can pick. The tuple backs the zod enum
 * in the product form; GRADIENT_MAP resolves a persisted code to its
 * gradient classes. */
export const COVER_STYLES = [
  'gradient-1',
  'gradient-2',
  'gradient-3',
  'gradient-4',
  'gradient-5',
  'gradient-6',
  'gradient-7',
  'gradient-8',
  'gradient-9',
  'gradient-10',
] as const;

export type CoverStyle = (typeof COVER_STYLES)[number];

/* Typed Record<string, string> on purpose: callers index it with raw DB
 * strings (`GRADIENT_MAP[coverStyle || 'gradient-1']`); `satisfies` keeps
 * the keys in lockstep with COVER_STYLES. */
export const GRADIENT_MAP: Record<string, string> = {
  'gradient-1': 'from-[#f6f1ff] to-[#dccdff]',
  'gradient-2': 'from-[#ffe6bf] to-[#ffa114]',
  'gradient-3': 'from-[#d0eedd] to-[#4fc179]',
  'gradient-4': 'from-[#d0e7ff] to-[#2d60c4]',
  'gradient-5': 'from-[#fbd0e1] to-[#f26da0]',
  'gradient-6': 'from-[#e5e0ff] to-[#a78bfa]',
  'gradient-7': 'from-[#fbc6c4] to-[#f14e46]',
  'gradient-8': 'from-[#eaf8fb] to-[#89cff0]',
  'gradient-9': 'from-[#e3daf1] to-[#643b9f]',
  'gradient-10': 'from-[#dff7f8] to-[#8ff4d8]',
} satisfies Record<CoverStyle, string>;

export const DEFAULT_GRADIENT = GRADIENT_MAP['gradient-1'];
