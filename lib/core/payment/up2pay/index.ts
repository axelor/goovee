import {DEFAULT_CURRENCY_CODE} from '@/constants';
import {formatAmountForUp2pay, hasKeys, join} from './utils';
import {createHMAC} from './crypto';
import {CURRENCY_CODE} from './constants';

const defaultCurrencyCode = CURRENCY_CODE[DEFAULT_CURRENCY_CODE];

export function getPaymentURL({
  amount,
  email,
  contextId,
  tenantId,
  currency,
  url,
  billingInfo,
  name,
  reference,
}: {
  amount: string | number;
  email: string;
  contextId: string;
  tenantId: string;
  currency: string;
  url: {
    success: string;
    failure: string;
    cancel: string;
  };
  billingInfo?: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    zipCode?: string;
    city?: string;
    countryCode?: string;
  };
  name: string;
  reference: string;
}) {
  const baseURL = process.env.UP2PAY_PAYBOX;

  if (!baseURL) {
    throw new Error('Invalid configuration');
  }

  const shoppingCart = `<?xml version="1.0" encoding="utf-8"?><shoppingcart><total><totalQuantity>1</totalQuantity></total></shoppingcart>`;
  const billing = `<?xml version="1.0" encoding="utf-8"?><Billing><Address><FirstName>${billingInfo?.firstName || ''}</FirstName><LastName>${billingInfo?.lastName || ''}</LastName><Address1>${billingInfo?.addressLine1 || ''}</Address1><ZipCode>${billingInfo?.zipCode || ''}</ZipCode><City>${billingInfo?.city || ''}</City><CountryCode>${billingInfo?.countryCode || '250'}</CountryCode></Address></Billing>`;

  const payload: any = {
    PBX_SITE: process.env.UP2PAY_SITE,
    PBX_RANG: process.env.UP2PAY_RANG,
    PBX_IDENTIFIANT: process.env.UP2PAY_IDENTIFIANT,
    PBX_TOTAL: formatAmountForUp2pay(amount),
    PBX_DEVISE: CURRENCY_CODE[currency] || defaultCurrencyCode,
    PBX_CMD: `${name}-${reference}~${contextId}~${tenantId}`,
    PBX_PORTEUR: email,
    PBX_RETOUR: 'montant:M;ref:R;erreur:E;sign=K',
    PBX_HASH: 'SHA512',
    PBX_TIME: new Date().toISOString(),
    PBX_SOUHAITAUTHENT: '04',
    PBX_SHOPPINGCART: shoppingCart,
    PBX_BILLING: billing,
    PBX_EFFECTUE: url?.success,
    PBX_ANNULE: url?.cancel,
    PBX_REFUSE: url?.failure,
  };

  if (
    !hasKeys(payload, [
      'PBX_SITE',
      'PBX_RANG',
      'PBX_IDENTIFIANT',
      'PBX_TOTAL',
      'PBX_DEVISE',
      'PBX_CMD',
      'PBX_PORTEUR',
      'PBX_RETOUR',
      'PBX_HASH',
      'PBX_TIME',
      'PBX_SOUHAITAUTHENT',
      'PBX_SHOPPINGCART',
      'PBX_BILLING',
      'PBX_EFFECTUE',
      'PBX_ANNULE',
      'PBX_REFUSE',
    ])
  ) {
    throw new Error('Invalid configuration');
  }

  const hmac = createHMAC(join(payload, false), process.env.UP2PAY_SECRET!);

  if (!hmac) {
    throw new Error('Error processing request');
  }

  const paymentURL = `${baseURL}?${join(payload)}&PBX_HMAC=${hmac}`;

  return paymentURL;
}
