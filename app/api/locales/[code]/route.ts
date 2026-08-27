// ---- CORE IMPORTS ---- //
import {respondWithTranslations} from '@/locale/response';

/* Translations for the pages that carry no tenant in their address — the entry
 * page, the sign-in pages and the error pages. */
export async function GET(
  request: Request,
  props: {params: Promise<{code: string}>},
) {
  const params = await props.params;
  const {code} = params;
  // NOTE: No auth required since translations are needed for every visitor
  return respondWithTranslations(request, code);
}
