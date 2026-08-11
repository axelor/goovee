// Group records carry no color or emoji — derive a stable pastille color from
// the group name out of the safelisted Axelor palette (see tailwind.config.js).
// Kept out of `common/utils/index.ts`: that barrel is server-only.
const PASTILLE_COLORS = [
  'palette-indigo',
  'palette-blue',
  'palette-purple',
  'palette-teal',
  'palette-cyan',
  'palette-green',
  'palette-orange',
  'palette-pink',
  'palette-red',
  'palette-deeppurple',
];

export function groupColorClass(name = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `bg-${PASTILLE_COLORS[hash % PASTILLE_COLORS.length]}`;
}
