import type {Metadata} from 'next';
import {notFound} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {getSignInMethods} from '@/auth/sign-in-methods';
import {getTenantConfig} from '@/tenant/config';

// ---- LOCAL IMPORTS ---- //
import {resolveAuthTenantId} from '../../common/tenant';
import {
  generateAuthMetadata,
  resolveAuthWorkspaceName,
} from '../../common/workspace';
import Content from './content';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateAuthMetadata(props.searchParams);
}

/** Server shell: the form itself is a client component, so it cannot carry
 * `generateMetadata` and name the tab after the workspace. */
export default async function Page(props: {
  params: Promise<{email: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenantId = await resolveAuthTenantId();
  if (!getSignInMethods(getTenantConfig(tenantId)).password) notFound();

  return (
    <Content
      params={props.params}
      workspaceName={await resolveAuthWorkspaceName(props.searchParams)}
    />
  );
}
