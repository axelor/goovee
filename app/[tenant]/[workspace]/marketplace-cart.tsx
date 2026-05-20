'use client';

import Link from 'next/link';
import {MdOutlineShoppingCart} from 'react-icons/md';

import {Badge} from '@/ui/components';
import {SUBAPP_CODES} from '@/constants';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {useMarketplaceCart} from '@/app/[tenant]/[workspace]/(subapps)/marketplace/common/hooks/use-marketplace-cart';

import styles from './styles.module.scss';

const MAX_COUNT_DISPLAY = 99;

export default function MarketplaceCart() {
  const {workspaceURI, workspaceURL} = useWorkspace();
  const {cart} = useMarketplaceCart(workspaceURL);
  const count = cart.items.length;

  return (
    <Link
      href={`${workspaceURI}/${SUBAPP_CODES.marketplace}/cart`}
      className="flex relative">
      <MdOutlineShoppingCart className="cursor-pointer text-foreground text-2xl" />
      {count ? (
        <Badge className={`${styles.badge} rounded bg-primary px-2`}>
          {count > MAX_COUNT_DISPLAY ? `${MAX_COUNT_DISPLAY}+` : count}
        </Badge>
      ) : null}
    </Link>
  );
}
