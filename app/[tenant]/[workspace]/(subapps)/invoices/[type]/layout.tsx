import {notFound} from 'next/navigation';

// ---- LOCAL IMPORTS ---- //

import {INVOICE_TAB_ITEMS} from '@/subapps/invoices/common/constants/invoices';

export default async function Layout({
  params,
  children,
}: {
  params: {
    type: string;
    tenant: string;
    workspace: string;
  };
  children: React.ReactNode;
}) {
  const {type} = params;

  if (!INVOICE_TAB_ITEMS.some(item => item.href === type)) {
    return notFound();
  }

  return <div>{children}</div>;
}
