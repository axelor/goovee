# Multi-tenancy migration runbook (#113733)

Migrate a Goovee deployment to the multi-tenant configuration model. Perform the
steps in order.

---

## 1. Create the configuration document

All configuration is one JSON document: a reserved `"$global"` section plus one
entry per tenant, keyed by the tenant id (the URL path segment, letters only).
Single-tenant is one entry, keyed `"d"`.

`$global`:

| Field                | Required | From env                |
| -------------------- | -------- | ----------------------- |
| `betterAuthSecret`   | yes      | `BETTER_AUTH_SECRET`    |
| `betterAuthUrl`      | yes      | `BETTER_AUTH_URL`       |
| `pushMaxConnections` | no       | `PUSH_MAX_CONNECTIONS`  |
| `imageCacheMaxBytes` | no       | `IMAGE_CACHE_MAX_BYTES` |

Write `betterAuthUrl` as the origin the deployment is served on — scheme and
host, with no path, query or fragment.

Each tenant entry — declare every capability the tenant uses; nothing is
inherited from another tenant or the environment:

| Field                                     | Required | From env                                                                                                                                                                    |
| ----------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db.url`                                  | yes      | `DATABASE_URL`                                                                                                                                                              |
| `aos.url`                                 | yes      | `AOS_URL`                                                                                                                                                                   |
| `aos.storage`                             | yes      | `DATA_STORAGE` (the AOS `data.upload.dir` base)                                                                                                                             |
| `aos.auth.apiKey`                         | one of   | `AOS_API_KEY`                                                                                                                                                               |
| `aos.auth.username` + `aos.auth.password` | one of   | `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD`                                                                                                                                |
| `aos.aosTenantId`                         | no       | `AOS_TENANT_ID`                                                                                                                                                             |
| `aos.webhookSecret`                       | no       | `NOTIFICATION_WEBHOOK_SECRET`                                                                                                                                               |
| `publicEnv`                               | yes      | the `GOOVEE_PUBLIC_*` vars                                                                                                                                                  |
| `payments.paypal`                         | no       | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_LIVE`                                                                                                                   |
| `payments.stripe`                         | no       | `STRIPE_CLIENT_SECRET`, `STRIPE_WEBHOOK_SECRET`                                                                                                                             |
| `payments.paybox`                         | no       | `PBX_SITE`, `PBX_RANG`, `PBX_IDENTIFIANT`, `PBX_SECRET`, `PBX_PAYBOX`, `PBX_BACKUP1`, `PBX_BACKUP2`                                                                         |
| `payments.up2pay`                         | no       | `UP2PAY_SITE`, `UP2PAY_RANG`, `UP2PAY_IDENTIFIANT`, `UP2PAY_SECRET`, `UP2PAY_PAYBOX`, `UP2PAY_LEGACY_FORWARD_URL`                                                           |
| `payments.hubpisp`                        | no       | `HUBPISP_TOKEN_URL`, `HUBPISP_API_URL`, `HUBPISP_CLIENT_ID`, `HUBPISP_CLIENT_SECRET`, `HUBPISP_CERT_FINGERPRINT`, `HUBPISP_BENEFICIARY_NAME`, `HUBPISP_IBAN`, `HUBPISP_BIC` |
| `mail`                                    | no       | `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_EMAIL`, `MAIL_MAX_CONNECTIONS`                                                                 |
| `mattermost`                              | no       | `MATTERMOST_TOKEN`, `CREATE_MATTERMOST_USERS`                                                                                                                               |
| `webPush`                                 | no       | `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`                                                                                                                                        |
| `oauth.google`                            | no       | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                                                                                                                  |
| `oauth.keycloak`                          | no       | `KEYCLOAK_ID`, `KEYCLOAK_SECRET`, `KEYCLOAK_ISSUER`                                                                                                                         |
| `includeLanguage`                         | no       | `INCLUDE_LANGUAGE`                                                                                                                                                          |
| `uploadRecordRetentionHours`              | no       | `UPLOAD_RECORD_RETENTION_HOURS`                                                                                                                                             |

`payments.hubpisp` needs one more field that no environment variable carried:
`certsDir`. Migrating writes `certs/hubpisp`, the path the previous release
read; a tenant added by hand needs its own.

Browser variables (`publicEnv`) keys: `GOOVEE_PUBLIC_HOST`,
`GOOVEE_PUBLIC_PAYPAL_CLIENT_ID`, `GOOVEE_PUBLIC_LINKEDIN_URL`,
`GOOVEE_PUBLIC_TWITTER_URL`, `GOOVEE_PUBLIC_INSTAGRAM_URL`,
`GOOVEE_PUBLIC_WHATSAPP_URL`, `GOOVEE_PUBLIC_MATTERMOST_HOST`,
`GOOVEE_PUBLIC_VAPID_PUBLIC_KEY`, `GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_LABEL`,
`GOOVEE_PUBLIC_KEYCLOAK_OAUTH_BUTTON_IMAGE`.

Procedure:

- Single-tenant: run `pnpm tenants:migrate` to write `tenants.config.json` from
  the current `.env`. Review it and fill any blank required fields.
- Multi-tenant: copy `tenants.config.example.json`, add one entry per tenant,
  set `"$schema": "./tenants.config.schema.json"` for editor validation.

## 2. Set the environment

Runtime:

- `MULTI_TENANCY=true` (multi-tenant) — omit or `false` for single-tenant.
- `TENANTS_CONFIG_FILE=<path to the document>` — mount as a secret. Or
  `TENANTS_CONFIG=<inline JSON>` when not using a file.

Build:

- `NEXT_PUBLIC_BASE_PATH` — pass as a build arg. Empty for a root deployment, or
  a subpath such as `/portal`.

Remove every other env var (`DATABASE_URL`, `AOS_*`, `BASIC_AUTH_*`,
`DATA_STORAGE`, `PAYPAL_*`, `STRIPE_*`, `PBX_*`, `UP2PAY_*`, `HUBPISP_*`,
`MAIL_*`, `MATTERMOST_*`, `VAPID_*`, `GOOGLE_*`, `KEYCLOAK_*`, `SHOW_*`,
`GOOVEE_PUBLIC_*`, `BETTER_AUTH_*`, `INCLUDE_LANGUAGE`,
`UPLOAD_RECORD_RETENTION_HOURS`, `PUSH_MAX_CONNECTIONS`,
`IMAGE_CACHE_MAX_BYTES`).

## 3. Register webhook and payment URLs (per tenant)

| Gateway         | New URL (per tenant)                                 | Where to change                                               |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------- |
| Stripe          | `/api/tenant/<tenant>/webhooks/stripe`               | Stripe dashboard → Webhooks — one endpoint per tenant account |
| Up2Pay          | `/api/tenant/<tenant>/webhooks/up2pay`               | Up2Pay merchant back-office (IPN URL)                         |
| Hub PISP / BPCE | `/api/tenant/<tenant>/webhooks/hubpisp/<resourceId>` | BPCE webhook registration — drop any `?tenant=` query         |
| Paybox          | `/api/tenant/<tenant>/payment/paybox/validate`       | None — sent per request                                       |

Point each tenant's gateway account at its own tenant path.

## 4. AOS notifications connector (per-tenant webhook)

Ship the `axelor-portal` change (branch `RM-113733-multi-tenancy`) with go-live.
The connector now reads its target URL and signing secret per tenant from each
tenant's own `AppGooveePortal` record (multi-DB AOS ⇒ the record is per-tenant),
POSTs to the URL verbatim, signs the body with that tenant's secret, and no
longer sends `tenantId` in the body. Per tenant, on `AppGooveePortal`:

- `notificationWebhookUrl` = `https://<goovee-host>/api/tenant/<goovee-tenant>/webhooks/notifications`
  (the full tenant-scoped URL — the Goovee tenant is in the path).
- `webhookSecret` = that Goovee tenant's `aos.webhookSecret` (stored encrypted).

The global `portal.ws.secret` / `portal.ws.tenantId` settings are no longer used.

## 5. Register OAuth redirect URIs (per tenant)

For each tenant with `oauth.google` or `oauth.keycloak`, register with the IdP:

```
https://<host>/api/auth/oauth2/callback/<provider>-<tenantId>
```

where `<provider>` is `google` or `keycloak`. Each Keycloak tenant uses its own
realm/issuer and client.

## 6. Provision storage and certificate mounts (per tenant)

Every path in the document (`aos.storage`, `certsDir`) is read against the
server process's working directory. Give mounted volumes absolute paths.

- Set `aos.storage` to the AOS instance's `data.upload.dir` base and back it
  with a mounted volume. For a tenant on a shared AOS (`aosTenantId` set,
  topology B), goovee reads and writes under `<aos.storage>/<aosTenantId>` to
  match AOP's per-tenant subdirectory; a dedicated AOS (topology A) uses the
  path as-is. Tenants sharing one AOS therefore share the same `aos.storage`
  base value.
- For Hub PISP, place `client.crt` and `private-key.pem` in each tenant's
  `certsDir`. Every tenant declaring `payments.hubpisp` needs one, and no two
  may share a directory.

## 7. Build and deploy

- Build the `goovee-ce` image once; inject the document at runtime.
- `NEXT_PUBLIC_BASE_PATH` is the only build-time value.
- After any `goovee/schema/*.json` change, run `pnpm generate` before building.

## 8. Cut over and verify

1. Deploy the application with the matching AOS connector change (step 4) live.
2. Register OAuth redirect URIs (step 5) and gateway webhook URLs (step 3).
3. Confirm the document was accepted: it was rejected if the boot log carries
   `could not read the configuration`. The server starts either way, so that
   line is what to check.
4. Flip traffic.
5. Watch gateway and notification delivery logs for 404s and signature
   failures, and re-point any registration that failed.
