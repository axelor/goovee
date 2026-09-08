# Portal setup guide — tenants and environment

Set up a new portal deployment from nothing. Perform the sections in order.

A **tenant** is one customer of the deployment, with its own database, its own AOS
instance and its own addresses. A deployment serving one customer has one tenant.
A tenant is declared by its own settings and by nothing else, so adding a
customer later means adding one more block of them.

---

## 1. Prerequisites

Have the following in place:

- **PostgreSQL**, holding each tenant's existing AOS database — not a fresh,
  empty one. See section 6.1.
- **An AOS instance** — the Axelor ERP backend each tenant's portal draws its data
  from — per tenant, or one AOS instance shared by all tenants with AOS
  multi-tenancy switched on.
- **Either a checkout of the portal source**, with `pnpm` available, to build and
  run from — section 18.1 — **or the published container image**, section 18.2.
- **A proxy** (nginx, Traefik, a cloud load balancer) in front of the portal.

Two decisions shape every address in the deployment. Make them before starting:

1. The **tenant id** for each customer — section 3.
2. Whether tenants **share one web address** or each has **its own** — section 7.

---

## 2. The two spellings of the configuration

Every setting — databases, AOS, payments, mail, sign-in, push — is one
environment variable starting with `PORTAL_`, and the name spells the setting:
`PORTAL_ORIGIN` is the deployment's origin, `PORTAL_TENANT_ACME_DB_URL` the
database of the tenant `acme`. Names are uppercase with underscores.

The same settings can be written as a JSON document instead: `portal.config.json`
in the directory the portal is started from. This guide writes them as JSON. Each
key maps to a variable mechanically — the path uppercased and joined with
underscores, a tenant's keys under `PORTAL_TENANT_<ID>_`:

| Key                                  | Variable                                    |
| ------------------------------------ | ------------------------------------------- |
| `origin`                             | `PORTAL_ORIGIN`                             |
| `tenants.acme.db.url`                | `PORTAL_TENANT_ACME_DB_URL`                 |
| `tenants.acme.oauth.google.clientId` | `PORTAL_TENANT_ACME_OAUTH_GOOGLE_CLIENT_ID` |

Write each setting in one place. Where both carry it, the variable wins — section
16 covers the layering. [`env.example`](env.example) lists every variable, and
[`portal.config.schema.json`](portal.config.schema.json) every key.

One setting is a variable and nothing else: `NEXT_PUBLIC_BASE_PATH`, the path
prefix the portal is served under. It is fixed into the application when the
portal is built, so no configuration file can carry it. Leave it empty unless
section 7.3 applies.

---

## 3. Choose the tenant ids

A tenant id is a short name for one customer. It appears in web addresses, so
choose a name suitable for customers to see — usually the company name in
lowercase, such as `acme`.

Rules, all enforced at startup:

- Start with a lowercase letter.
- Continue with lowercase letters or digits — no hyphens, no underscores, no
  capitals.
- At most **15 characters**.
- Not one of these reserved words: `api`, `auth`, `deployment`, `images`,
  `locales`, `pdfjs`, `pwa`, `website`.

Accepted: `acme`, `boltfr`, `client01`. Rejected: `1acme` (starts with a digit),
`bolt-fr` (hyphen), `acme_fr` (underscore), `Acme` (capital), `api` (reserved).

A single-customer deployment still needs one id. It becomes part of every address
unless host routing is used — section 7.2.

---

## 4. Create the configuration file

Create `portal.config.json` in the directory the portal is started from — beside
`server.js` for a built deployment, the checkout root for `pnpm dev`. Nothing
names the path; only that directory is read.

The document holds the deployment's settings at the top level, then one
section per tenant under `tenants`, keyed by the tenant id.

Start from this skeleton and complete it through the sections that follow:

```json
{
  "$schema": "./portal.config.schema.json",
  "origin": "https://portal.example.com",
  "defaultTenant": "acme",
  "tenants": {
    "acme": {
      "sessionSecret": "",
      "db": {
        "url": "postgres://portal:secret@localhost:5432/portal-acme"
      },
      "aos": {
        "url": "https://erp.example.com/axelor-erp",
        "storage": "/var/lib/portal/acme/upload",
        "auth": {
          "apiKey": ""
        }
      },
      "public": {
        "host": "https://portal.example.com"
      }
    }
  }
}
```

The same settings as variables:

```
PORTAL_ORIGIN=https://portal.example.com
PORTAL_DEFAULT_TENANT=acme
PORTAL_TENANT_ACME_SESSION_SECRET=
PORTAL_TENANT_ACME_DB_URL=postgres://portal:secret@localhost:5432/portal-acme
PORTAL_TENANT_ACME_AOS_URL=https://erp.example.com/axelor-erp
PORTAL_TENANT_ACME_AOS_STORAGE=/var/lib/portal/acme/upload
PORTAL_TENANT_ACME_AOS_AUTH_API_KEY=
PORTAL_TENANT_ACME_PUBLIC_HOST=https://portal.example.com
```

The `$schema` line is optional. With it, editors such as VS Code offer
autocompletion and underline mistakes while the file is edited. Point it at
[`portal.config.schema.json`](portal.config.schema.json).

Every section from here on gives both spellings: the keys as the file holds them,
then the variables that carry the same settings. `<ID>` stands for the tenant id,
uppercased — `PORTAL_TENANT_ACME_…` for the tenant `acme`.

---

## 5. Configure the deployment

These settings sit at the top level of the file, beside `tenants`. They belong to
the whole deployment rather than to any one tenant.

### `origin` / `PORTAL_ORIGIN` — required

The address that answers pages belonging to no single tenant: `/`, and the
deployment's own routes under `/deployment`.

Give the **scheme and host only**, with no trailing slash and no path:

- Accepted: `https://portal.example.com`
- Accepted: `http://localhost:3000`
- Rejected: `https://portal.example.com/` (trailing slash)
- Rejected: `https://portal.example.com/portal` (contains a path)
- Rejected: `https://portal.example.com:443` (a scheme's own port, written out)
- Rejected: `https://portal_one.example.com` (underscore in the host)

Every tenant address must use the **same scheme** as this one. A deployment mixing
`http` for one tenant and `https` for another is refused at startup.

### `defaultTenant` / `PORTAL_DEFAULT_TENANT` — the tenant `/` leads to

The value must be the id of a configured tenant.

A deployment with one tenant can leave it out — that tenant is the default. With
several, name the tenant `/` leads to; section 7.2 has the one exception.

### `push.maxConnections` / `PORTAL_PUSH_MAX_CONNECTIONS` — optional

Push notifications in flight at once, for the whole deployment. Defaults to `10`.
Leave it out unless push delivery is slow.

### `imageCache.maxBytes` / `PORTAL_IMAGE_CACHE_MAX_BYTES` — optional

Disk the resized-image cache may use, in bytes. One cache serves every tenant.
Defaults to `2147483648`, which is 2 GiB.

---

## 6. Configure a tenant

The tenant is named by its id from section 3: that is the key it sits under in
`tenants`, and the `<ID>` segment of every variable below. Repeat this section
once per tenant.

Every tenant needs four things: a signing key, a database, an AOS connection and
an address.

### 6.0 `sessionSecret` / `PORTAL_TENANT_<ID>_SESSION_SECRET` — required

The key that signs this tenant's sign-in sessions. Generate a distinct one per
tenant:

```
openssl rand -base64 32
```

Paste the output in. Keep it secret and keep it stable — changing it signs that
tenant's users out.

### 6.1 The database

```json
"db": {
  "url": "postgres://portal:secret@db.example.com:5432/portal-acme"
}
```

```
PORTAL_TENANT_<ID>_DB_URL=postgres://portal:secret@db.example.com:5432/portal-acme
```

This is **the tenant's AOS database**, not a new empty one. The portal reads the
AOS tables in place and creates a handful of its own on first start.

Point it at an empty database and the portal starts, but there is no workspace
(the last segment of a tenant's address — section 7.4) and no user: every page
answers "not found" and nobody can sign in.

`db.url`, `aos.url` and `aos.storage` must all address **the same AOS instance**.
Every tenant needs its own database.

### 6.2 The AOS connection

```json
"aos": {
  "url": "https://erp.example.com/axelor-erp",
  "storage": "/var/lib/portal/acme/upload",
  "auth": {
    "apiKey": "abcd1234…"
  },
  "webhookSecret": "…"
}
```

```
PORTAL_TENANT_<ID>_AOS_URL=https://erp.example.com/axelor-erp
PORTAL_TENANT_<ID>_AOS_STORAGE=/var/lib/portal/acme/upload
PORTAL_TENANT_<ID>_AOS_AUTH_API_KEY=abcd1234…
PORTAL_TENANT_<ID>_AOS_WEBHOOK_SECRET=…
```

- **`url`** — where the AOS instance answers, including its application path.
- **`storage`** — the AOS instance's `data.upload.dir`, as AOS is configured with
  it. Point it at a mounted volume.
- **`auth`** — how the portal signs in to AOS. Two forms:

  - `apiKey` — AOS 9 and later. Generate it in AOS under
    **Preferences → API Keys**.
  - `username` and `password`, as `PORTAL_TENANT_<ID>_AOS_AUTH_USERNAME` and
    `…_AOS_AUTH_PASSWORD`. AOS needs `auth.local.basic-auth = direct` in
    `axelor-config.properties`; it is off by default.

  Set one form or the other. With both present, the API key is used.

- **`webhookSecret`** — optional; required only for notifications. See section 12.

### 6.3 One AOS instance per tenant, or one shared

**One AOS per tenant**, the usual arrangement: give each tenant its own `url` and
leave `aos.tenantId` out.

**One AOS shared by several tenants**, using AOS multi-tenancy: give every tenant
the same `url` and add `aos.tenantId`, the name AOS knows the tenant by:

```json
"db": {"url": "postgres://portal:secret@db.example.com:5432/acme-db"},
"aos": {
  "url": "https://erp.example.com/axelor-erp",
  "tenantId": "acme-db",
  "storage": "/var/lib/portal/shared/upload",
  "auth": {"apiKey": "…"}
}
```

```
PORTAL_TENANT_<ID>_AOS_TENANT_ID=acme-db
```

`db.url` still names each tenant's own database. `url` and `storage` are the same
for every tenant on the instance, and each needs its own `aos.tenantId`: files are
read and written under `<storage>/<aos.tenantId>`.

The value `default` means no subdirectory — files sit directly under `storage`.

The AOS tenant name is independent of the portal tenant id; the two may differ.

### 6.4 The address

```json
"public": {
  "host": "https://portal.example.com"
}
```

```
PORTAL_TENANT_<ID>_PUBLIC_HOST=https://portal.example.com
```

Scheme and host only, no trailing slash — the same format as `origin`, and the
same scheme.

Several tenants may share one host. That is the ordinary arrangement; section 7.1
covers the addresses it produces.

Everything under `public` is sent to the visitor's browser. Place no passwords or
secrets there; nothing outside it is sent.

---

## 7. Configure the addresses

Two choices decide what customer addresses look like: how each tenant is routed,
and whether the portal is served under a path prefix.

### 7.1 Path routing — the default

Tenants share one host, and the tenant id appears in the address.

```json
"tenants": {
  "acme": {"public": {"host": "https://portal.example.com"}},
  "bolt": {"public": {"host": "https://portal.example.com"}}
}
```

```
PORTAL_TENANT_ACME_PUBLIC_HOST=https://portal.example.com
PORTAL_TENANT_BOLT_PUBLIC_HOST=https://portal.example.com
```

Resulting addresses:

```
https://portal.example.com/acme/<workspace>
https://portal.example.com/bolt/<workspace>
```

Nothing to set — `path` is the default.

### 7.2 Host routing — a domain per tenant

The tenant has its own host, and the tenant id disappears from the address.

Set `routing` to `"host"` and give the tenant a host no other tenant is served
on:

```json
"tenants": {
  "acme": {
    "routing": "host",
    "public": {"host": "https://acme.example.com"}
  }
}
```

```
PORTAL_TENANT_ACME_ROUTING=host
PORTAL_TENANT_ACME_PUBLIC_HOST=https://acme.example.com
```

Resulting address:

```
https://acme.example.com/<workspace>
```

**The proxy must pass the visitor's address through.** Set `X-Forwarded-Host` (or
`Host`) to the address the visitor used, not the address of the portal behind the
proxy. In nginx:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```

Without this the portal cannot determine which tenant a request is for: pages
answer "not found" and every form submission is refused.

Give the host a DNS record and a TLS certificate.

Where **every** tenant is routed this way, `defaultTenant` can be left out: each
tenant answers `/` on its own host.

### 7.3 A base path — serving under a path prefix

Use a base path where the portal shares a domain with something else and every
address has to carry a prefix, such as `https://example.com/portal`.

Set it in `.env` **before building**:

```
NEXT_PUBLIC_BASE_PATH=/portal
```

Write it with a leading slash and no trailing slash, then build. The value is
fixed into the application at build time; changing it later requires another
build.

Leave it empty to serve from the top of the domain.

A tenant's `public.host` and the deployment's `origin` still hold the host
**only** — never the base path. The portal adds the base path itself.

Base path cannot be set on the published container image, which is built with no
base path: passing the variable to `docker run` changes nothing. A prefixed
deployment has to build an image of its own — section 18.2.

### 7.4 The combinations

The last segment of each address below is the **workspace**. Workspaces are
created in AOS, not in this file, and one tenant may have several. Tenant `acme`:

| Routing          | Base path | Address                                              |
| ---------------- | --------- | ---------------------------------------------------- |
| `path` (default) | empty     | `https://portal.example.com/acme/<workspace>`        |
| `path` (default) | `/portal` | `https://portal.example.com/portal/acme/<workspace>` |
| `host`           | empty     | `https://acme.example.com/<workspace>`               |
| `host`           | `/portal` | `https://acme.example.com/portal/<workspace>`        |

Routing is set per tenant. The base path is set once for the deployment, in the
environment at build time.

### 7.5 Workspace names to avoid

Workspaces are named in AOS. A name the tenant already answers itself is never
reached, and nothing reports the clash:

- **`routing` set to `path`** — avoid `api`, `auth` and `manifest.webmanifest`.
- **`routing` set to `host`** — the workspace sits at the root of the origin, so
  avoid those three and the names the deployment answers there: `deployment`,
  `images`, `locales`, `pdfjs`, `pwa`, `website`, and any name carrying a dot.

AOS accepts every one of them, so check the workspace names before switching a
tenant to `host` routing.

### 7.6 These choices are recorded in AOS

Each workspace in AOS stores its full address — host, base path and tenant
segment — and it must match the configuration exactly. Changing `routing`,
`public.host` or `NEXT_PUBLIC_BASE_PATH` after workspaces exist leaves every
stored address wrong, and the tenant then has no reachable workspace even though
the configuration passes every check.

Settle the addresses before creating workspaces. Changing them afterwards means
updating the stored workspace addresses in AOS to match.

### 7.7 Mixing both

One tenant may be host-routed while others share an address. Set `routing` only on
the tenant with its own domain:

```json
"origin": "https://portal.example.com",
"defaultTenant": "bolt",
"tenants": {
  "acme": {
    "routing": "host",
    "public": {"host": "https://acme.example.com"}
  },
  "bolt": {
    "public": {"host": "https://portal.example.com"}
  }
}
```

```
PORTAL_ORIGIN=https://portal.example.com
PORTAL_DEFAULT_TENANT=bolt
PORTAL_TENANT_ACME_ROUTING=host
PORTAL_TENANT_ACME_PUBLIC_HOST=https://acme.example.com
PORTAL_TENANT_BOLT_PUBLIC_HOST=https://portal.example.com
```

That serves `https://acme.example.com/<workspace>` for one tenant and
`https://portal.example.com/bolt/<workspace>` for the other. Point both hosts at the
portal in the proxy.

---

## 8. Configure mail

Mail carries sign-up confirmations, password resets and notification emails. Add a
`mail` section to the tenant:

```json
"mail": {
  "host": "smtp.example.com",
  "port": 587,
  "secure": false,
  "user": "no-reply@example.com",
  "password": "…",
  "email": "no-reply@example.com",
  "maxConnections": 10
}
```

| Field            | Variable, after `PORTAL_TENANT_<ID>_` | Required | Notes                                                |
| ---------------- | ------------------------------------- | -------- | ---------------------------------------------------- |
| `host`           | `MAIL_HOST`                           | yes      | The SMTP server.                                     |
| `port`           | `MAIL_PORT`                           | yes      | Usually `587`, or `465` with `secure` set to `true`. |
| `secure`         | `MAIL_SECURE`                         | no       | `true` for a connection encrypted from the start.    |
| `user`           | `MAIL_USER`                           | yes      | The mailbox to send through.                         |
| `password`       | `MAIL_PASSWORD`                       | yes      | Its password.                                        |
| `email`          | `MAIL_EMAIL`                          | no       | The "from" address. Defaults to `user`.              |
| `maxConnections` | `MAIL_MAX_CONNECTIONS`                | no       | Simultaneous connections allowed. Defaults to `10`.  |

Set `maxConnections` to the mail provider's limit. For a Microsoft 365 mailbox,
which allows three, set `3`.

Two tenants sending through the **same mailbox** must give the same
`maxConnections`. Differing values are refused at startup.

Leave the `mail` section out and the tenant sends no email.

---

## 9. Configure payments

Add a `payments` section to the tenant, with one block per provider offered. A
provider left out is unavailable to that tenant. Every tenant uses its own
merchant account.

Every variable in this section starts with `PORTAL_TENANT_<ID>_PAYMENTS_`.

Some providers require a webhook address registered in their dashboard. Each one
below is written out for the tenant `acme`, in every routing and base-path
combination of section 7.4; substitute this deployment's own host, tenant id and
base path.

### 9.1 PayPal

```json
"payments": {
  "paypal": {
    "clientId": "…",
    "clientSecret": "…",
    "live": true
  }
}
```

```
PORTAL_TENANT_<ID>_PAYMENTS_PAYPAL_CLIENT_ID=…
PORTAL_TENANT_<ID>_PAYMENTS_PAYPAL_CLIENT_SECRET=…
PORTAL_TENANT_<ID>_PAYMENTS_PAYPAL_LIVE=true
```

Leave `live` out, or set `false`, to run against PayPal's sandbox. Set `true` to
take real payments.

PayPal also needs the client id in the browser:

```json
"public": {
  "paypal": {"clientId": "…"}
}
```

```
PORTAL_TENANT_<ID>_PUBLIC_PAYPAL_CLIENT_ID=…
```

### 9.2 Stripe

```json
"payments": {
  "stripe": {
    "clientSecret": "sk_live_…",
    "webhookSecret": "whsec_…"
  }
}
```

```
PORTAL_TENANT_<ID>_PAYMENTS_STRIPE_CLIENT_SECRET=sk_live_…
PORTAL_TENANT_<ID>_PAYMENTS_STRIPE_WEBHOOK_SECRET=whsec_…
```

In the Stripe dashboard, add a webhook endpoint pointing at:

```
path routing             https://portal.example.com/acme/api/webhooks/stripe
path routing + /portal   https://portal.example.com/portal/acme/api/webhooks/stripe
host routing             https://acme.example.com/api/webhooks/stripe
host routing + /portal   https://acme.example.com/portal/api/webhooks/stripe
```

Stripe then displays the signing secret. Put it in `webhookSecret`.

### 9.3 Paybox

```json
"payments": {
  "paybox": {
    "site": "…",
    "rang": "…",
    "identifiant": "…",
    "secret": "…",
    "paybox": "https://tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi",
    "backup1": "https://tpeweb1.paybox.com/cgi/MYchoix_pagepaiement.cgi",
    "backup2": "https://tpeweb2.paybox.com/cgi/MYchoix_pagepaiement.cgi"
  }
}
```

```
PORTAL_TENANT_<ID>_PAYMENTS_PAYBOX_SITE=…
PORTAL_TENANT_<ID>_PAYMENTS_PAYBOX_RANG=…
PORTAL_TENANT_<ID>_PAYMENTS_PAYBOX_IDENTIFIANT=…
PORTAL_TENANT_<ID>_PAYMENTS_PAYBOX_SECRET=…
PORTAL_TENANT_<ID>_PAYMENTS_PAYBOX_PAYBOX=https://tpeweb.paybox.com/cgi/MYchoix_pagepaiement.cgi
PORTAL_TENANT_<ID>_PAYMENTS_PAYBOX_BACKUP1=https://tpeweb1.paybox.com/cgi/MYchoix_pagepaiement.cgi
PORTAL_TENANT_<ID>_PAYMENTS_PAYBOX_BACKUP2=https://tpeweb2.paybox.com/cgi/MYchoix_pagepaiement.cgi
```

`site`, `rang`, `identifiant` and `secret` come from Paybox. `paybox` is the
address of the payment page; `backup1` and `backup2` are optional stand-ins used
when the first is unreachable.

Paybox needs no webhook address registered: the portal sends its own confirmation
address with each payment.

### 9.4 Up2Pay

The same fields as Paybox except `backup1` and `backup2`, which Up2Pay does not
take, plus one addition. Every block rejects keys it does not recognise: a copied
Paybox block makes the configuration invalid.

```json
"payments": {
  "up2pay": {
    "site": "…",
    "rang": "…",
    "identifiant": "…",
    "secret": "…",
    "paybox": "https://…",
    "legacyForwardUrl": "https://old-erp.example.com/ipn"
  }
}
```

```
PORTAL_TENANT_<ID>_PAYMENTS_UP2PAY_SITE=…
PORTAL_TENANT_<ID>_PAYMENTS_UP2PAY_RANG=…
PORTAL_TENANT_<ID>_PAYMENTS_UP2PAY_IDENTIFIANT=…
PORTAL_TENANT_<ID>_PAYMENTS_UP2PAY_SECRET=…
PORTAL_TENANT_<ID>_PAYMENTS_UP2PAY_PAYBOX=https://…
PORTAL_TENANT_<ID>_PAYMENTS_UP2PAY_LEGACY_FORWARD_URL=https://old-erp.example.com/ipn
```

Register this webhook address with Up2Pay:

```
path routing             https://portal.example.com/acme/api/webhooks/up2pay
path routing + /portal   https://portal.example.com/portal/acme/api/webhooks/up2pay
host routing             https://acme.example.com/api/webhooks/up2pay
host routing + /portal   https://acme.example.com/portal/api/webhooks/up2pay
```

`legacyForwardUrl` is optional. Set it where the tenant also takes payments for
invoices raised in an older system: notifications the portal cannot match to one
of its own payments are passed on to that address. Leave it out to pass nothing
on.

### 9.5 Hub PISP (BPCE bank transfers)

```json
"payments": {
  "hubpisp": {
    "tokenUrl": "https://…",
    "apiUrl": "https://…",
    "clientId": "…",
    "clientSecret": "…",
    "certFingerprint": "…",
    "beneficiaryName": "Acme SAS",
    "iban": "FR76…",
    "bic": "…",
    "certsDir": "/etc/portal/certs/acme"
  }
}
```

```
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_TOKEN_URL=https://…
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_API_URL=https://…
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_CLIENT_ID=…
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_CLIENT_SECRET=…
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_CERT_FINGERPRINT=…
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_BENEFICIARY_NAME=Acme SAS
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_IBAN=FR76…
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_BIC=…
PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_CERTS_DIR=/etc/portal/certs/acme
```

Three fields need particular care:

- **`certsDir`** holds this tenant's two certificate files, named exactly
  `client.crt` and `private-key.pem`. Every tenant needs its own folder; two
  tenants sharing one are refused at startup. Give an absolute path: a relative
  one is resolved against the directory the portal was started from.
- **`beneficiaryName`** is the account name payments are credited to, at most
  **70 characters**. It is sent exactly as written and nothing shortens it.
- **`bic`** is optional. Every other field here is required.

The webhook address the bank calls carries the payment's resource id as a final
segment:

```
path routing             https://portal.example.com/acme/api/webhooks/hubpisp/<resourceId>
path routing + /portal   https://portal.example.com/portal/acme/api/webhooks/hubpisp/<resourceId>
host routing             https://acme.example.com/api/webhooks/hubpisp/<resourceId>
host routing + /portal   https://acme.example.com/portal/api/webhooks/hubpisp/<resourceId>
```

The bank fills in `<resourceId>` from its own notification-URL template. Confirm
the template syntax with the bank before registering: an address ending at
`hubpisp` with no final segment matches no route, and every notification is lost.

---

## 10. Configure sign-in with Google or Keycloak

Every tenant registers its own application with the identity provider. There is no
shared application: a tenant offers Google or Keycloak sign-in only where it
declares one.

The redirect address to register with the provider ends in the provider id,
`<provider>-<tenantId>`, where `<provider>` is `google` or `keycloak`. For the
tenant `acme` on Google:

```
path routing             https://portal.example.com/acme/api/auth/oauth2/callback/google-acme
path routing + /portal   https://portal.example.com/portal/acme/api/auth/oauth2/callback/google-acme
host routing             https://acme.example.com/api/auth/oauth2/callback/google-acme
host routing + /portal   https://acme.example.com/portal/api/auth/oauth2/callback/google-acme
```

The provider id keeps its `-<tenantId>` suffix in every case; that is part of the
provider's name, not the address.

### Google

```json
"oauth": {
  "google": {
    "clientId": "….apps.googleusercontent.com",
    "clientSecret": "…"
  }
}
```

```
PORTAL_TENANT_<ID>_OAUTH_GOOGLE_CLIENT_ID=….apps.googleusercontent.com
PORTAL_TENANT_<ID>_OAUTH_GOOGLE_CLIENT_SECRET=…
```

### Keycloak

```json
"oauth": {
  "keycloak": {
    "clientId": "…",
    "clientSecret": "…",
    "issuer": "https://id.example.com/realms/acme"
  }
}
```

```
PORTAL_TENANT_<ID>_OAUTH_KEYCLOAK_CLIENT_ID=…
PORTAL_TENANT_<ID>_OAUTH_KEYCLOAK_CLIENT_SECRET=…
PORTAL_TENANT_<ID>_OAUTH_KEYCLOAK_ISSUER=https://id.example.com/realms/acme
```

`issuer` is the realm address, with or without a trailing slash. Every tenant uses
its own realm.

To change the wording or picture on the Keycloak button:

```json
"public": {
  "keycloak": {
    "buttonLabel": "Sign in with Acme ID",
    "buttonImage": "/images/acme-id.svg"
  }
}
```

```
PORTAL_TENANT_<ID>_PUBLIC_KEYCLOAK_BUTTON_LABEL=Sign in with Acme ID
PORTAL_TENANT_<ID>_PUBLIC_KEYCLOAK_BUTTON_IMAGE=/images/acme-id.svg
```

---

## 11. Configure push notifications

Push notifications need a VAPID key pair per tenant. Generate it whichever of
these three ways suits the machine — they are alternatives, not steps.

From the portal checkout:

```
pnpm exec web-push generate-vapid-keys
```

Without a checkout, with access to the npm registry:

```
npx web-push generate-vapid-keys
```

With neither — inside the container image, say — Node alone:

```
node -e "const {generateKeyPairSync}=require('crypto');
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const {x,y}=publicKey.export({format:'jwk'});
console.log('public :',Buffer.concat([Buffer.from([4]),Buffer.from(x,'base64url'),
  Buffer.from(y,'base64url')]).toString('base64url'));
console.log('private:',privateKey.export({format:'jwk'}).d);"
```

Each prints a public key and a private key. The private key stays on the server;
the public key goes where the browser can read it:

```json
"webPush": {
  "privateKey": "…",
  "subject": "mailto:admin@example.com"
},
"public": {
  "webPush": {"publicKey": "…"}
}
```

```
PORTAL_TENANT_<ID>_WEB_PUSH_PRIVATE_KEY=…
PORTAL_TENANT_<ID>_WEB_PUSH_SUBJECT=mailto:admin@example.com
PORTAL_TENANT_<ID>_PUBLIC_WEB_PUSH_PUBLIC_KEY=…
```

`subject` identifies the sender to the push services and must be a `mailto:`
address or an `https:` address.

Generate a separate key pair for each tenant. Leave the `webPush` section out and
the tenant sends no push notifications.

---

## 12. Configure notifications from AOS

AOS reports changes to the portal — a new invoice, a ticket reply — by calling a
webhook. This takes one value on each side, and the two must match.

**On the portal side**, add the shared secret to the tenant's `aos` settings:

```json
"aos": {
  "url": "https://erp.example.com/axelor-erp",
  "storage": "/var/lib/portal/acme/upload",
  "auth": {"apiKey": "…"},
  "webhookSecret": "a-long-random-string"
}
```

```
PORTAL_TENANT_<ID>_AOS_WEBHOOK_SECRET=a-long-random-string
```

Generate the value with `openssl rand -base64 32`.

**In AOS, before entering the secret**, set `encryption.password` in
`axelor-config.properties`. It is what encrypts the field. Without it the secret
is written to the AOS database in cleartext and nothing reports that, and setting
the password afterwards leaves the value in cleartext until it is entered again.

**Then in AOS**, open the Goovee Portal app settings and set:

- **Notification webhook url** to this tenant's own address:

  ```
  path routing             https://portal.example.com/acme/api/webhooks/notifications
  path routing + /portal   https://portal.example.com/portal/acme/api/webhooks/notifications
  host routing             https://acme.example.com/api/webhooks/notifications
  host routing + /portal   https://acme.example.com/portal/api/webhooks/notifications
  ```

- **Webhook secret** to the same string used for `webhookSecret`, **132 bytes** or
  shorter — the most an encrypted value fits in the column

With either side missing, notifications stop without an error: AOS sends nothing
signed and the portal rejects the call. The portal logs nothing; the only record
is on the AOS side.

---

## 13. Configure Mattermost chat

```json
"mattermost": {
  "token": "…",
  "createUsers": true
},
"public": {
  "mattermost": {"host": "https://chat.example.com"}
}
```

```
PORTAL_TENANT_<ID>_MATTERMOST_TOKEN=…
PORTAL_TENANT_<ID>_MATTERMOST_CREATE_USERS=true
PORTAL_TENANT_<ID>_PUBLIC_MATTERMOST_HOST=https://chat.example.com
```

- `token` is a Mattermost admin token.
- `createUsers` set to `true` creates a Mattermost account on portal
  registration.
- The browser connects to the chat address directly.

---

## 14. Other per-tenant settings

### Social links

The addresses the news application offers to share an article to, all optional:

```json
"public": {
  "links": {
    "linkedin": "https://linkedin.com/company/acme",
    "twitter": "https://x.com/acme",
    "instagram": "https://instagram.com/acme",
    "whatsapp": "https://wa.me/33123456789"
  }
}
```

```
PORTAL_TENANT_<ID>_PUBLIC_LINKS_LINKEDIN=https://linkedin.com/company/acme
PORTAL_TENANT_<ID>_PUBLIC_LINKS_TWITTER=https://x.com/acme
PORTAL_TENANT_<ID>_PUBLIC_LINKS_INSTAGRAM=https://instagram.com/acme
PORTAL_TENANT_<ID>_PUBLIC_LINKS_WHATSAPP=https://wa.me/33123456789
```

### `includeLanguage` / `PORTAL_TENANT_<ID>_INCLUDE_LANGUAGE`

```json
"includeLanguage": true
```

Whether the translations stored in the tenant's database fall back from a
regional locale to its language: a visitor on `fr_FR` is served the `fr_FR`
translations, and set to `true`, any term they do not carry is taken from `fr`.
Left out, there is no fallback — a term missing from `fr_FR` is shown in the
wording shipped with the portal. Defaults to `false`.

### `upload.recordRetentionHours` / `PORTAL_TENANT_<ID>_UPLOAD_RECORD_RETENTION_HOURS`

```json
"upload": {"recordRetentionHours": 168}
```

Hours that records of finished uploads are kept before being cleared. Defaults to
`168`, seven days.

---

## 15. A completed file

Two tenants: `acme` on its own domain with Stripe, Google sign-in and push;
`bolt` sharing the main domain with mail only. Compare an assembled file against
this shape — in particular, that each tenant holds one `aos` block, one `public`
block and one `payments` block.

```json
{
  "$schema": "./portal.config.schema.json",
  "origin": "https://portal.example.com",
  "defaultTenant": "bolt",
  "tenants": {
    "acme": {
      "sessionSecret": "Zq8n…",
      "routing": "host",
      "db": {"url": "postgres://portal:secret@db.example.com:5432/portal-acme"},
      "aos": {
        "url": "https://erp-acme.example.com/axelor-erp",
        "storage": "/var/lib/portal/acme/upload",
        "auth": {"apiKey": "abcd1234…"},
        "webhookSecret": "hZ4t…"
      },
      "payments": {
        "stripe": {"clientSecret": "sk_live_…", "webhookSecret": "whsec_…"}
      },
      "oauth": {
        "google": {
          "clientId": "….apps.googleusercontent.com",
          "clientSecret": "…"
        }
      },
      "webPush": {
        "privateKey": "…",
        "subject": "mailto:admin@acme.example.com"
      },
      "public": {
        "host": "https://acme.example.com",
        "webPush": {"publicKey": "…"}
      }
    },
    "bolt": {
      "sessionSecret": "7Kd2…",
      "db": {"url": "postgres://portal:secret@db.example.com:5432/portal-bolt"},
      "aos": {
        "url": "https://erp-bolt.example.com/axelor-erp",
        "storage": "/var/lib/portal/bolt/upload",
        "auth": {"username": "portal", "password": "…"}
      },
      "mail": {
        "host": "smtp.example.com",
        "port": 587,
        "user": "no-reply@bolt.example.com",
        "password": "…",
        "maxConnections": 3
      },
      "public": {"host": "https://portal.example.com"}
    }
  }
}
```

That serves `https://acme.example.com/<workspace>` for one tenant and
`https://portal.example.com/bolt/<workspace>` for the other, with `/` answered by
`bolt`.

The same configuration as variables — the spelling a container takes — is the
same settings with the names section 2 maps them to:

```
PORTAL_ORIGIN=https://portal.example.com
PORTAL_DEFAULT_TENANT=bolt
PORTAL_TENANT_ACME_SESSION_SECRET=Zq8n…
PORTAL_TENANT_ACME_ROUTING=host
PORTAL_TENANT_ACME_DB_URL=postgres://portal:secret@db.example.com:5432/portal-acme
PORTAL_TENANT_ACME_AOS_URL=https://erp-acme.example.com/axelor-erp
PORTAL_TENANT_ACME_AOS_STORAGE=/var/lib/portal/acme/upload
PORTAL_TENANT_ACME_AOS_AUTH_API_KEY=abcd1234…
PORTAL_TENANT_ACME_AOS_WEBHOOK_SECRET=hZ4t…
PORTAL_TENANT_ACME_PAYMENTS_STRIPE_CLIENT_SECRET=sk_live_…
PORTAL_TENANT_ACME_PAYMENTS_STRIPE_WEBHOOK_SECRET=whsec_…
PORTAL_TENANT_ACME_OAUTH_GOOGLE_CLIENT_ID=….apps.googleusercontent.com
PORTAL_TENANT_ACME_OAUTH_GOOGLE_CLIENT_SECRET=…
PORTAL_TENANT_ACME_WEB_PUSH_PRIVATE_KEY=…
PORTAL_TENANT_ACME_WEB_PUSH_SUBJECT=mailto:admin@acme.example.com
PORTAL_TENANT_ACME_PUBLIC_HOST=https://acme.example.com
PORTAL_TENANT_ACME_PUBLIC_WEB_PUSH_PUBLIC_KEY=…
PORTAL_TENANT_BOLT_SESSION_SECRET=7Kd2…
PORTAL_TENANT_BOLT_DB_URL=postgres://portal:secret@db.example.com:5432/portal-bolt
PORTAL_TENANT_BOLT_AOS_URL=https://erp-bolt.example.com/axelor-erp
PORTAL_TENANT_BOLT_AOS_STORAGE=/var/lib/portal/bolt/upload
PORTAL_TENANT_BOLT_AOS_AUTH_USERNAME=portal
PORTAL_TENANT_BOLT_AOS_AUTH_PASSWORD=…
PORTAL_TENANT_BOLT_MAIL_HOST=smtp.example.com
PORTAL_TENANT_BOLT_MAIL_PORT=587
PORTAL_TENANT_BOLT_MAIL_USER=no-reply@bolt.example.com
PORTAL_TENANT_BOLT_MAIL_PASSWORD=…
PORTAL_TENANT_BOLT_MAIL_MAX_CONNECTIONS=3
PORTAL_TENANT_BOLT_PUBLIC_HOST=https://portal.example.com
```

---

## 16. Where the settings are read from

In order of precedence:

1. Variables set on the process — `docker run -e`, `--env-file`, a Kubernetes
   Secret.
2. Variables in the `.env` files, layered as Next.js layers them.
3. The JSON files in the working directory, in this order:

   ```
   portal.config.<mode>.local.json
   portal.config.local.json
   portal.config.<mode>.json
   portal.config.json
   ```

`<mode>` is `production`, `test` or `development`, after `NODE_ENV`. The first
source to hold a setting wins, setting by setting rather than file by file, so a
variable overrides the same setting wherever a file holds it. Put what every
deployment shares in `portal.config.json` and what one deployment changes in a
variable or a `.local` file.

The server process reads `PORT`, `HOSTNAME` and `NODE_ENV` as any Node server
does. `PORT` changes the port the portal listens on; it defaults to 3000.
`NODE_ENV` also chooses which `.env` and `portal.config` layers are read.

[`env.example`](env.example) lists every variable with its default.

---

## 17. Check the configuration before starting

From the portal checkout, in the directory holding the configuration:

```
 NODE_ENV=production pnpm config:check
```

It reads exactly what the portal reads — the `PORTAL_*` variables, the `.env`
files and the `portal.config*.json` files of the working directory — and
validates it the way startup does.

It prints the settings it read, which files took part, and each tenant with the
address it is served on. `--sources` lists every setting beside the variable or
file it came from, which is how to tell which layer won. It ends non-zero for a
configuration that would be refused, so a deployment can be gated on it.

Two tenants pointing at the same database is **not** refused. Check that by hand.

A rejected configuration does not prevent startup. The process starts, reports
itself ready and stays up, then answers every request with a server error; the
fault itself is printed once, by the startup checks in the log. Run this check
first.

The check needs the portal source. It cannot be run inside the published
container image, which ships without it.

---

## 18. Start the portal

Two ways: build and run the portal from a checkout,
or run the published container image.

### 18.1 From a checkout

From the portal checkout:

```
pnpm install
pnpm generate
pnpm website:sass
pnpm build
```

The build produces a self-contained server under `.next/standalone`. It carries
neither the static files nor the browser assets, so copy both in before starting
it:

```
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
node .next/standalone/server.js
```

Without them the portal answers pages, but with no styling and no scripts — every
`/_next/static/…` address is a 404 — and nothing under `public` is served. Copy
them before the server starts; a copy made while it is running takes effect only
on the next start.

Keep `portal.config.json` and any `.env` beside `server.js` — that is the
directory the server reads them from, not the root of the checkout. Variables set
on the process are read wherever they are set.

The portal listens on port 3000, on every interface. `PORT` and `HOSTNAME` change
that:

```
PORT=8080 HOSTNAME=127.0.0.1 node .next/standalone/server.js
```

Point the proxy at whichever address it ends up on.

The configuration is read once, at startup. Every change needs a restart, and a
change to `NEXT_PUBLIC_BASE_PATH` needs another `pnpm build`.

### 18.2 In a container

The published image runs the portal and carries no configuration.

#### Pass the variables

```
docker run -d \
  -p 3000:3000 \
  --env-file /etc/portal/portal.env \
  -v /var/lib/portal:/var/lib/portal \
  axelor/goovee-ce:<tag>
```

`portal.env` holds the `PORTAL_*` variables, one per line, as section 15 writes
them. Single variables can be passed with `-e` instead; their values then appear
in `docker inspect`.

The mount is the AOS upload storage named by `aos.storage`. Every path in the
configuration is read inside the container: give container paths, not host paths.
Mount a Hub PISP tenant's `certsDir` as well.

#### Or mount the JSON file

The files are read from the working directory, which in this image is
`/home/node` — where `server.js` sits:

```
docker run -d \
  -p 3000:3000 \
  -v /etc/portal/portal.config.json:/home/node/portal.config.json:ro \
  -v /var/lib/portal:/var/lib/portal \
  axelor/goovee-ce:<tag>
```

Nothing names the path, so a file mounted anywhere else is not read.

The image runs as its own unprivileged `node` user, so the file has to be readable
by it — mode `0644`, or owned by uid 1000. A configuration file kept `0600` for
root, which is how a file holding every password of a deployment usually is kept,
cannot be read inside the container.

Both spellings can be combined — a file for what every deployment shares,
variables for what this one changes.

With no configuration at all the container starts, stays up, and fails every
request.

#### A base path needs its own image

`NEXT_PUBLIC_BASE_PATH` is read only while the application is compiled, and its
value is written into the compiled output. The published image is built with no
base path.

Passing the variable to `docker run` has no effect. The container serves from the
top of the domain.

To serve under a path prefix, build an image with the variable set before
`pnpm build`, and deploy that image.

#### The container runs the built server

The image starts the compiled server directly, from `/home/node`. It does not run
`pnpm start`, and it ships without the portal source, so `pnpm config:check`
cannot be run inside it.
