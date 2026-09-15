import type {Metadata} from 'next';
import {AlertCircle, ArrowLeft} from 'lucide-react';

import {Button} from '@/ui/components/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import {Link} from '@/ui/components/link';

// ---- CORE IMPORTS ---- //
import {getPublicEnvironment} from '@/environment';
import {getTenantConfig} from '@/tenant/config';
import {isSameOrigin} from '@/utils/same-origin';
import {tenantURLs} from '@/url/scope';

// ---- LOCAL IMPORTS ---- //
import {firstValue, resolveAuthTenantId} from '../common/tenant';
import {generateAuthMetadata} from '../common/workspace';

export async function generateMetadata(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  return generateAuthMetadata(props.searchParams);
}

export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const error = firstValue(searchParams.error);
  const workspaceURI = firstValue(searchParams.workspaceURI);

  const tenantId = await resolveAuthTenantId();

  // Non-null: the tenant layout above refuses a segment naming no tenant.
  const host = getPublicEnvironment(getTenantConfig(tenantId))!.host;

  /* The address the button leads to arrives in the query string, so it is
   * whatever the link that opened this screen said. Rendered as given, the
   * portal's own error screen would carry a prominent button to anywhere at
   * all, so an address that is not on this tenant's own origin is refused.
   *
   * The fallback is this tenant's entry rather than the deployment's: on a
   * shared origin the deployment's resolves a tenant of its own and would send
   * the visitor to somebody else's. */
  const backHref =
    (workspaceURI && isSameOrigin(workspaceURI, host) && workspaceURI) ||
    tenantURLs(tenantId).forRouter('/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold break-words">
            {error}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p className="break-words">Error code: {error}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild variant="outline" className="w-full">
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspace
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
