import {manager} from '@/tenant';
import axios from 'axios';
import {NextResponse} from 'next/server';

export async function POST(request: Request, props: {params: Promise<{tenant: string}>}) {
  const params = await props.params;
  let tenant;

  return new NextResponse('Forbidden', {status: 403});
  try {
    tenant = await manager.getTenant(params.tenant);
  } catch (err) {}

  if (
    !(tenant?.config && tenant?.config?.aos?.url && tenant?.config?.aos?.auth)
  ) {
    return new NextResponse('Bad request', {status: 400});
  }

  const {model = 'com.axelor.dms.db.DMSFile', record} = await request.json();

  const {aos} = tenant.config;

  const res = await axios.post(
    `${aos.url}/ws/dms/download/batch`,
    {
      model,
      records: [record.id],
    },
    {
      auth: {
        username: aos.auth.username,
        password: aos.auth.password,
      },
    },
  );

  if (res.status === 200) {
    const {batchId, batchName} = await res.data;
    if (batchId || batchName) {
      return download(
        `${aos.url}/ws/dms/download/${batchId}?fileName=${batchName}`,
        batchName,
      );
    }
  }

  return new NextResponse('File not found', {status: 404});
}

export async function download(url: string, fileName?: string) {
  if (fileName && !url.startsWith('data:')) {
    const qs = new URLSearchParams({fileName}).toString();
    const sp = url.includes('?') ? '&' : '?';
    url = url + sp + qs;
  }

  const res = await axios.head(url);

  if (res.status === 404) {
    return new NextResponse('File not found', {status: 404});
  }

  return axios.get(url, {
    responseType: 'blob',
  });
}
