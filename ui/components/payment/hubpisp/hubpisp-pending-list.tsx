'use client';

// ---- CORE IMPORTS ---- //
import {i18n} from '@/lib/core/locale';
import {formatDate} from '@/lib/core/locale/formatters';
import {
  HUBPISP_LOCAL_INSTRUMENT,
  type HubPispLocalInstrument,
} from '@/lib/core/payment/hubpisp/constants';
import type {PendingHubPispContext} from '@/lib/core/payment/hubpisp/orm';

const BADGE_CLASS: Record<HubPispLocalInstrument, string> = {
  [HUBPISP_LOCAL_INSTRUMENT.INST]: 'bg-blue-100 text-blue-700',
  [HUBPISP_LOCAL_INSTRUMENT.SCT]: 'bg-green-100 text-green-700',
};

const BADGE_LABEL: Record<HubPispLocalInstrument, string> = {
  [HUBPISP_LOCAL_INSTRUMENT.INST]: 'SCTInst',
  [HUBPISP_LOCAL_INSTRUMENT.SCT]: 'SCT',
};

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
          <div
            key={context.contextId}
            className="rounded border border-purple-200 bg-white bg-opacity-50">
            <div className="flex items-center justify-between p-2">
              <div>
                <div className="font-medium">{context.amount}</div>
                <div className="text-xs text-gray-500">
                  {formatDate(context.initiatedDate, {
                    dateFormat: 'YYYY-MM-DD',
                  })}
                </div>
              </div>
              {context.localInstrument && (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${BADGE_CLASS[context.localInstrument]}`}>
                  {BADGE_LABEL[context.localInstrument]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
