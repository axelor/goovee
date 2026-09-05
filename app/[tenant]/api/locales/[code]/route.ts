// ---- CORE IMPORTS ---- //
import {respondWithTranslations} from '@/locale/response';

export async function GET(
  request: Request,
  props: {params: Promise<{tenant: string; code: string}>},
) {
  const params = await props.params;
  const {code, tenant} = params;
  // NOTE: No auth required since translations are needed for every visitor
  return respondWithTranslations(request, code, tenant);
}
