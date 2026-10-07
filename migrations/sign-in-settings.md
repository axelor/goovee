# Migrating the sign-in settings

Move a Goovee deployment onto the `auth` group that holds a tenant's sign-in
settings. Follow this runbook when upgrading:

- **2.3.x → 2.4.0 or later**

Every deployment configuring Google or Keycloak sign-in for a tenant performs
step 1: the previous spelling of the group is refused. A deployment configuring
neither has nothing to move. [CONFIGURATION.md](../CONFIGURATION.md) describes
every setting written here.

---

## 1. Rename the `oauth` group

`oauth` held a tenant's Google and Keycloak applications. Rename it `auth`,
keeping what it holds:

```json
"auth": {
  "google": {
    "clientId": "….apps.googleusercontent.com",
    "clientSecret": "…"
  },
  "keycloak": {
    "clientId": "…",
    "clientSecret": "…",
    "issuer": "https://id.example.com/realms/acme"
  }
}
```

As variables, `OAUTH` becomes `AUTH` in each name:

| Before                                            | After                                            |
| ------------------------------------------------- | ------------------------------------------------ |
| `PORTAL_TENANT_<ID>_OAUTH_GOOGLE_CLIENT_ID`       | `PORTAL_TENANT_<ID>_AUTH_GOOGLE_CLIENT_ID`       |
| `PORTAL_TENANT_<ID>_OAUTH_GOOGLE_CLIENT_SECRET`   | `PORTAL_TENANT_<ID>_AUTH_GOOGLE_CLIENT_SECRET`   |
| `PORTAL_TENANT_<ID>_OAUTH_KEYCLOAK_CLIENT_ID`     | `PORTAL_TENANT_<ID>_AUTH_KEYCLOAK_CLIENT_ID`     |
| `PORTAL_TENANT_<ID>_OAUTH_KEYCLOAK_CLIENT_SECRET` | `PORTAL_TENANT_<ID>_AUTH_KEYCLOAK_CLIENT_SECRET` |
| `PORTAL_TENANT_<ID>_OAUTH_KEYCLOAK_ISSUER`        | `PORTAL_TENANT_<ID>_AUTH_KEYCLOAK_ISSUER`        |

The redirect URIs registered with Google and Keycloak do not change.

A deployment still on the flat variables of a release before 2.3.0 runs
`pnpm config:migrate` first, as
[the per-tenant configuration runbook](./multi-tenancy.md) describes; it writes
the new names directly.

Then check the result before starting:

```
pnpm config:check
```

A configuration still carrying the previous spelling is refused — as a
variable, `PORTAL_TENANT_<ID>_OAUTH_GOOGLE_CLIENT_ID names no setting`; in a
document, `tenants.<id>.oauth names no setting`.

## 2. Choose whether to keep email and password sign-in

Optional. The `auth` group also holds `password`, which turns email and
password sign-in on or off for the tenant. It is on unless set to `false`, so a
tenant upgraded without it keeps signing in as before.

```json
"auth": {
  "password": false,
  "google": {"clientId": "…", "clientSecret": "…"}
}
```

```
PORTAL_TENANT_<ID>_AUTH_PASSWORD=false
```

With it off, the tenant's visitors sign in through Google or Keycloak only, and
accounts that already have a password can no longer use it. A tenant with it
off and neither Google nor Keycloak configured offers no sign-in at all: its
visitors browse as guests.
