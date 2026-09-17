/*
 * The schemes that address something without naming a host. Everything else
 * people type is either a full address, which carries `://`, or a bare
 * domain — and telling those two apart is all this needs to do, because a
 * host and port like `example.com:8080` otherwise reads as a scheme.
 */
const HOSTLESS_SCHEMES = ['mailto', 'tel', 'sms'];

const ADDRESSED = new RegExp(
  `^(?:[a-z][a-z0-9+.-]*://|(?:${HOSTLESS_SCHEMES.join('|')}):)`,
  'i',
);

export function withScheme(url: string) {
  return ADDRESSED.test(url) ? url : `http://${url}`;
}
