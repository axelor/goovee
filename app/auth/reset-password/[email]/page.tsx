import type {Metadata} from 'next';

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
  return (
    <Content
      params={props.params}
      tenantId={resolveAuthTenantId(await props.searchParams)}
      workspaceName={await resolveAuthWorkspaceName(props.searchParams)}
    />
  );
}
