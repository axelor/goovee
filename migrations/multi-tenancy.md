# Migrating to per-tenant configuration

Move a Goovee deployment off the environment variables of the previous release
and onto the per-tenant configuration that replaces them. Follow this runbook
when upgrading:

- **2.2.x or earlier → 2.3.0 or later**
- **1.10.x or earlier → 1.11.0 or later**

The steps are the same on both lines. Perform them in order, on the updated AOS
and portal builds, before they serve traffic. [CONFIGURATION.md](../CONFIGURATION.md)
describes every setting written here.

---

## 1. Write the new configuration

Write the settings in one of two spellings: a JSON document, `portal.config.json`,
or environment variables starting with `PORTAL_`. In the document, put the
deployment's own settings at the top and each tenant under `tenants.<id>`; as
variables, write `PORTAL_<SETTING>` and `PORTAL_TENANT_<ID>_<SETTING>`. Keep the
tenant id `d`, the segment the previous release served, so every workspace
address stays as it is.

### Run the migration script

In a checkout of the portal source, beside the deployment's current `.env`, run:

```
NODE_ENV=production pnpm config:migrate
```

`NODE_ENV=production` is what makes the script read the deployment's own `.env`
files — the four `next start` reads, in the same order. Without it the
development files are read in its place, so a value the deployment keeps in
`.env.production` is migrated from whatever `.env.development` holds, and
nothing says so.

It writes `portal.config.json` from the old variables: the deployment's settings,
`"defaultTenant": "d"`, and every tenant value under `tenants.d`. Review the
file, fill in any blank value, and keep it for step 2. Drop the old `.env`
afterwards, apart from `NEXT_PUBLIC_BASE_PATH`.

To stay on variables, add `--format env`. It writes the same settings to
`portal.env` as `PORTAL_*` variables, `PORTAL_DEFAULT_TENANT=d` and
`PORTAL_TENANT_D_…`; use that file in place of the old `.env`.

### If running the script is not feasible

The script needs a source checkout. Without one, write the configuration by
hand in either spelling below. Write each setting in one place; where both carry
it, the variable wins without a warning.

#### As a document

Write the document below with the deployment's values, strip the comments, and
save it as `portal.config.json`. Each comment names the old variable the key
replaces. Keep the `$schema` line so an editor completes and checks the keys
against [`portal.config.schema.json`](../portal.config.schema.json).

<!-- prettier-ignore -->
```jsonc
{
  "$schema": "./portal.config.schema.json",

  "origin": "https://portal.example.com",                          // BETTER_AUTH_URL, origin only
  "defaultTenant": "d",                                             // the tenant below
  "push": { "maxConnections": 10 },                                 // optional, PUSH_MAX_CONNECTIONS
  "imageCache": { "maxBytes": 2147483648 },                         // optional, IMAGE_CACHE_MAX_BYTES

  "tenants": {
    // The tenant id: the segment every address of the deployment carries.
    "d": {
      "sessionSecret": "<secret>",                                  // BETTER_AUTH_SECRET, one per tenant

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
        "tenantId": "<aos-tenant-id>"                               // optional, AOS_TENANT_ID (step 6)
      },

      // Given to the browser.
      "public": {
        "host": "https://portal.example.com",                       // GOOVEE_PUBLIC_HOST, the origin served on
        "paypal": { "clientId": "<paypal-client-id>" },             // optional, GOOVEE_PUBLIC_PAYPAL_CLIENT_ID
        "webPush": { "publicKey": "<vapid-public-key>" },           // optional, GOOVEE_PUBLIC_VAPID_PUBLIC_KEY
        "mattermost": { "host": "https://chat.example.com" },       // optional, GOOVEE_PUBLIC_MATTERMOST_HOST
        "keycloak": {                                               // optional, each key optional
          "buttonLabel": "Log In with SSO",                         // GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL
          "buttonImage": "/images/sso.svg"                          // GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE
        },
        "links": {                                                  // optional, news sharing, each key optional
          "linkedin": "https://linkedin.com/company/x",             // GOOVEE_PUBLIC_LINKEDIN_URL
          "twitter": "https://x.com/x",                             // GOOVEE_PUBLIC_TWITTER_URL
          "instagram": "https://instagram.com/x",                   // GOOVEE_PUBLIC_INSTAGRAM_URL
          "whatsapp": "https://wa.me/33000000000"                   // GOOVEE_PUBLIC_WHATSAPP_URL
        }
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

      "oauth": {                                                    // optional; keep the providers in use
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
      "upload": { "recordRetentionHours": 168 }                     // optional, UPLOAD_RECORD_RETENTION_HOURS
    }
  }
}
```

Fill in every key without an `optional` note in each section you keep. Remove a
section the deployment does not use in full. Do not carry over
`SHOW_GOOGLE_OAUTH`, `SHOW_KEYCLOAK_OAUTH`, `STRIPE_CLIENT_ID` or
`MULTI_TENANCY`: they have no key. A provider is offered as soon as its settings
are present.

#### As variables

Rename each old variable to the one beside it. To spell any other key from the
document, uppercase its path and join it with underscores, with the tenant entry
as `PORTAL_TENANT_D_…`: `tenants.d.aos.auth.apiKey` becomes
`PORTAL_TENANT_D_AOS_AUTH_API_KEY`. See [`env.example`](../env.example) for every setting.

| Was                                         | Now                                                        |
| ------------------------------------------- | ---------------------------------------------------------- |
| `BETTER_AUTH_URL`                           | `PORTAL_ORIGIN`                                            |
| —                                           | `PORTAL_DEFAULT_TENANT=d`                                  |
| `PUSH_MAX_CONNECTIONS`                      | `PORTAL_PUSH_MAX_CONNECTIONS`                              |
| `IMAGE_CACHE_MAX_BYTES`                     | `PORTAL_IMAGE_CACHE_MAX_BYTES`                             |
| `BETTER_AUTH_SECRET`                        | `PORTAL_TENANT_D_SESSION_SECRET`                           |
| `DATABASE_URL`                              | `PORTAL_TENANT_D_DB_URL`                                   |
| `AOS_URL`                                   | `PORTAL_TENANT_D_AOS_URL`                                  |
| `AOS_TENANT_ID`                             | `PORTAL_TENANT_D_AOS_TENANT_ID`                            |
| `DATA_STORAGE`                              | `PORTAL_TENANT_D_AOS_STORAGE`                              |
| `AOS_API_KEY`                               | `PORTAL_TENANT_D_AOS_AUTH_API_KEY`                         |
| `BASIC_AUTH_USERNAME`                       | `PORTAL_TENANT_D_AOS_AUTH_USERNAME`                        |
| `BASIC_AUTH_PASSWORD`                       | `PORTAL_TENANT_D_AOS_AUTH_PASSWORD`                        |
| `NOTIFICATION_WEBHOOK_SECRET`               | `PORTAL_TENANT_D_AOS_WEBHOOK_SECRET`                       |
| `PAYPAL_CLIENT_ID`                          | `PORTAL_TENANT_D_PAYMENTS_PAYPAL_CLIENT_ID`                |
| `PAYPAL_CLIENT_SECRET`                      | `PORTAL_TENANT_D_PAYMENTS_PAYPAL_CLIENT_SECRET`            |
| `PAYPAL_LIVE`                               | `PORTAL_TENANT_D_PAYMENTS_PAYPAL_LIVE`                     |
| `STRIPE_CLIENT_SECRET`                      | `PORTAL_TENANT_D_PAYMENTS_STRIPE_CLIENT_SECRET`            |
| `STRIPE_WEBHOOK_SECRET`                     | `PORTAL_TENANT_D_PAYMENTS_STRIPE_WEBHOOK_SECRET`           |
| `PBX_SITE`, `PBX_RANG`, `PBX_IDENTIFIANT`   | `PORTAL_TENANT_D_PAYMENTS_PAYBOX_{SITE,RANG,IDENTIFIANT}`  |
| `PBX_SECRET`, `PBX_PAYBOX`                  | `PORTAL_TENANT_D_PAYMENTS_PAYBOX_{SECRET,PAYBOX}`          |
| `PBX_BACKUP1`, `PBX_BACKUP2`                | `PORTAL_TENANT_D_PAYMENTS_PAYBOX_{BACKUP1,BACKUP2}`        |
| `UP2PAY_SITE`, `UP2PAY_RANG`, …             | `PORTAL_TENANT_D_PAYMENTS_UP2PAY_{SITE,RANG,…}`            |
| `UP2PAY_LEGACY_FORWARD_URL`                 | `PORTAL_TENANT_D_PAYMENTS_UP2PAY_LEGACY_FORWARD_URL`       |
| `HUBPISP_TOKEN_URL`, `HUBPISP_API_URL`, …   | `PORTAL_TENANT_D_PAYMENTS_HUBPISP_{TOKEN_URL,API_URL,…}`   |
| —                                           | `PORTAL_TENANT_D_PAYMENTS_HUBPISP_CERTS_DIR` (step 6)      |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, …    | `PORTAL_TENANT_D_MAIL_{HOST,PORT,USER,…}`                  |
| `MATTERMOST_TOKEN`                          | `PORTAL_TENANT_D_MATTERMOST_TOKEN`                         |
| `CREATE_MATTERMOST_USERS`                   | `PORTAL_TENANT_D_MATTERMOST_CREATE_USERS`                  |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`  | `PORTAL_TENANT_D_OAUTH_GOOGLE_{CLIENT_ID,CLIENT_SECRET}`   |
| `KEYCLOAK_ID`, `KEYCLOAK_SECRET`            | `PORTAL_TENANT_D_OAUTH_KEYCLOAK_{CLIENT_ID,CLIENT_SECRET}` |
| `KEYCLOAK_ISSUER`                           | `PORTAL_TENANT_D_OAUTH_KEYCLOAK_ISSUER`                    |
| `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`        | `PORTAL_TENANT_D_WEB_PUSH_{PRIVATE_KEY,SUBJECT}`           |
| `INCLUDE_LANGUAGE`                          | `PORTAL_TENANT_D_INCLUDE_LANGUAGE`                         |
| `UPLOAD_RECORD_RETENTION_HOURS`             | `PORTAL_TENANT_D_UPLOAD_RECORD_RETENTION_HOURS`            |
| `GOOVEE_PUBLIC_HOST`                        | `PORTAL_TENANT_D_PUBLIC_HOST`                              |
| `GOOVEE_PUBLIC_PAYPAL_CLIENT_ID`            | `PORTAL_TENANT_D_PUBLIC_PAYPAL_CLIENT_ID`                  |
| `GOOVEE_PUBLIC_VAPID_PUBLIC_KEY`            | `PORTAL_TENANT_D_PUBLIC_WEB_PUSH_PUBLIC_KEY`               |
| `GOOVEE_PUBLIC_MATTERMOST_HOST`             | `PORTAL_TENANT_D_PUBLIC_MATTERMOST_HOST`                   |
| `GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL` | `PORTAL_TENANT_D_PUBLIC_KEYCLOAK_BUTTON_LABEL`             |
| `GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE` | `PORTAL_TENANT_D_PUBLIC_KEYCLOAK_BUTTON_IMAGE`             |
| `GOOVEE_PUBLIC_{LINKEDIN,TWITTER,…}_URL`    | `PORTAL_TENANT_D_PUBLIC_LINKS_{LINKEDIN,TWITTER,…}`        |
| `SHOW_GOOGLE_OAUTH`, `SHOW_KEYCLOAK_OAUTH`  | dropped: a provider is offered when its variables are set  |
| `STRIPE_CLIENT_ID`, `MULTI_TENANCY`         | dropped                                                    |

Leave out every variable of a group the deployment does not use; that turns the
group off for the tenant. Treat every variable with no counterpart above as
optional; [`env.example`](../env.example) lists them all.

#### In either spelling

Write the origin (`PORTAL_ORIGIN`) and the tenant's public host
(`PORTAL_TENANT_D_PUBLIC_HOST`) as the same value, the origin the portal answers
on. A value that does not match the stored workspace addresses resolves no
workspace.

Write that origin as a scheme and a host only, with the port where it is not the
default. Do not add a path, query, fragment or trailing slash; start-up refuses
them.

The default tenant (`defaultTenant`, `PORTAL_DEFAULT_TENANT`) decides which
tenant `/` serves. A deployment configuring one tenant needs no value — that
tenant is the only answer and is filled in — so leave what the script wrote as
it is. It becomes required as soon as a second tenant is added and either is
reached under a path segment, and start-up then says so.

Set the Stripe webhook secret (`payments.stripe.webhookSecret`,
`PORTAL_TENANT_D_PAYMENTS_STRIPE_WEBHOOK_SECRET`) if the deployment takes bank
transfer. Card payments do not need it.

To serve the deployment under an id other than `d`, rename the tenant entry —
the key under `tenants`, or the segment in every `PORTAL_TENANT_D_…` variable —
and the default tenant together, then re-point every workspace address in AOS.
Use a lowercase letter followed by lowercase letters or digits, at most 15
characters, and none of `api`, `auth`, `deployment`, `images`, `locales`,
`pdfjs`, `pwa`, `website`. Do not rename while Up2Pay or Hub PISP payments are in
flight: those payments can no longer be settled.

## 2. Set the environment

Deliver the configuration from step 1 and one build-time variable:

<!-- prettier-ignore -->
```dotenv
# Inlined into the browser bundle when the portal is built, so a change to it
# needs a rebuild. Empty for a root deployment, or a subpath like '/portal'.
NEXT_PUBLIC_BASE_PATH=
```

Remove every old variable: `DATABASE_URL`, `AOS_*`, `BASIC_AUTH_*`,
`DATA_STORAGE`, `PAYPAL_*`, `STRIPE_*`, `PBX_*`, `UP2PAY_*`, `HUBPISP_*`,
`MAIL_*`, `MATTERMOST_*`, `VAPID_*`, `GOOGLE_*`, `KEYCLOAK_*`, `SHOW_*`,
`GOOVEE_PUBLIC_*`, `BETTER_AUTH_*`, `INCLUDE_LANGUAGE`,
`UPLOAD_RECORD_RETENTION_HOURS`, `PUSH_MAX_CONNECTIONS`, `IMAGE_CACHE_MAX_BYTES`
and `MULTI_TENANCY`. None of them is read any more. Do not replace
`MULTI_TENANCY` with anything: the configuration decides how many tenants there
are.

Put the document in the server's working directory. In the image that is
`/app`, so mount it with `-v ./portal.config.json:/app/portal.config.json:ro`;
for `next start`, put it beside the build. To layer files, name them the way the
`.env` files are named: `portal.config.production.local.json`,
`portal.config.local.json`, `portal.config.production.json`,
`portal.config.json`. The first to hold a setting wins.

Deliver variables the way the platform delivers them: a `.env` file beside the
build for `next start`, `docker run --env-file portal.env`, `env_file:` in
compose, a Kubernetes Secret with `envFrom`, or individual `-e` flags. In a
`.env` file, quote a value that holds a space, a `#` or a quote (in single
quotes), and write a literal `$` as `\$`. A variable overrides the same setting
in any `portal.config*.json`, so use the document for what every deployment
shares and a variable for what one deployment changes.

Keep `NEXT_PUBLIC_BASE_PATH` a variable in either case; no runtime file can
carry it.

On a build carrying a base path, put that subpath before every
`/<tenantId>/api/…` address below. Keep `PORTAL_ORIGIN` a bare origin.

### Setting or changing the base path moves every stored workspace URL

Move the stored workspace URLs whenever `NEXT_PUBLIC_BASE_PATH` is set or
changed. A workspace is found by its stored `url` matched in full, base path
included; with the URLs unmoved every page answers not-found and the log says
nothing.

In each tenant's own database, to add `/portal` to a deployment serving at the
root:

```sql
UPDATE portal_portal_workspace
SET
  url = replace(
    url,
    'https://portal.example.com/',
    'https://portal.example.com/portal/'
  );
```

To reverse the change, reverse the replacement; to change the base path's value,
replace the old subpath with the new one. Nothing checks that the two agree, so
open one workspace before announcing the deployment.

## 3. Re-point the gateway webhook URLs

Every webhook address takes the tenant in front of `/api`:

```
https://<host>/api/<path>   ->   https://<host>/<tenantId>/api/<path>
```

With `<tenantId>` as `d`, that is:

| Gateway         | Was                                  | Now                                    |
| --------------- | ------------------------------------ | -------------------------------------- |
| Stripe          | `/api/webhooks/stripe`               | `/d/api/webhooks/stripe`               |
| Up2Pay          | `/api/webhooks/up2pay`               | `/d/api/webhooks/up2pay`               |
| Hub PISP / BPCE | `/api/webhooks/hubpisp/<resourceId>` | `/d/api/webhooks/hubpisp/<resourceId>` |
| Paybox          | `/api/payment/paybox/validate`       | `/d/api/payment/paybox/validate`       |

Change Stripe in the dashboard under Webhooks, Up2Pay in the merchant
back-office as the IPN URL, and Hub PISP in the BPCE webhook registration —
dropping any `?tenant=` query it carries. Paybox sends its address with each
request, so there is nothing to register.

## 4. AOS notifications connector

Move the signing secret out of `axelor-config.properties` into the AOS
configuration, beside the address it posts to.

First set `encryption.password` in the AOS `axelor-config.properties`: it
encrypts the field below. Without it the secret is stored in cleartext and
nothing reports that; setting the password afterwards leaves the value cleartext
until it is entered again.

Then, in AOS, open the Goovee Portal app configuration and set:

- **Notification webhook url** =
  `https://<host>/d/api/webhooks/notifications`
- **Webhook secret** = the value of `PORTAL_TENANT_D_AOS_WEBHOOK_SECRET`, at
  most 132 bytes, the most an encrypted value fits in the column

Until the secret is set, AOS sends notifications unsigned and the portal refuses
every one of them.

Finally delete `portal.ws.secret` and `portal.ws.tenantId` from
`axelor-config.properties`.

## 5. Re-register the OAuth redirect URIs

Every redirect URI now carries the tenant in the provider id, and Google answers
on the same `oauth2` path as Keycloak:

```
https://<host>/<tenantId>/api/auth/oauth2/callback/<provider>-<tenantId>
```

Register that with each provider and remove the old one. With `<tenantId>` as
`d`, that is:

| Provider | Was                                  | Now                                      |
| -------- | ------------------------------------ | ---------------------------------------- |
| Google   | `/api/auth/callback/google`          | `/d/api/auth/oauth2/callback/google-d`   |
| Keycloak | `/api/auth/oauth2/callback/keycloak` | `/d/api/auth/oauth2/callback/keycloak-d` |

## 6. Provision storage and certificate mounts

Write every path in the configuration (`PORTAL_TENANT_D_AOS_STORAGE`,
`PORTAL_TENANT_D_PAYMENTS_HUBPISP_CERTS_DIR`) as an absolute path; a relative one
is read against the server process's working directory.

- Set `PORTAL_TENANT_D_AOS_STORAGE` to the AOS instance's `data.upload.dir`
  base.
- Set `PORTAL_TENANT_D_AOS_TENANT_ID` only where that AOS serves several tenants
  of its own. Files then sit under `<storage>/<tenantId>`, where AOS keeps that
  tenant's files.
- For Hub PISP, place `client.crt` and `private-key.pem` in the certificates
  directory.

## 7. Start and verify

1. Validate the configuration before starting anything. From a source checkout
   with the deployment's `.env` and `portal.config.json` beside it, run:

   ```bash
   NODE_ENV=production pnpm config:check
   ```

   Fix every fault it names; each is reported against the variable or file
   entry holding it. Once accepted, it lists the tenants and the address each is
   reached at; add `--sources` to see where every setting came from. It ends
   non-zero on a configuration start-up would refuse, so gate the deployment on
   it. It connects to nothing: check the database, AOS and mail host
   separately. Without a checkout, read the same verdict from the boot log in
   step 3.

2. Start AOS and the portal with everything above in place.
3. Check the boot log for a `could not read the configuration:` line followed by
   `No configuration found` or `Configuration is invalid`, which lists the
   settings at fault. Fix them before flipping traffic: the server answers its
   port either way and fails every request on a rejected configuration.
4. Flip traffic once the gateway (section 3) and provider (section 5)
   registrations point at the new addresses.
5. Watch gateway and notification delivery logs for 404s and signature failures,
   and re-point any registration that failed.

## 8. Serve a tenant on its own domain

Optional. Do this once the deployment above works. A tenant reached this way
carries no tenant segment: `https://acme.example.com/sales` rather than
`https://portal.example.com/acme/sales`.

Take the tenant out of service for the duration; each step below invalidates the
addresses the one before it used.

### Change the configuration

Route the tenant by host and point it at the new origin:

```dotenv
PORTAL_TENANT_ACME_ROUTING=host
PORTAL_TENANT_ACME_PUBLIC_HOST=https://acme.example.com
```

Give the host to no other tenant.

Leave `PORTAL_DEFAULT_TENANT` as it is, unless the new host is the one
`PORTAL_ORIGIN` names. In that case set the default tenant to this tenant;
naming any other is refused, because `/` on that origin would then have two
answers. Removing it instead works only where no tenant is left that is reached
under a path segment — one of those requires a default.

### Configure the proxy

Pass the visitor's host through:

<!-- prettier-ignore -->
```nginx
proxy_set_header Host             $http_host;
proxy_set_header X-Forwarded-Host $http_host;
```

Set both headers explicitly. By default nginx sends its own upstream address as
`Host` and no `X-Forwarded-*` header, and the deployment then resolves no tenant
and refuses every form submission.

Use `$http_host`, not `$host`. `$host` drops the port, so a tenant served on a
port its scheme does not imply is never resolved.

Serve the new host over HTTPS. Notifications, offline caching and installing the
app all need it.

Point liveness and readiness probes at `/deployment/info`. Page addresses answer
not-found on a host no tenant declares; `/deployment/info` answers on any host.

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

### Delete the old push subscriptions

Before the tenant goes back into service, run in that tenant's own database:

```sql
DELETE FROM portal_push_subscription;
```

Left in place, they keep being delivered, and every notification arrives twice
once visitors re-grant them on the new host.

### Re-register the addresses

Re-register every address from sections 3, 4 and 5: the host becomes the
tenant's own, and the tenant segment comes off the path.

| Registration                    | Was                                                  | Now                                           |
| ------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| Gateway webhooks (section 3)    | `portal.example.com/acme/api/…`                      | `acme.example.com/api/…`                      |
| AOS notifications (section 4)   | `portal.example.com/acme/api/…`                      | `acme.example.com/api/…`                      |
| OAuth redirect URIs (section 5) | `portal.example.com/acme/api/auth/oauth2/callback/…` | `acme.example.com/api/auth/oauth2/callback/…` |

### Restart and verify

1. `NODE_ENV=production pnpm config:check` — the tenant is listed with its new
   address and `[routed by host]`.
2. Restart the portal.
3. Open `https://acme.example.com/` and confirm it lands on a workspace.
4. Open `https://portal.example.com/acme` and confirm it answers 307 to
   `https://acme.example.com/`.
5. Sign in on the new host, then confirm a notification arrives and the app can
   be installed.

### What the move costs

- Everyone signs in again.
- Everyone re-grants notifications.
- An installed app has to be removed and re-installed from the new address.
- Every address under the old origin answers 307 to the new one for as long as
  it still reaches the deployment, the sign-in screens included — but without the
  address the visitor was heading for, since that was written for the old origin,
  so the screen sends them to their tenant's landing page instead. Static files
  and the tenant's manifest answer in place.
- The session cookie made on the old origin is left behind there. It is written
  for that host alone, so the new origin never receives it and nothing on the old
  one reads it any more; it expires on its own within a week. Ask signed-in users
  to sign out before the move if you would rather it went at once.

### Workspace names to avoid

Before the move, rename any workspace of this tenant whose slug is `api`,
`auth`, `deployment`, `images`, `locales`, `pdfjs`, `pwa`, `website` or
`manifest.webmanifest`, or whose slug carries a dot (`sales.v2`). On its own
domain the first path segment is the workspace name, and those addresses are
answered by the deployment itself. AOS accepts all of them and nothing reports
the clash.
