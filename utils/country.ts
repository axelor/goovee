export function getCountryName(code: string) {
  const regionNames =
    typeof Intl !== 'undefined' && 'DisplayNames' in Intl
      ? new Intl.DisplayNames(['en'], {type: 'region'})
      : null;
  return regionNames?.of(code.toUpperCase()) || code;
}
