import {MAX_SCALE, MIN_SCALE} from '@/locale/contants';

export function translate(
  translations: Record<string, string | null | undefined>,
  text: string,
  ...interpolations: string[]
) {
  const key = text?.trim();
  let translation = translations[key] || key;

  interpolations?.forEach((interpolation: string, index) => {
    const placeholder = new RegExp(`\\{${index}\\}`, 'g');
    translation = translation.replace(placeholder, interpolation);
  });

  return translation;
}

export function getLocaleFromAcceptLanguage(
  languages: string | null,
): string | null {
  if (!languages) return null;

  return (
    languages
      .split(',')
      .map(
        (
          lang,
        ): {
          code: string;
          quality: number;
        } => {
          const [code, qValue] = lang.trim().split(';q=');
          return {
            code,
            quality: qValue ? parseFloat(qValue) : 1.0,
          };
        },
      )
      .sort((a, b) => b.quality - a.quality)[0]?.code || null
  );
}

export function transformLocale(locale: string) {
  return locale?.replaceAll('_', '-');
}

export function inverseTransformLocale(locale: string) {
  return locale?.replaceAll('-', '_');
}

export function findLocaleLanguage(locale: string) {
  return locale?.split('_')?.[0];
}

export function limitScale(value?: number) {
  if (value == null) {
    return value;
  }

  if (value < MIN_SCALE) {
    return MIN_SCALE;
  }

  if (value > MAX_SCALE) {
    return MAX_SCALE;
  }

  return value;
}

// const lang = l10n.getLocale().split(/-|_/)[0];
export function addCurrency(value: string, symbol: string, language: string) {
  if (value && symbol) {
    if (language === 'fr') {
      return value.endsWith(symbol) ? value : value + ' ' + symbol;
    }
    return value.startsWith(symbol) ? value : symbol + ' ' + value;
  }
  return value;
}
