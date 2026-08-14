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
    const {translations, hash, partial} = await findTranslations(code, tenant);

    /* A bundle missing the tenant's own translations is refused rather than
     * answered 200: the service worker holds this response and holds only a 200,
     * so answering one would replace a complete copy with the shipped wording
     * until a later load happened to succeed.
     *
     * The wording it fell back to travels in the body regardless. The page was
     * rendered from exactly these translations, and which shipped files stand in
     * for a tenant's own is a server-side rule; a client left to work it out
     * renders a different language from the server it is hydrating. */
    if (partial) {
      return NextResponse.json(translations, {
        status: 503,
        headers: {'Cache-Control': 'no-store'},
      });
    }

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
    console.error(
      `Could not build the ${code} translations for ${tenant}:`,
      err,
    );

    /* Answered as unavailable rather than as an empty set, which is a valid
     * bundle and would be held as one. */
    return new NextResponse(null, {
      status: 503,
      headers: {'Cache-Control': 'no-store'},
    });
  }
}
