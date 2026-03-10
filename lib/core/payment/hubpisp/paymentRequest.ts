import {
  getPispAccessToken,
  generateDigest,
  buildPispHeaders,
  pispFetch,
} from './crypto';
import {generateRequestId, getDateHeader, buildRequestTarget} from './utils';
import {PAYMENT_REQUEST_PATH} from './constants';
import type {PaymentRequestStatusResult} from './types';

/**
 * Fetches the current status of a payment request by resourceId.
 */
export async function fetchPaymentRequestStatus(
  resourceId: string,
): Promise<PaymentRequestStatusResult> {
  const baseUrl = process.env.HUBPISP_API_URL;
  const keyId = process.env.HUBPISP_CERT_FINGERPRINT;

  if (!(baseUrl && keyId)) {
    console.error('[HUBPISP][REQUEST_STATUS] Missing env config', {
      hasBaseUrl: !!baseUrl,
      hasKeyId: !!keyId,
    });
    throw new Error('HUB PISP is not configured');
  }

  const token = await getPispAccessToken();

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
  });

  const response = await pispFetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[HUBPISP][REQUEST_STATUS] Request failed', {
      resourceId,
      status: response.status,
      body: errorBody,
    });
    throw new Error(
      `HUB PISP fetch payment request status failed (${response.status}): ${errorBody}`,
    );
  }

  const data = await response.json();
  return data?.paymentRequest ?? data;
}
