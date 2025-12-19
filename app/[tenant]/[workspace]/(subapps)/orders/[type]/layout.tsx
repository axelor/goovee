import {notFound} from 'next/navigation';

// ---- LOCAL IMPORTS ---- //
import {ORDER_TAB_ITEMS} from '@/subapps/orders/common/constants/orders';
import {OrderType} from '@/subapps/orders/common/types/orders';

export default async function Layout(
  props: {
    params: Promise<{
      type: OrderType;
      tenant: string;
      workspace: string;
    }>;
    children: React.ReactNode;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const {type} = params;

  if (!ORDER_TAB_ITEMS.some(item => item.href === type)) {
    return notFound();
  }

  return <div>{children}</div>;
}
