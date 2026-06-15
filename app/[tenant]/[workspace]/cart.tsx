'use client';

import {MdOutlineShoppingCart} from 'react-icons/md';

// ---- CORE IMPORTS ---- //
import {Badge} from '@/ui/components';
import {useCart} from '@/app/[tenant]/[workspace]/cart-context';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import {Link} from '@/ui/components/link';

// ---- LOCAL IMPORTS ---- //
import styles from './styles.module.scss';

const MAX_COUNT_DISPLAY = 99;

export default function Cart() {
  const {cart} = useCart();
  const {workspaceURI} = useWorkspace();
  const count = cart?.items?.reduce(
    (count: number, i: any) => count + Number(i.quantity),
    0,
  );

  return (
    <Link href={`${workspaceURI}/shop/cart`} className="flex relative">
      <MdOutlineShoppingCart className="cursor-pointer text-foreground text-2xl" />
      {count ? (
        <Badge className={`${styles.badge} rounded bg-primary px-2`}>
          {count > MAX_COUNT_DISPLAY ? `${MAX_COUNT_DISPLAY}+` : count}
        </Badge>
      ) : null}
    </Link>
  );
}
