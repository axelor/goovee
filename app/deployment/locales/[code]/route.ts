// ---- CORE IMPORTS ---- //
import {respondWithTranslations} from '@/locale/response';

/* Translations for the pages that carry no tenant in their address: the entry
 * page, and the not-found and unauthorized pages the deployment renders above
 * the tenant segment. Every other page names a tenant and asks that tenant's
 * own route, which answers with its translations rather than the deployment's. */
export async function GET(
  request: Request,
  props: {params: Promise<{code: string}>},
) {
  const params = await props.params;
  const {code} = params;
  // NOTE: No auth required since translations are needed for every visitor
  return respondWithTranslations(request, code);
}
