'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/lib/core/locale';
import {formatDate} from '@/lib/core/locale/formatters';
import type {PendingHubPispContext} from '@/lib/core/payment/hubpisp/orm';

type HubPispPendingListProps = {
  pendingContexts: PendingHubPispContext[];
};

export function HubPispPendingList({pendingContexts}: HubPispPendingListProps) {
  return (
    <div className="rounded-md border-l-4 border-purple-400 bg-purple-50 p-4">
      <p className="text-sm font-medium text-purple-900">
        {i18n.t('Pending HUB PISP payments')}
      </p>

      <div className="mt-2 space-y-2">
        {pendingContexts.map(context => (
          <HubPispPendingItem key={context.contextId} context={context} />
        ))}
      </div>
    </div>
  );
}

function HubPispPendingItem({context}: {context: PendingHubPispContext}) {
  return (
    <div className="border border-purple-200 rounded bg-white bg-opacity-50 p-2">
      <div className="font-medium">{context.amount}</div>
      <div className="text-xs text-gray-500">
        {formatDate(context.initiatedDate, {dateFormat: 'YYYY-MM-DD'})}
      </div>
    </div>
  );
}
