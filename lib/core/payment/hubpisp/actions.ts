import type {Tenant} from '@/tenant';
import {getTenantConfig} from '@/tenant/config';
import type {Client} from '@/goovee/.generated/client';
import {PaymentOption} from '@/types';
import {
  createPaymentContext,
  markPaymentAsFailed,
  updatePaymentContextData,
} from '../common/orm';
import {createPaymentLink} from '.';
import {HUBPISP_DEFAULT_EXPIRE_IN, HubPispLocalInstrument} from './constants';
import type {HubPispContextData, PageConsentInfo, PsuInfo} from './types';
import {scheduleLinkExpiryCheck} from './pollLink';

export async function createHubPispPaymentLink({
  amount,
  tenantId,
  client,
  email,
  context,
  currency,
  remittanceInformation,
  localInstrument,
  successfulReportUrl,
  unsuccessfulReportUrl,
  pageConsentInfo,
  psuInfo,
}: {
  amount: number;
  tenantId: Tenant['id'];
  client: Client;
  email: string;
  context: HubPispContextData;
  currency: string;
  remittanceInformation?: string;
  localInstrument?: HubPispLocalInstrument;
  successfulReportUrl?: string;
  unsuccessfulReportUrl?: string;
  pageConsentInfo?: PageConsentInfo;
  psuInfo?: PsuInfo;
}): Promise<{resourceId: string; consentHref: string; contextId: string}> {
  if (!currency || !email) {
    throw new Error('currency and email are required');
  }
  if (!amount || amount <= 0) {
    throw new Error('amount must be a positive number');
  }

  const {id: contextId, version} = await createPaymentContext({
    context,
    mode: PaymentOption.hubpisp,
    payer: email,
    client,
  });

  const endToEnd = `${contextId}-${tenantId}`;
  if (endToEnd.length > 35) {
    await markPaymentAsFailed({contextId, version, client});
    throw new Error(
      `endToEnd value exceeds 35 characters: "${endToEnd}" (${endToEnd.length} chars)`,
    );
  }

  let resourceId: string;
  let consentHref: string;
  try {
    const config = getTenantConfig(tenantId);

    if (!config) {
      throw new Error(`Tenant "${tenantId}" is not configured`);
    }

    ({resourceId, consentHref} = await createPaymentLink(
      {
        amount,
        currency,
        remittanceInformation,
        endToEnd,
        expireIn: HUBPISP_DEFAULT_EXPIRE_IN,
        successfulReportUrl,
        unsuccessfulReportUrl,
        pageConsentInfo,
        psuInfo,
        localInstrument,
      },
      config,
    ));
  } catch (err) {
    await markPaymentAsFailed({contextId, version, client});
    throw err;
  }

  await updatePaymentContextData({
    id: contextId,
    version,
    client,
    context: {...context, resourceId},
  });

  // Link-state changes are driven by the webhook
  // We only schedule a single expiry backstop check instead of polling GET payment-link.
  scheduleLinkExpiryCheck({
    resourceId,
    contextId,
    tenantId,
    localInstrument,
    delaySeconds: HUBPISP_DEFAULT_EXPIRE_IN,
  });

  return {resourceId, consentHref, contextId};
}
