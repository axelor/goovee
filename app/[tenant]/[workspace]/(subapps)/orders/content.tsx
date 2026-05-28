'use client';

import {useRouter} from 'next/navigation';

// ---- CORE IMPORTS ---- //
import {Container, NavView, TableList} from '@/ui/components';
import {i18n} from '@/locale';
import {SUBAPP_CODES, URL_PARAMS} from '@/constants';
import {useSortBy} from '@/ui/hooks';
import {useWorkspace} from '@/app/[tenant]/[workspace]/workspace-context';
import type {PageInfo} from '@/types';

// ---- LOCAL IMPORTS ---- //
import {ORDER_TAB_ITEMS} from '@/subapps/orders/common/constants/orders';
import {OrderColumns} from '@/subapps/orders/common/ui/components';
import type {Order} from '@/subapps/orders/common/types/orders';

type ContentProps = {
  orders: Order[];
  pageInfo?: PageInfo;
  orderType: string;
};

const Content = ({orders, pageInfo, orderType}: ContentProps) => {
  const router = useRouter();
  const {workspaceURI} = useWorkspace();

  const [sortedOrders, ordersSortOrder, toggleOrdersSortOrder] =
    useSortBy(orders);

  const handleTabChange = (e: {href: string}) => {
    router.push(`${workspaceURI}/${SUBAPP_CODES.orders}?type=${e.href}`);
  };

  const handleClick = (order: Order) =>
    router.push(`${workspaceURI}/${SUBAPP_CODES.orders}/${order.id}`);

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
