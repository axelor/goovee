import type {ColorPalette, Theme} from '@/types/theme';

export const DEFAULT_THEME_OPTIONS: Theme = {
  colors: {
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',

    card: '0 0% 100%',
    'card-foreground': '222.2 84% 4.9%',

    popover: '0 0% 100%',
    'popover-foreground': '222.2 84% 4.9%',

    primary: '222.2 47.4% 11.2%',
    'primary-foreground': '210 40% 98%',

    secondary: '237, 50%, 22%',
    'secondary-foreground': '0 0% 100',

    muted: '210 40% 96.1%',
    'muted-foreground': '215.4 16.3% 46.9%',

    accent: '210 40% 96.1%',
    'accent-foreground': '222.2 47.4% 11.2%',

    'destructive-light': '0 58% 90%',
    destructive: '0 84.2% 60.2%',
    'destructive-foreground': '210 40% 98%',
    'destructive-dark': '3 86% 61%',

    'success-light': '164 52% 94%',
    success: '153 60% 59%',
    'success-foreground': '210 40% 98%',
    'success-dark': '142 48% 37%',

    gray: '160 3% 82',
    'gray-light': '180 2% 90%',
    'gray-dark': '170 3% 36%',
    'gray-fog': '180, 11%, 98%',

    border: '214.3 31.8% 91.4%',
    input: '214.3 31.8% 91.4%',
    ring: '222.2 84% 4.9%',

    // Redesign primary accent — sidebar, CTAs (mirrors app/globals.css)
    royal: {
      default: '215 79% 40%',
      dark: '217 81% 30%',
      light: '211 100% 75%',
      pale: '213 73% 96%',
      border: '213 53% 86%',
    },

    // Redesign semantic success accent
    mint: {
      '50': '144 60% 96%',
      '100': '142 64% 90%',
      '200': '144 56% 79%',
      '300': '144 50% 66%',
      '400': '147 46% 53%',
      '500': '148 56% 41%',
      '600': '150 62% 32%',
      '700': '151 60% 26%',
      '800': '152 57% 21%',
      '900': '152 50% 16%',
    },

    // Redesign neutral scale — text, surfaces, borders
    ink: {
      '0': '0 0% 100%',
      '25': '210 14% 98%',
      '50': '210 13% 96%',
      '100': '214 14% 93%',
      '150': '213 14% 89%',
      '200': '213 14% 82%',
      '300': '215 12% 68%',
      '400': '215 9% 53%',
      '500': '217 12% 40%',
      '600': '217 14% 30%',
      '700': '217 16% 21%',
      '800': '213 21% 14%',
      '900': '216 28% 8%',
    },

    palette: {
      purple: {
        default: '261 100% 97%',
        light: '91 46% 83%',
        dark: '269 97% 35%',
      },
      blue: {
        default: '216 100% 91%',
        light: '207 89% 86%',
        dark: '220 63% 47%',
      },
      yellow: {
        default: '37 100% 87%',
        light: '54 100% 88%',
        dark: '36 100% 54%',
      },
      orange: {
        default: '16 100% 90%',
        light: '36 100% 75%',
        dark: '16 96% 56%',
      },
      pink: {
        default: '337 74% 91%',
        light: '340 82% 76%',
        dark: '335 100% 54%',
      },
      indigo: {
        default: '231 48% 48%',
        light: '231 44% 94',
        dark: '232 54% 41%',
      },
      red: {
        default: '4 90% 58%',
        light: '354 100% 90%',
        dark: '0 65% 51%',
      },
      lightblue: {
        default: '199 98% 48%',
        light: '187 71% 82%',
        dark: '201 98% 41%',
      },
      cyan: {
        default: '187 100% 42%',
        light: '187 72% 71%',
        dark: '185 100% 28%',
      },
      teal: {
        default: '174 100% 29%',
        light: '174 42% 65%',
        dark: '173 100% 24%',
      },
      green: {
        default: '122 39% 49%',
        light: '136 47% 87%',
        dark: '123 43% 39%',
      },
      lightgreen: {
        default: '88 50% 53%',
        light: '88 51% 86%',
        dark: '92 48% 42%',
      },
      lime: {
        default: '66 70% 54%',
        light: '66 71% 77%',
        dark: '74 55% 50%',
      },

      amber: {
        default: '45 100% 51%',
        light: '45 100% 75%',
        dark: '36 100% 50%',
      },
      deeporange: {
        default: '14 100% 57%',
        light: '14 100% 87%',
        dark: '14 80% 50%',
      },
      brown: {
        default: '16 25% 38%',
        light: '16 16% 81%',
        dark: '14 26% 29%',
      },
      grey: {
        default: '0 0% 62%',
        light: '0 0% 94%',
        dark: '0 0% 46%',
      },
      bluegrey: {
        default: '200 18% 46%',
        light: '200 15% 73%',
        dark: '199 18% 33%',
      },
      black: {default: '0 0% 0%', light: '0 0% 20%', dark: '0 0% 0%'},
      white: {
        default: '0 0% 100%',
        light: '0 0% 96%',
        dark: '0 0% 88%',
      },
      deeppurple: {
        default: '262 52% 47%',
        light: '261 46% 84%',
        dark: '258 58% 42%',
      },
    },
  },
  radius: '0.5rem',
};

export const PALETTE_COLORS: Record<ColorPalette, string> = {
  indigo: 'indigo',
  red: 'red',
  blue: 'blue',
  lightblue: 'lightblue',
  cyan: 'cyan',
  teal: 'teal',
  pink: 'pink',
  green: 'green',
  lightgreen: 'lightgreen',
  lime: 'lime',
  yellow: 'yellow',
  amber: 'amber',
  orange: 'orange',
  deeporange: 'deeporange',
  brown: 'brown',
  grey: 'grey',
  bluegrey: 'bluegrey',
  black: 'black',
  white: 'white',
  purple: 'purple',
  deeppurple: 'deeppurple',
};
