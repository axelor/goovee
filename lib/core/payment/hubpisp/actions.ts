import type {Tenant} from '@/tenant';
import {PaymentOption} from '@/types';
import {
  createPaymentContext,
  findPaymentContext,
  markPaymentAsExpired,
  markPaymentAsFailed,
  updatePaymentContextData,
} from '../common/orm';
import type {PaymentOrder} from '../common/type';
import {createPaymentLink, getPaymentLinkStatus} from '.';
import {
  HUBPISP_CONSENT_STATUS,
  HUBPISP_DEFAULT_EXPIRE_IN,
  HubPispLocalInstrument,
} from './constants';
import type {HubPispContextData, PageConsentInfo, PsuInfo} from './types';
import {pollPaymentLinkStatus} from './pollLink';

export async function createHubPispPaymentLink({
  amount,
  tenantId,
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
  if (!tenantId || !currency || !email) {
    throw new Error('tenantId, currency and email are required');
  }
  if (!amount || amount <= 0) {
    throw new Error('amount must be a positive number');
  }

  const {id: contextId, version} = await createPaymentContext({
    context,
    mode: PaymentOption.hubpisp,
    payer: email,
    tenantId,
  });

  const endToEnd = `${contextId}-${tenantId}`;
  if (endToEnd.length > 35) {
    await markPaymentAsFailed({contextId, version, tenantId});
    throw new Error(
      `endToEnd value exceeds 35 characters: "${endToEnd}" (${endToEnd.length} chars)`,
    );
  }

  let resourceId: string;
  let consentHref: string;
  try {
    ({resourceId, consentHref} = await createPaymentLink({
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
    }));
  } catch (err) {
    await markPaymentAsFailed({contextId, version, tenantId});
    throw err;
  }

  await updatePaymentContextData({
    id: contextId,
    version,
    tenantId,
    context: {...context, resourceId},
  });

  pollPaymentLinkStatus({
    resourceId,
    contextId,
    tenantId,
    localInstrument,
    expireIn: HUBPISP_DEFAULT_EXPIRE_IN,
  });

  return {resourceId, consentHref, contextId};
}

export async function findHubPispOrder({
  contextId,
  resourceId,
  tenantId,
}: {
  contextId: string;
  resourceId: string;
  tenantId: Tenant['id'];
}): Promise<PaymentOrder> {
  const context = await findPaymentContext({
    id: contextId,
    tenantId,
    mode: PaymentOption.hubpisp,
    ignoreExpiration: true,
  });

  if (!context) {
    console.error('[HUBPISP][FIND_ORDER] Payment context not found', {
      contextId,
      tenantId,
    });
    throw new Error('Payment context not found');
  }

  const linkStatusResult = await getPaymentLinkStatus(resourceId);

  if (linkStatusResult.consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
    console.warn('[HUBPISP][FIND_ORDER] Payment link expired', {resourceId});
    await markPaymentAsExpired({
      contextId: context.id,
      version: context.version,
      tenantId,
    });
    throw new Error(`Payment link expired (resourceId: ${resourceId})`);
  }

  if (linkStatusResult.consentStatus !== HUBPISP_CONSENT_STATUS.PROCESSED) {
    console.warn('[HUBPISP][FIND_ORDER] Payment link not yet processed', {
      resourceId,
    });
    throw new Error('Payment link not yet processed');
  }

  const amount = context.data?.amount ?? 0;

  return {
    context,
    amount,
  };
}
