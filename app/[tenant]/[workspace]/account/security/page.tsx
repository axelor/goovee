import {redirect} from 'next/navigation';
import {workspacePathname} from '@/utils/workspace';

// Legacy consolidated route — superseded by the per-tab rail.
// Preserve quotation/checkout context when redirecting (used by the shop flow).
export default async function Page(props: {
  params: Promise<{tenant: string; workspace: string}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const {workspaceURI} = workspacePathname(params);

  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach(v => sp.append(key, v));
    else sp.append(key, value);
  }
  const query = sp.toString();

  // Address confirmation context belongs to the Addresses tab now.
  const hasAddressContext =
    searchParams?.checkout != null || searchParams?.quotation != null;
  const target = hasAddressContext ? 'addresses' : 'password';

  redirect(`${workspaceURI}/account/${target}${query ? `?${query}` : ''}`);
}
