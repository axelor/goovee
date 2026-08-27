import type {Client} from '@/goovee/.generated/client';
import type {ID} from '@/types';
import {Button} from '@/ui/components';
import {Link} from '@/ui/components/link';
import {findPartnerInDirectory} from '../../../../orm';

interface PartnerProfileLinkProps {
  client: Client;
  partnerId: ID;
  href: string;
  /** Already translated by the caller. */
  label: string;
  className?: string;
}

/**
 * Links to a partner's Directory profile, or renders nothing when the
 * Directory does not list that partner. Mount it behind its own Suspense
 * boundary: the lookup it needs is unrelated to the rest of the page, so
 * nothing else has to wait for it.
 */
export async function PartnerProfileLink({
  client,
  partnerId,
  href,
  label,
  className,
}: PartnerProfileLinkProps) {
  const partner = await findPartnerInDirectory({client, partnerId});
  if (!partner) return null;

  return (
    <Button asChild variant="ink-outline" className={className}>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
