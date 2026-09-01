import type {Metadata} from 'next';
import {getSession} from '@/lib/core/auth';
import Content from './content';
import {t} from '@/locale/server';

import {resolveAuthTenantId} from '../common/tenant';
import {
  generateAuthMetadata,
  resolveAuthWorkspaceName,
} from '../common/workspace';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateAuthMetadata(props.searchParams);
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (session?.user) {
    return (
      <div className="container space-y-6 mt-8">
        <h1 className="text-[2rem] font-bold">{await t('Reset Password')}</h1>
        <div className="bg-white py-4 px-6">
          <p>
            {await t(
              'You are currently loggedin. Logout to reset your password.',
            )}
          </p>
        </div>
      </div>
    );
  }
  return (
    <Content
      tenantId={resolveAuthTenantId(await props.searchParams)}
      workspaceName={await resolveAuthWorkspaceName(props.searchParams)}
    />
  );
}
