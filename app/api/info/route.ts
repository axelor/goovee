import {NextResponse} from 'next/server';
import pkg from '@/package.json';
import {manager} from '@/tenant';
import {APP_TITLE} from '@/constants';

export function GET() {
  return NextResponse.json({
    name: APP_TITLE,
    version: pkg?.version,
    date: new Date().toISOString(),
    tenancy: manager.getType(),
  });
}
