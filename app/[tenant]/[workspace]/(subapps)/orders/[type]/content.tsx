'use client';

import React from 'react';
import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Container, NavView, TableList} from '@/ui/components';
import {i18n} from '@/locale';
import {SUBAPP_CODES, URL_PARAMS} from '@/constants';
import {useSortBy} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';

// ---- LOCAL IMPORTS ---- //
import {ORDER_TAB_ITEMS} from '@/subapps/orders/common/constants/orders';
import {OrderColumns} from '@/subapps/orders/common/ui/components';

type ContentProps = {
  orders: [];
  pageInfo?: any;
  orderType: string;
};

const Content = ({orders, pageInfo, orderType}: ContentProps) => {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const [sortedOrders, ordersSortOrder, toggleOrdersSortOrder] =
    useSortBy(orders);

  const handleTabChange = (e: any) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.orders}/${e.href}`);
  };

  const handleClick = (order: any) =>
    router.push(
      `${workspaceURI}/${SUBAPP_CODES.orders}/${orderType}/${order.id}`,
    );

  return (
    <Container title={i18n.t('Orders')}>
      <NavView
        items={ORDER_TAB_ITEMS}
        activeTab={ORDER_TAB_ITEMS.find(item => item.href === orderType)!.id}
        onTabChange={handleTabChange}>
        <div className="flex flex-col gap-4">
          <TableList
            columns={OrderColumns}
            rows={sortedOrders}
            sort={ordersSortOrder}
            onSort={toggleOrdersSortOrder}
            onRowClick={handleClick}
            pageInfo={pageInfo}
            pageParamKey={URL_PARAMS.page}
          />
        </div>
      </NavView>
    </Container>
  );
};
export default Content;
