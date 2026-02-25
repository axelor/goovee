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

export function getParamsWithoutSign(searchParams: any) {
  const withoutsignparams = new URLSearchParams(searchParams);
  withoutsignparams.delete('sign');
  return withoutsignparams.toString();
}
