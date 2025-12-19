import {findTranslations} from '@/locale/api';
import {NextResponse} from 'next/server';

export async function GET(request: Request, props: {params: Promise<{tenant: string; code: string}>}) {
  const params = await props.params;
  const {code, tenant} = params;

  try {
    const translations = await findTranslations(code, tenant);

    return NextResponse.json(translations);
  } catch (err) {
    return NextResponse.json({});
  }
}
