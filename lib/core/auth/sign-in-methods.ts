import type {TenantConfig} from '@/tenant';

/** The ways a visitor can sign in to one tenant. */
export type SignInMethods = {
  password: boolean;
  google: boolean;
  keycloak: boolean;
};

/**
 * The sign-in methods a tenant offers, read from its `auth` settings.
 *
 * Email and password sign-in is on unless the tenant turns it off. Google and
 * Keycloak are on only where the tenant declares them. A tenant the document
 * does not name offers nothing.
 */
export function getSignInMethods(config: TenantConfig | null): SignInMethods {
  return {
    password: Boolean(config) && config?.auth?.password !== false,
    google: Boolean(config?.auth?.google),
    keycloak: Boolean(config?.auth?.keycloak),
  };
}

/** Whether a tenant offers any way to sign in at all. */
export function canSignIn(methods: SignInMethods): boolean {
  return methods.password || methods.google || methods.keycloak;
}

/**
 * Whether a visitor can create an account on their own. Registration is offered
 * by email and by Google; Keycloak accounts are created at their first sign-in.
 */
export function canSelfRegister(methods: SignInMethods): boolean {
  return methods.password || methods.google;
}
