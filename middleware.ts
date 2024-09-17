import {NextRequest, NextResponse} from 'next/server';
import {getToken} from 'next-auth/jwt';
import {i18n} from '@/i18n';

export const TENANT_HEADER = 'x-tenant-id';
export const WORKSPACE_HEADER = 'x-workspace-id';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     * 5. all files inside /public/images
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+|images/).*)',
  ],
};

export function extractTenant(url: string) {
  const pattern = /^\/([a-zA-Z]+)(?:\/.*)?$/;
  const matches = url.match(pattern);

  return matches ? matches[1] : null;
}

function notFound(req: NextRequest, {message = ''}: {message?: string} = {}) {
  const searchParams = message ? `message=${encodeURIComponent(message)}` : '';

  return NextResponse.rewrite(
    new URL(`/not-found${searchParams ? `?${searchParams}` : ''}`, req.url),
  );
}

const isMultiTenancy = process.env.MULTI_TENANCY === 'true';

export default async function middleware(req: NextRequest) {
  if (!isMultiTenancy) {
    return NextResponse.next();
  }

  const url = req.nextUrl;
  const pathname = url.pathname;

  if (pathname.startsWith('/auth') || pathname === '/') {
    return NextResponse.next();
  }

  const tenant = extractTenant(pathname);

  if (!tenant) return notFound(req);

  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET});
  const tenantMismatch = token && token.tenantId && token.tenantId !== tenant;

  if (tenantMismatch)
    return notFound(req, {
      message: i18n.get(
        'You are already loggedin to a tenant. For accessing different tenant, you need to logout first.',
      ),
    });

  const headers = new Headers(req.headers);
  headers.set(TENANT_HEADER, tenant);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}
