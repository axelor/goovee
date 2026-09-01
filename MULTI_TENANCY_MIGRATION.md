# Multi-tenancy migration runbook

Move a Goovee deployment off its environment variables and onto the configuration
document that replaces them. Perform the steps in order, on the updated AOS and
portal builds, before they serve traffic.

---

## 1. Write the configuration document

All configuration is one JSON document: a reserved `"$global"` section and one
entry keyed by the tenant id — the segment every address of the deployment
carries. Keep that id `d`, the segment the previous release served, and every
workspace address stays as it is.

### Run the migration script

In a checkout of the portal source, beside the deployment's current `.env`:

```
pnpm config:migrate
```

It writes `tenants.config.json`: one entry keyed `"d"`, `$global.defaultTenant`
set to it, and every value the environment carried moved into place. Review the
file, fill any required field it left blank, and carry it to the server.

### If running the script is not feasible

The script needs a source checkout and the deployment's `.env`; it is not part of
the built portal. Write the document instead. Every key is below, against the
variable it replaces — the comments are annotation, so strip them: the document
is plain JSON.

<!-- prettier-ignore -->
```jsonc
{
  "$global": {
    "betterAuthSecret": "<secret>",                               // BETTER_AUTH_SECRET
    "betterAuthUrl": "https://portal.example.com",                // BETTER_AUTH_URL, origin only
    "defaultTenant": "d",                                         // the entry below
    "pushMaxConnections": 10,                                     // optional, PUSH_MAX_CONNECTIONS
    "imageCacheMaxBytes": 2147483648                              // optional, IMAGE_CACHE_MAX_BYTES
  },

  // The tenant id: the segment every address of the deployment carries.
  "d": {
    "db": {
      "url": "postgres://user:pass@host:5432/goovee"              // DATABASE_URL
    },

    "aos": {
      "url": "https://erp.example.com/axelor-erp",                // AOS_URL
      "storage": "/storage/goovee",                               // DATA_STORAGE, the data.upload.dir base
      "auth": {
        "apiKey": "<api-key>"                                     // AOS_API_KEY. Or, instead of apiKey:
        // "username": "<user>",                                  // BASIC_AUTH_USERNAME
        // "password": "<password>"                               // BASIC_AUTH_PASSWORD
      },
      "webhookSecret": "<secret>",                                // optional, NOTIFICATION_WEBHOOK_SECRET
      "aosTenantId": "<aos-tenant-id>"                            // optional, AOS_TENANT_ID (step 6)
    },

    // Given to the browser. These ten keys and no others.
    "publicEnv": {
      "GOOVEE_PUBLIC_HOST": "https://portal.example.com",         // the origin served on
      "GOOVEE_PUBLIC_PAYPAL_CLIENT_ID": "<paypal-client-id>",     // optional
      "GOOVEE_PUBLIC_LINKEDIN_URL": "https://linkedin.com/company/x", // optional, news sharing
      "GOOVEE_PUBLIC_TWITTER_URL": "https://x.com/x",             // optional, news sharing
      "GOOVEE_PUBLIC_INSTAGRAM_URL": "https://instagram.com/x",   // optional, news sharing
      "GOOVEE_PUBLIC_WHATSAPP_URL": "https://wa.me/33000000000",  // optional, news sharing
      "GOOVEE_PUBLIC_MATTERMOST_HOST": "https://chat.example.com", // optional, chat links
      "GOOVEE_PUBLIC_VAPID_PUBLIC_KEY": "<vapid-public-key>",     // optional, push subscription
      "GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL": "Log In with SSO", // optional
      "GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE": "/images/sso.svg" // optional
    },

    // Keep the gateways in use, drop the rest.
    "payments": {
      "paypal": {
        "clientId": "<paypal-client-id>",                         // PAYPAL_CLIENT_ID
        "clientSecret": "<paypal-secret>",                        // PAYPAL_CLIENT_SECRET
        "live": false                                             // optional, PAYPAL_LIVE
      },
      "stripe": {
        "clientSecret": "<stripe-secret-key>",                    // STRIPE_CLIENT_SECRET
        "webhookSecret": "<stripe-webhook-secret>"                // optional, STRIPE_WEBHOOK_SECRET
      },
      "paybox": {
        "site": "<site>",                                         // PBX_SITE
        "rang": "<rang>",                                         // PBX_RANG
        "identifiant": "<identifiant>",                           // PBX_IDENTIFIANT
        "secret": "<secret>",                                     // PBX_SECRET
        "paybox": "<payment-page-url>",                           // PBX_PAYBOX
        "backup1": "<backup1-url>",                               // optional, PBX_BACKUP1
        "backup2": "<backup2-url>"                                // optional, PBX_BACKUP2
      },
      "up2pay": {
        "site": "<site>",                                         // UP2PAY_SITE
        "rang": "<rang>",                                         // UP2PAY_RANG
        "identifiant": "<identifiant>",                           // UP2PAY_IDENTIFIANT
        "secret": "<secret>",                                     // UP2PAY_SECRET
        "paybox": "<up2pay-host>",                                // UP2PAY_PAYBOX
        "legacyForwardUrl": "https://legacy-erp.example.com/ipn"  // optional, UP2PAY_LEGACY_FORWARD_URL
      },
      "hubpisp": {
        "tokenUrl": "https://oauth.bpce.example.com/token",       // HUBPISP_TOKEN_URL
        "apiUrl": "https://api.bpce.example.com",                 // HUBPISP_API_URL
        "clientId": "<hubpisp-client-id>",                        // HUBPISP_CLIENT_ID
        "clientSecret": "<hubpisp-secret>",                       // HUBPISP_CLIENT_SECRET
        "certFingerprint": "<sha256-fingerprint>",                // HUBPISP_CERT_FINGERPRINT
        "beneficiaryName": "<beneficiary>",                       // HUBPISP_BENEFICIARY_NAME
        "iban": "<iban>",                                         // HUBPISP_IBAN
        "bic": "<bic>",                                           // optional, HUBPISP_BIC
        "certsDir": "/certs/hubpisp"                              // no variable carried this (step 6)
      }
    },

    "mail": {                                                     // the section as a whole is optional
      "host": "smtp.example.com",                                 // MAIL_HOST
      "port": 587,                                                // MAIL_PORT
      "secure": false,                                            // optional, MAIL_SECURE
      "user": "noreply@example.com",                              // MAIL_USER
      "password": "<smtp-password>",                              // MAIL_PASSWORD
      "email": "noreply@example.com",                             // optional, MAIL_EMAIL
      "maxConnections": 10                                        // optional, MAIL_MAX_CONNECTIONS
    },

    "mattermost": {                                               // the section as a whole is optional
      "token": "<mattermost-token>",                              // optional, MATTERMOST_TOKEN
      "createUsers": true                                         // optional, CREATE_MATTERMOST_USERS
    },

    "webPush": {                                                  // the section as a whole is optional
      "privateKey": "<vapid-private-key>",                        // VAPID_PRIVATE_KEY
      "subject": "mailto:admin@example.com"                       // VAPID_SUBJECT
    },

    "oauth": {                                                    // the section as a whole is optional
      "google": {
        "clientId": "<google-client-id>",                         // GOOGLE_CLIENT_ID
        "clientSecret": "<google-secret>"                         // GOOGLE_CLIENT_SECRET
      },
      "keycloak": {
        "clientId": "<keycloak-client-id>",                       // KEYCLOAK_ID
        "clientSecret": "<keycloak-secret>",                      // KEYCLOAK_SECRET
        "issuer": "https://sso.example.com/realms/x"              // KEYCLOAK_ISSUER
      }
    },

    "includeLanguage": true,                                      // optional, INCLUDE_LANGUAGE
    "uploadRecordRetentionHours": 168                             // optional, UPLOAD_RECORD_RETENTION_HOURS
  }
}
```

A key with no `optional` note is required once the section holding it is present.
Drop a section the deployment does not use, and every key under it goes too.

Write `betterAuthUrl` and `GOOVEE_PUBLIC_HOST` as the same origin, the one the
portal answers on: workspace addresses are stored against it, so a value that
does not match resolves no workspace.

Write that origin and nothing more: a scheme and a host, the port only where it
is not the default, and no path, query, fragment or trailing slash. Anything else
is refused at start-up, against the field that carries it.

Set `defaultTenant` to the tenant id. `/` and the sign-in screens carry no tenant
in their address, and this is what tells them which one to serve; leave it out and
they require a tenant in the URL.

Set `payments.stripe.webhookSecret` to take bank transfer: without it, bank
transfer is not offered at checkout. Card payments do not need it.

Serving the deployment under an id other than `d` means renaming the entry and
`$global.defaultTenant` together, and re-pointing every workspace address in AOS.
The id must be a letter followed by letters, digits or hyphens, at most 15
characters, and not one of `api`, `auth`, `images`, `locales`, `pdfjs`, `pwa`,
`website` — the deployment answers those itself. Do not change it while Up2Pay or
Hub PISP payments are in flight: those payments can no longer be settled.

## 2. Set the environment

The whole of it, once the document holds the rest:

<!-- prettier-ignore -->
```dotenv
# Path to the document. It holds the database, AOS, payment and auth secrets.
TENANTS_CONFIG_FILE=/etc/goovee/tenants.config.json

# ...or the same JSON inline, read only when TENANTS_CONFIG_FILE is unset.
# TENANTS_CONFIG=

# Inlined into the browser bundle when the portal is built, so a change to it
# needs a rebuild. Empty for a root deployment, or a subpath like '/portal'.
NEXT_PUBLIC_BASE_PATH=
```

Remove every other variable: `DATABASE_URL`, `AOS_*`, `BASIC_AUTH_*`,
`DATA_STORAGE`, `PAYPAL_*`, `STRIPE_*`, `PBX_*`, `UP2PAY_*`, `HUBPISP_*`,
`MAIL_*`, `MATTERMOST_*`, `VAPID_*`, `GOOGLE_*`, `KEYCLOAK_*`, `SHOW_*`,
`GOOVEE_PUBLIC_*`, `BETTER_AUTH_*`, `INCLUDE_LANGUAGE`,
`UPLOAD_RECORD_RETENTION_HOURS`, `PUSH_MAX_CONNECTIONS`, `IMAGE_CACHE_MAX_BYTES`
and `MULTI_TENANCY`. Nothing replaces `MULTI_TENANCY`: the document decides.

On a build carrying a base path, put that subpath before every `/api/…` address
below. `$global.betterAuthUrl` stays a bare origin.

## 3. Re-point the gateway webhook URLs

Every webhook address takes the tenant after `/api`:

```
https://<host>/api/<path>   ->   https://<host>/api/tenant/<tenantId>/<path>
```

With `<tenantId>` as `d`, that is:

| Gateway         | Was                                  | Now                                           |
| --------------- | ------------------------------------ | --------------------------------------------- |
| Stripe          | `/api/webhooks/stripe`               | `/api/tenant/d/webhooks/stripe`               |
| Up2Pay          | `/api/webhooks/up2pay`               | `/api/tenant/d/webhooks/up2pay`               |
| Hub PISP / BPCE | `/api/webhooks/hubpisp/<resourceId>` | `/api/tenant/d/webhooks/hubpisp/<resourceId>` |
| Paybox          | `/api/payment/paybox/validate`       | `/api/tenant/d/payment/paybox/validate`       |

Change Stripe in the dashboard under Webhooks, Up2Pay in the merchant
back-office as the IPN URL, and Hub PISP in the BPCE webhook registration —
dropping any `?tenant=` query it carries. Paybox sends its address with each
request, so there is nothing to register.

## 4. AOS notifications connector

The signing secret moves out of `axelor-config.properties` into the AOS
configuration, beside the address it posts to.

In AOS open the Goovee Portal app configuration and set:

- **Notification webhook url** =
  `https://<host>/api/tenant/d/webhooks/notifications` — the tenant is now in the
  path, so the previous `https://<host>/api/webhooks/notifications` no longer
  answers
- **Webhook secret** = the document's `aos.webhookSecret`

Set `encryption.password` in the AOS `axelor-config.properties` first: it is what
encrypts the field. Without it the secret is written to the database in cleartext
and nothing reports that, and setting the password afterwards leaves the value
cleartext until it is entered again. Keep the secret to 132 bytes or shorter, the
most an encrypted value fits in the column.

Until the secret is set, AOS sends notifications unsigned and the portal refuses
every one of them.

Then delete `portal.ws.secret` and `portal.ws.tenantId` from
`axelor-config.properties`.

## 5. Re-register the OAuth redirect URIs

Every redirect URI now carries the tenant in the provider id, and Google answers
on the same `oauth2` path as Keycloak:

```
https://<host>/api/auth/oauth2/callback/<provider>-<tenantId>
```

Register that with each provider and remove the old one. With `<tenantId>` as
`d`, that is:

| Provider | Was                                  | Now                                    |
| -------- | ------------------------------------ | -------------------------------------- |
| Google   | `/api/auth/callback/google`          | `/api/auth/oauth2/callback/google-d`   |
| Keycloak | `/api/auth/oauth2/callback/keycloak` | `/api/auth/oauth2/callback/keycloak-d` |

## 6. Provision storage and certificate mounts

Every path in the document (`aos.storage`, `certsDir`) is read against the server
process's working directory, so write them as absolute paths.

- Set `aos.storage` to the AOS instance's `data.upload.dir` base.
- Set `aos.aosTenantId` only where that AOS serves several tenants of its own.
  Files then sit under `<aos.storage>/<aosTenantId>`, which is where AOS keeps
  that tenant's files.
- For Hub PISP, place `client.crt` and `private-key.pem` in `certsDir`.

## 7. Start and verify

1. Validate the document before starting anything, from a source checkout:

   ```bash
   pnpm config:check /etc/goovee/tenants.config.json
   ```

   It applies the checks start-up applies and names every fault against the
   field holding it; a document with no fault is reported as accepted, listing
   the tenants and the address each is reached at. It ends non-zero on a document
   that would be refused, so a deployment can be gated on it. Nothing is
   connected to, so an unreachable database, AOS instance or mail host is not
   reported here. Where no checkout is available, step 3 below is the same
   verdict read from the boot log.

2. Start AOS and the portal with everything above in place.
3. Check the boot log. A rejected document is named there, after a
   `could not read the configuration:` line, as one of
   `No tenant configuration found`, `Tenant configuration is not valid JSON` or
   `Tenant configuration is invalid` — the last of these lists the fields at
   fault. None of the three means it was accepted. The server starts and answers
   its port either way, and a rejected document fails every request, so check
   before flipping traffic.
4. Flip traffic once the gateway (section 3) and provider (section 5)
   registrations point at the new addresses.
5. Watch gateway and notification delivery logs for 404s and signature failures,
   and re-point any registration that failed.

## 8. Serve a tenant on its own domain

Optional, and done once the deployment above works. A tenant reached this way
carries no tenant segment: `https://acme.example.com/sales` rather than
`https://portal.example.com/acme/sales`.

Take the tenant out of service for the duration. Each step below invalidates the
addresses the one before it used.

### Change the document

Set `routing` on the tenant and point it at the new origin:

```json
"acme": {
  "routing": "host",
  "publicEnv": { "GOOVEE_PUBLIC_HOST": "https://acme.example.com" }
}
```

That host must serve no other tenant. Where `$global.defaultTenant` names the
tenant being moved and `$global.betterAuthUrl`'s own host still has to answer
`/`, point `defaultTenant` at a tenant that is still reached by path.

### Configure the proxy

Pass the visitor's host through:

<!-- prettier-ignore -->
```nginx
proxy_set_header Host             $host;
proxy_set_header X-Forwarded-Host $host;
```

nginx sends its own upstream address as `Host` by default and sets no
`X-Forwarded-*` header at all. Left that way the deployment resolves no tenant
and refuses every form submission. Set `X-Forwarded-Host` explicitly rather than
relying on `Host`: an unset one is passed through from the client, and whoever
sets it chooses which tenant answers.

Serve the new host over HTTPS. Notifications, offline caching and installing the
app all need it.

A page request arriving on a host no tenant declares answers not-found. Point
liveness and readiness probes at `/api/info`, which answers on any host.

### Move the stored workspace URLs

In that tenant's own database:

```
<oldOrigin><basePath>/<tenantId>/<workspace>  ->  <newOrigin><basePath>/<workspace>
```

With no base path, `<tenantId>` as `acme` and the origins above:

```sql
UPDATE portal_portal_workspace
SET
  url = replace(
    url,
    'https://portal.example.com/acme',
    'https://acme.example.com'
  );
```

### Re-register the addresses

Every address from sections 3, 4 and 5 keeps its path and changes its host.

| Registration                    | Was                                             | Now                                           |
| ------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| Gateway webhooks (section 3)    | `portal.example.com/api/tenant/acme/…`          | `acme.example.com/api/tenant/acme/…`          |
| AOS notifications (section 4)   | `portal.example.com/api/tenant/acme/…`          | `acme.example.com/api/tenant/acme/…`          |
| OAuth redirect URIs (section 5) | `portal.example.com/api/auth/oauth2/callback/…` | `acme.example.com/api/auth/oauth2/callback/…` |

The tenant stays in the path of the `/api/tenant/…` addresses; only the host
changes.

### Restart and verify

1. `pnpm config:check /etc/goovee/tenants.config.json` — the tenant is listed
   with its new address and `[routed by host]`.
2. Restart the portal.
3. Open `https://acme.example.com/` and confirm it lands on a workspace.
4. Open `https://portal.example.com/acme` and confirm it answers 308 to
   `https://acme.example.com/`.
5. Sign in on the new host, then confirm a notification arrives and the app can
   be installed.

### What the move costs

- Everyone signs in again. A session cookie belongs to the host it was written
  for and does not follow the tenant.
- An installed app keeps launching at the old address. It has to be removed and
  re-installed from the new one.
- Push subscriptions stop being delivered. They belong to the old origin's
  service worker, so every row in `portal_push_subscription` for this tenant is
  dead and can be deleted; visitors re-grant notifications on the new host.
- Old addresses answer 308 to the new ones for as long as the previous origin
  still reaches the deployment.

### Workspace names to avoid

On its own domain the first path segment is the workspace name, so a workspace
whose slug is one the deployment answers itself is unreachable: `auth`, `api`,
`images`, `locales`, `pdfjs`, `pwa`, `website`, `sign-out` and
`manifest.webmanifest`. AOS accepts those names, and nothing reports the clash —
rename the workspace.
