import 'server-only';

import type {PaymentConfig} from '@/orm/workspace';
import type {Tenant} from '@/tenant';
import {PaymentOption} from '@/types';
import {getPaymentModeId, isPaymentOptionAvailable} from '@/utils/payment';
import {isHubPispOption, type HubPispOption} from './adapters/hubpisp';
import {listAdapters, paymentOptionFor} from './adapters/registry';
import {GATEWAY, type Gateway, type PaymentSource} from './domain/types';
import {getSourceHandler} from './sources/registry';

/** One button: a gateway, and for a gateway that comes in variants, which one. */
export type OfferedGateway = {
  gateway: Gateway;
  option?: HubPispOption;
};

/* The workspace lists the transfer types it accepts on its HUB PISP method,
 * comma-separated; none listed means the method is not offered. */
export function hubPispOptions(
  paymentOptions: PaymentConfig['paymentOptionSet'] | undefined,
): HubPispOption[] {
  const raw = (paymentOptions ?? []).find(
    option => option.typeSelect === PaymentOption.hubpisp,
  )?.transferTypeSelect;
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map(value => value.trim())
    .filter(isHubPispOption);
}

/**
 * The gateways a checkout may offer: accepted by the source, named by the
 * workspace's online payment methods and configured on the tenant. Computed
 * on the server, so the button component never reads tenant configuration.
 */
export async function offeredGateways({
  source,
  paymentOptions,
  tenant,
}: {
  source: PaymentSource;
  paymentOptions: PaymentConfig['paymentOptionSet'] | undefined;
  tenant: Tenant;
}): Promise<OfferedGateway[]> {
  const tenantConfig = tenant.config;
  const handler = getSourceHandler(source);
  /* A source with no fallback payment mode is not offered a method the
   * workspace maps to none; the server refuses it on press too. */
  const requirePaymentMode = !!handler.requiresPaymentMode;
  return listAdapters()
    .filter(adapter => {
      const option = paymentOptionFor(adapter.gateway);
      return (
        handler.gateways.includes(adapter.gateway) &&
        isPaymentOptionAvailable(paymentOptions, option) &&
        adapter.isConfigured(tenantConfig) &&
        (!requirePaymentMode || !!getPaymentModeId(paymentOptions, option))
      );
    })
    .flatMap((adapter): OfferedGateway[] => {
      if (adapter.gateway === GATEWAY.hubpisp) {
        return hubPispOptions(paymentOptions).map(option => ({
          gateway: adapter.gateway,
          option,
        }));
      }
      return [{gateway: adapter.gateway}];
    });
}
