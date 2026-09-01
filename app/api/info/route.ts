import {NextResponse} from 'next/server';
import pkg from '@/package.json';
import {manager} from '@/tenant';
import {APP_TITLE} from '@/constants';

export function GET() {
  return NextResponse.json({
    name: APP_TITLE,
    version: pkg?.version,
    date: new Date().toISOString(),
    /* The default tenant is public by definition: it serves the addresses that
     * name no tenant. Nothing else about the tenants goes here. The route is
     * ungated, and on a shared deployment a tenant id names a customer. */
    defaultTenant: manager.getDefaultTenantId(),
  });
}
