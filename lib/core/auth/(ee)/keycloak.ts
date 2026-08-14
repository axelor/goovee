import {taintSecret} from '@/lib/core/security/taint';
import {genericOAuth, keycloak as config} from 'better-auth/plugins';

const clientSecret = process.env.KEYCLOAK_SECRET as string;

taintSecret(
  'Keycloak Client Secret is an authentication secret. Do not pass to Client Components.',
  clientSecret,
);

const keycloak =
  process.env.SHOW_KEYCLOAK_OAUTH === 'true'
    ? genericOAuth({
        config: [
          config({
            clientId: process.env.KEYCLOAK_ID as string,
            clientSecret,
            issuer: process.env.KEYCLOAK_ISSUER as string,
          }),
        ],
      })
    : null;

export default keycloak;
