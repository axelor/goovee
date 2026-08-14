import {taintSecret} from '@/lib/core/security/taint';
import {Client, Environment} from '@paypal/paypal-server-sdk';

const client = function () {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  taintSecret(
    'PayPal secret key is a server secret. Do not pass to Client Components.',
    clientSecret,
  );

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment:
      process.env.PAYPAL_LIVE === 'true'
        ? Environment.Production
        : Environment.Sandbox,
  });
};

export default client;
