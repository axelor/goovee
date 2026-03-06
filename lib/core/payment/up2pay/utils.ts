export function formatAmountForUp2pay(amount: string | number): string {
  return Math.round(Number(amount) * 100).toString();
}

export function join(params: object, encode: boolean = true) {
  return Object.entries(params)
    .map(([key, value]) => {
      return `${key}=${!encode ? value : encodeURIComponent(value)}`;
    })
    .join('&');
}

export function hasKeys(obj: Record<string, any>, keys: string[]): boolean {
  return keys.every(key => obj.hasOwnProperty(key));
}

export function clearUp2payParams(
  searchParams: URLSearchParams,
  params: readonly string[],
): string {
  const clean = new URLSearchParams(searchParams.toString());
  for (const key of params) {
    clean.delete(key);
  }
  return clean.toString();
}

export function getParamsWithoutSign(searchParams: string) {
  // Strip the leading '?' if present, then remove the sign param from the raw
  // query string without re-encoding, so the message matches what Up2Pay signed.
  const raw = searchParams.startsWith('?')
    ? searchParams.slice(1)
    : searchParams;
  return raw
    .split('&')
    .filter(part => !part.startsWith('sign='))
    .join('&');
}
