import type {Tenant} from '@/tenant';
import {PaymentOption} from '@/types';
import {
  createPaymentContext,
  findPaymentContext,
  markPaymentAsExpired,
  updatePaymentContextData,
} from '../common/orm';
import type {PaymentOrder} from '../common/type';
import {createPaymentLink, syncPaymentLinkStatus} from '.';
import {HUBPISP_DEFAULT_EXPIRE_IN, HubPispLocalInstrument} from './constants';
import type {PageConsentInfo} from './types';

export async function createHubPispPaymentLink({
  amount,
  tenantId,
  email,
  context,
  currency,
  remittanceInformation,
  endToEnd,
  localInstrument,
  successfulReportUrl,
  unsuccessfulReportUrl,
  pageConsentInfo,
  psuInfo,
}: {
  amount: number;
  tenantId: Tenant['id'];
  email: string;
  context: any;
  currency: string;
  remittanceInformation?: string;
  endToEnd?: string;
  localInstrument?: HubPispLocalInstrument;
  successfulReportUrl?: string;
  unsuccessfulReportUrl?: string;
  pageConsentInfo?: PageConsentInfo;
  psuInfo?: import('./types').PsuInfo;
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

  const {resourceId, consentHref} = await createPaymentLink({
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
  });

  await updatePaymentContextData({
    id: contextId,
    version,
    tenantId,
    context: {...context, resourceId},
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

  let linkStatus;
  try {
    linkStatus = await syncPaymentLinkStatus(resourceId);
  } catch (err) {
    console.warn('[HUBPISP][FIND_ORDER] Payment link expired', {
      resourceId,
      error: (err as Error).message,
    });
    await markPaymentAsExpired({
      contextId: context.id,
      version: context.version,
      tenantId,
    });
    throw err;
  }
  if (!linkStatus) {
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
