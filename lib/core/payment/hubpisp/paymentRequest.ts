import {
  getPispAccessToken,
  generateDigest,
  buildPispHeaders,
  pispFetch,
} from './crypto';
import {getHubPispSettings} from './settings';
import type {TenantConfig} from '@/tenant';
import {
  generateRequestId,
  getDateHeader,
  buildRequestTarget,
  HubPispApiError,
} from './utils';
import {PAYMENT_REQUEST_PATH} from './constants';
import type {PaymentRequestStatusResult} from './types';

/**
 * Fetches the current status of a payment request by resourceId.
 */
export async function fetchPaymentRequestStatus(
  resourceId: string,
  config: TenantConfig,
): Promise<PaymentRequestStatusResult> {
  const settings = getHubPispSettings(config);
  const {apiUrl: baseUrl, certFingerprint: keyId} = settings;

  if (!(baseUrl && keyId && settings.certsDir)) {
    console.error('[HUBPISP][REQUEST_STATUS] Missing config', {
      hasBaseUrl: !!baseUrl,
      hasKeyId: !!keyId,
      hasCertsDir: !!settings.certsDir,
    });
    throw new Error('HUB PISP is not configured');
  }

  const token = await getPispAccessToken(settings);

  const path = `${PAYMENT_REQUEST_PATH}/${resourceId}`;
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
    certsDir: settings.certsDir,
  });

  const response = await pispFetch(
    `${baseUrl}${path}`,
    {
      method: 'GET',
      headers,
    },
    settings.certsDir,
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[HUBPISP][REQUEST_STATUS] Request failed', {
      resourceId,
      status: response.status,
      body: errorBody,
    });

    throw new HubPispApiError(
      'HUB PISP fetch payment request status failed',
      response.status,
      errorBody,
    );
  }

  const data = await response.json();
  return data?.paymentRequest ?? data;
}
