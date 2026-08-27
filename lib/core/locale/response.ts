import {NextResponse} from 'next/server';

// ---- CORE IMPORTS ---- //
import {findTranslations} from '@/locale/api';

export async function respondWithTranslations(
  request: Request,
  locale: string,
  tenantId?: string,
) {
  try {
    const {translations, hash} = await findTranslations(locale, tenantId);
    const etag = `"${hash}"`;

    /* NOTE: Caching handled by the service worker (StaleWhileRevalidate):
     * every load is served from cache and revalidated in the background.
     * Cache-Control: no-cache makes the browser HTTP cache revalidate that
     * background fetch with If-None-Match, so it costs a bodyless 304 unless
     * translations actually changed. */
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
