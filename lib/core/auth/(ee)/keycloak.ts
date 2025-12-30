import {genericOAuth, keycloak as config} from 'better-auth/plugins';

const keycloak = genericOAuth({
  config: [
    config({
      clientId: process.env.KEYCLOAK_ID as string,
      clientSecret: process.env.KEYCLOAK_SECRET as string,
      issuer: process.env.KEYCLOAK_ISSUER as string,
    }),
  ],
});

export default keycloak;
