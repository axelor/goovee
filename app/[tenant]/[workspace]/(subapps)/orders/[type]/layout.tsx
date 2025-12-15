import {notFound} from 'next/navigation';

// ---- LOCAL IMPORTS ---- //
import {ORDER_TAB_ITEMS} from '@/subapps/orders/common/constants/orders';
import {OrderType} from '@/subapps/orders/common/types/orders';

export default async function Layout({
  params,
  children,
}: {
  params: {
    type: OrderType;
    tenant: string;
    workspace: string;
  };
  children: React.ReactNode;
}) {
  const {type} = params;

  if (!ORDER_TAB_ITEMS.some(item => item.href === type)) {
    return notFound();
  }

  return <div>{children}</div>;
}
