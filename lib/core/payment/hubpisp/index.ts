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
  GetPaymentLinkStatusResult,
  PaymentLinkStatusResult,
} from './types';

export async function createPaymentLink(
  params: CreatePaymentLinkParams,
): Promise<CreatePaymentLinkResult> {
  const {
    currency,
    amount,
    expireIn,
    requestedExecutionDate: rawExecutionDate,
    localInstrument,
    endToEnd,
    remittanceInformation,
    successfulReportUrl,
    unsuccessfulReportUrl,
    psuInfo,
    pageConsentInfo: pci,
  } = params;

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
    rawExecutionDate ?? buildParisISOString(Date.now() + 15_000);

  const body = {
    amount,
    currency,
    beneficiary: {
      creditor: {name: beneficiaryName},
      creditorAccount: {iban},
      creditorAgent: bicFi ? {bic: bicFi} : undefined,
    },
    requestedExecutionDate,
    consentInfo: {
      expireIn: expireIn ?? HUBPISP_DEFAULT_EXPIRE_IN,
      unit: 'SECONDS',
    },
    localInstrument,
    endToEnd: endToEnd?.slice(0, 35),
    remittanceInformation: remittanceInformation?.slice(0, 100),
    successfulReportUrl,
    unsuccessfulReportUrl,
    psuInfo,
    pageConsentInfo: pci
      ? {
          pageTimeout: pci.pageTimeout ?? undefined,
          pageTimeoutUnit: pci.pageTimeoutUnit,
          pageUserTimeout: pci.pageUserTimeout ?? undefined,
          pageUserTimeoutUnit: pci.pageUserTimeoutUnit,
          pageTimeOutReturnURL: pci.pageTimeOutReturnURL,
        }
      : undefined,
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
 * Fetches the payment link status and returns a discriminated union
 * based on consentStatus: 'PROCESSED' | 'EXPIRED' | 'PENDING' | 'EXECUTED'.
 */
export async function getPaymentLinkStatus(
  resourceId: string,
): Promise<GetPaymentLinkStatusResult> {
  const data = await fetchPaymentLinkStatus(resourceId);
  const consentStatus = data.consentStatus;

  if (consentStatus === HUBPISP_CONSENT_STATUS.EXPIRED) {
    console.warn('[HUBPISP][SYNC_LINK] Payment link is EXPIRED', {resourceId});
    return {consentStatus: HUBPISP_CONSENT_STATUS.EXPIRED};
  }

  if (consentStatus === HUBPISP_CONSENT_STATUS.PROCESSED) {
    return {consentStatus: HUBPISP_CONSENT_STATUS.PROCESSED, data};
  }

  return {consentStatus};
}
