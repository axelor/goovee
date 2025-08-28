import {NextRequest, NextResponse} from 'next/server';
import {DEFAULT_TENANT} from '@/constants';
import type {TenantConfig} from '@/tenant';
import {getStoragePath} from '@/storage/index';

const CHECK_AUTH = false;

/**
 * Todo
 * GET configuration from tenant manager application
 */

const tenants: {[key: string]: TenantConfig} = [DEFAULT_TENANT].reduce(
  (tenants, id) => ({
    ...tenants,
    [id]: {
      db: {
        url: process.env.DATABASE_URL,
      },
      aos: {
        url: process.env.GOOVEE_PUBLIC_AOS_URL,
        storage: getStoragePath(),
        auth: {
          username: process.env.BASIC_AUTH_USERNAME,
          password: process.env.BASIC_AUTH_PASSWORD,
        },
      },
    },
  }),
  {},
);

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {tenant: string};
  },
) {
  const authHeader = req.headers.get('authorization');

  if (CHECK_AUTH && (!authHeader || !isValidAuthHeader(authHeader))) {
    const response = new NextResponse(
      JSON.stringify({message: 'Unauthorized'}),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
      },
    );
    return response;
  }

  const tenant = tenants[params.tenant];

  if (!tenant) {
    return new NextResponse('Bad request', {status: 400});
  }

  return NextResponse.json(tenant);
}

function isValidAuthHeader(authHeader: string): boolean {
  const [scheme, encodedCredentials] = authHeader.split(' ');

  if (scheme !== 'Basic') {
    return false;
  }

  const credentials = Buffer.from(encodedCredentials, 'base64').toString();
  const [username, password] = credentials.split(':');

  return (
    username === process.env.TENANT_MANAGER_BASIC_USERNAME &&
    password === process.env.TENANT_MANAGER_BASIC_PASSWORD
  );
}
