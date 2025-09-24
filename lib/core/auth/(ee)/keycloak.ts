import Keycloak from 'next-auth/providers/keycloak';

export const keycloak = Keycloak({
  clientId: process.env.KEYCLOAK_ID as string,
  clientSecret: process.env.KEYCLOAK_SECRET as string,
  issuer: process.env.KEYCLOAK_ISSUER as string,
});

export default keycloak;
