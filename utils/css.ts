import {twMerge} from 'tailwind-merge';
import {ColorPalette, Theme} from '@/types/theme';
import {type ClassValue, clsx} from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PALETTE_NAMES: ColorPalette[] = [
  'purple',
  'blue',
  'yellow',
  'orange',
  'pink',
  'indigo',
  'red',
  'lightblue',
  'cyan',
  'teal',
  'green',
  'lightgreen',
  'lime',
  'amber',
  'deeporange',
  'brown',
  'grey',
  'bluegrey',
  'black',
  'white',
  'deeppurple',
];

const MINT_STEPS = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const;

const INK_STEPS = [
  '0',
  '25',
  '50',
  '100',
  '150',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
] as const;

export function generateCSSVariableString(options: Theme) {
  const c = options?.colors ?? {};
  const palette = c.palette ?? {};
  const royal = c.royal ?? {};
  const mint = c.mint ?? {};
  const ink = c.ink ?? {};

  const vars: Record<string, string | undefined> = {
    '--background': c.background,
    '--foreground': c.foreground,
    '--card': c.card,
    '--card-foreground': c['card-foreground'],
    '--popover': c.popover,
    '--popover-foreground': c['popover-foreground'],
    '--primary': c.primary,
    '--primary-foreground': c['primary-foreground'],
    '--secondary': c.secondary,
    '--secondary-foreground': c['secondary-foreground'],
    '--muted': c.muted,
    '--muted-foreground': c['muted-foreground'],
    '--accent': c.accent,
    '--accent-foreground': c['accent-foreground'],
    '--destructive-light': c['destructive-light'],
    '--destructive': c.destructive,
    '--destructive-dark': c['destructive-dark'],
    '--destructive-foreground': c['destructive-foreground'],
    '--success-light': c['success-light'],
    '--success': c.success,
    '--success-dark': c['success-dark'],
    '--success-foreground': c['success-foreground'],
    '--gray': c.gray,
    '--gray-light': c['gray-light'],
    '--gray-dark': c['gray-dark'],
    '--gray-fog': c['gray-fog'],
    '--border': c.border,
    '--input': c.input,
    '--ring': c.ring,
    '--radius': options?.radius,
    // Redesign primary accent — sidebar, CTAs
    '--royal': royal.default,
    '--royal-dark': royal.dark,
    '--royal-light': royal.light,
    '--royal-pale': royal.pale,
    '--royal-border': royal.border,
  };

  // Palette (tag / category colors)
  for (const name of PALETTE_NAMES) {
    const p = palette[name];
    vars[`--palette-${name}`] = p?.default;
    vars[`--palette-${name}-light`] = p?.light;
    vars[`--palette-${name}-dark`] = p?.dark;
  }

  // Redesign semantic success accent
  for (const step of MINT_STEPS) {
    vars[`--mint-${step}`] = mint[step];
  }

  // Redesign neutral scale (text, surfaces, borders)
  for (const step of INK_STEPS) {
    vars[`--ink-${step}`] = ink[step];
  }

  /*
   * Only emit defined values. A legacy AOS CssTheme that predates the redesign
   * tokens (royal / mint / ink) simply omits them, so those keep the static
   * defaults from app/globals.css instead of being overwritten with
   * `undefined`. Same safety net for any partial legacy theme.
   */
  const body = Object.entries(vars)
    .filter(([, value]) => value != null && value !== '')
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n      ');

  return `
    :root {
      ${body}
    }
    `;
}
