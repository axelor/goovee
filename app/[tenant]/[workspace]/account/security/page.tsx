import {notFound, redirect} from 'next/navigation';

import {currentWorkspace} from '@/lib/core/url/current';

// Legacy consolidated route — superseded by the per-tab rail.
// Preserve quotation/checkout context when redirecting (used by the shop flow).
export default async function Page(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const url = await currentWorkspace();
  if (!url) notFound();

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

  redirect(url.forRouter(`/account/${target}${query ? `?${query}` : ''}`));
}
