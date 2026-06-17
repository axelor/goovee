import {Client, Environment} from '@paypal/paypal-server-sdk';

import type {TenantConfig} from '@/tenant';

const client = function (config?: TenantConfig | null) {
  const paypal = config?.payments?.paypal;

  if (!paypal) {
    throw new Error('PayPal is not configured');
  }

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: paypal.clientId,
      oAuthClientSecret: paypal.clientSecret,
    },
    environment:
      paypal.live === true ? Environment.Production : Environment.Sandbox,
  });
};

export default client;
