import {
  getPispAccessToken,
  generateDigest,
  buildPispHeaders,
  pispFetch,
} from './crypto';
import {
  generateRequestId,
  getDateHeader,
  buildRequestTarget,
  buildParisISOString,
} from './utils';
import {
  HUBPISP_DEFAULT_EXPIRE_IN,
  HUBPISP_CONSENT_STATUS,
  PAYMENT_LINK_PATH,
} from './constants';
import type {
  CreatePaymentLinkParams,
  CreatePaymentLinkResult,
  PaymentLinkStatusResult,
} from './types';

export async function createPaymentLink(
  params: CreatePaymentLinkParams,
): Promise<CreatePaymentLinkResult> {
  const currency = params.currency;

  const baseUrl = process.env.HUBPISP_API_URL;
  const keyId = process.env.HUBPISP_CERT_FINGERPRINT;
  const beneficiaryName = process.env.HUBPISP_BENEFICIARY_NAME;
  const iban = process.env.HUBPISP_IBAN;
  const bicFi = process.env.HUBPISP_BIC;

  if (!(baseUrl && keyId && beneficiaryName && iban)) {
    console.error('[HUBPISP][CREATE_LINK] Missing env config', {
      hasBaseUrl: !!baseUrl,
      hasKeyId: !!keyId,
      hasBeneficiaryName: !!beneficiaryName,
      hasIban: !!iban,
    });
    throw new Error('HUB PISP is not configured');
  }

  if (!currency || currency !== 'EUR') {
    throw new Error(
      `HUB PISP only supports EUR payments (got: ${currency ?? 'none'})`,
    );
  }

  const token = await getPispAccessToken();

  const requestedExecutionDate =
    params.requestedExecutionDate ?? buildParisISOString(Date.now() + 15_000);

  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: currency,
    beneficiary: {
      creditor: {
        name: beneficiaryName,
      },
      creditorAccount: {
        iban,
      },
      ...(bicFi ? {creditorAgent: {bic: bicFi}} : {}),
    },
    requestedExecutionDate,
    consentInfo: {
      expireIn: params.expireIn ?? HUBPISP_DEFAULT_EXPIRE_IN,
      unit: 'SECONDS',
    },
    ...(params.localInstrument
      ? {localInstrument: params.localInstrument}
      : {}),
    ...(params.endToEnd ? {endToEnd: params.endToEnd.slice(0, 35)} : {}),
    ...(params.remittanceInformation
      ? {remittanceInformation: params.remittanceInformation.slice(0, 100)}
      : {}),
    ...(params.successfulReportUrl
      ? {successfulReportUrl: params.successfulReportUrl}
      : {}),
    ...(params.unsuccessfulReportUrl
      ? {unsuccessfulReportUrl: params.unsuccessfulReportUrl}
      : {}),
    ...(params.psuInfo ? {psuInfo: params.psuInfo} : {}),
    ...(params.pageConsentInfo
      ? {
          pageConsentInfo: {
            ...(params.pageConsentInfo.pageTimeout != null
              ? {pageTimeout: params.pageConsentInfo.pageTimeout}
              : {}),
            ...(params.pageConsentInfo.pageTimeoutUnit
              ? {pageTimeoutUnit: params.pageConsentInfo.pageTimeoutUnit}
              : {}),
            ...(params.pageConsentInfo.pageUserTimeout != null
              ? {pageUserTimeout: params.pageConsentInfo.pageUserTimeout}
              : {}),
            ...(params.pageConsentInfo.pageUserTimeoutUnit
              ? {
                  pageUserTimeoutUnit:
                    params.pageConsentInfo.pageUserTimeoutUnit,
                }
              : {}),
            ...(params.pageConsentInfo.pageTimeOutReturnURL
              ? {
                  pageTimeOutReturnURL:
                    params.pageConsentInfo.pageTimeOutReturnURL,
                }
              : {}),
          },
        }
      : {}),
  };

  const bodyString = JSON.stringify(body);
  const digest = generateDigest(bodyString);
  const date = getDateHeader();
  const xRequestId = generateRequestId();
  const requestTarget = buildRequestTarget('post', PAYMENT_LINK_PATH);

  const headers = buildPispHeaders({
    token,
    keyId,
    requestTarget,
    digest,
    date,
    xRequestId,
  });

  const response = await pispFetch(`${baseUrl}${PAYMENT_LINK_PATH}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', ...headers},
    body: bodyString,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[HUBPISP][CREATE_LINK] Request failed', {
      status: response.status,
      body: errorBody,
    });
    throw new Error(
      `HUB PISP create payment link failed (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();

  return {
    resourceId: data.resourceId,
    consentHref: data._links?.consent?.href,
  };
}

export async function fetchPaymentLinkStatus(
  resourceId: string,
): Promise<PaymentLinkStatusResult> {
  const baseUrl = process.env.HUBPISP_API_URL;
  const keyId = process.env.HUBPISP_CERT_FINGERPRINT;

  if (!(baseUrl && keyId)) {
    console.error('[HUBPISP][LINK_STATUS] Missing env config', {
      hasBaseUrl: !!baseUrl,
      hasKeyId: !!keyId,
    });
    throw new Error('HUB PISP is not configured');
  }

  const token = await getPispAccessToken();

  const path = `${PAYMENT_LINK_PATH}/${resourceId}`;
  const bodyString = '';
  const digest = generateDigest(bodyString);
  const date = getDateHeader();
  const xRequestId = generateRequestId();
  const requestTarget = buildRequestTarget('get', path);

  const headers = buildPispHeaders({
    token,
    keyId,
    requestTarget,
    digest,
    date,
    xRequestId,
  });

  const response = await pispFetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[HUBPISP][LINK_STATUS] Request failed', {
      resourceId,
      status: response.status,
      body: errorBody,
    });
    throw new Error(
      `HUB PISP fetch payment link status failed (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  return data as PaymentLinkStatusResult;
}

/**
 * Fetches the payment link status and returns it only when it has reached
 * PROCESSED (bank selected). Throws if the link has EXPIRED.
 * Returns null for non-terminal in-progress states (PENDING, EXECUTED).
 */
export async function syncPaymentLinkStatus(
  resourceId: string,
): Promise<PaymentLinkStatusResult | null> {
  const linkStatus = await fetchPaymentLinkStatus(resourceId);
  const consentStatus = linkStatus?.consentStatus;

  if (consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
    console.warn('[HUBPISP][SYNC_LINK] Payment link is EXPIRED', {resourceId});
    throw new Error(`Payment link expired (resourceId: ${resourceId})`);
  }

  if (consentStatus !== HUBPISP_CONSENT_STATUS.PROCESSED) {
    return null;
  }

  return linkStatus;
}
