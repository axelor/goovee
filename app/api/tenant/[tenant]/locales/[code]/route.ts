import {findTranslations} from '@/locale/api';
import {NextResponse} from 'next/server';

/* NOTE: Caching handled by the service worker (StaleWhileRevalidate):
 * every load is served from cache and revalidated in the background.
 * Cache-Control: no-cache makes the browser HTTP cache revalidate that
 * background fetch with If-None-Match, so it costs a bodyless 304 unless
 * translations actually changed. */
export async function GET(
  request: Request,
  props: {params: Promise<{tenant: string; code: string}>},
) {
  const params = await props.params;
  const {code, tenant} = params;
  // NOTE: No auth required since translations are needed for every visitor
  try {
    const {translations, hash} = await findTranslations(code, tenant);
    const etag = `"${hash}"`;
    const headers = {ETag: etag, 'Cache-Control': 'no-cache'};

    /* Proxies may turn a strong ETag into a weak one (W/"...") when they
     * compress the response, so compare ignoring the weakness prefix. */
    const ifNoneMatch = request.headers.get('if-none-match');
    const matches = ifNoneMatch
      ?.split(',')
      .some(tag => tag.trim().replace(/^W\//, '') === etag);

    if (matches) {
      return new NextResponse(null, {status: 304, headers});
    }

    return NextResponse.json(translations, {headers});
  } catch (err) {
    return NextResponse.json({});
  }
}
