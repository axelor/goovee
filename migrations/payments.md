# Migrating to the payment ledger

Move a Goovee deployment onto the payment ledger: every payment is a record in
the back office from the moment the buyer presses a payment button, the
provider's events are kept against it, and the ERP books it from that record.
Follow this runbook when upgrading:

- **2.3.x or earlier → 2.4.0 or later**

It needs the axelor-portal module that the release compatibility matrix pairs
with this release. Perform the steps in order, per tenant where a step says so.
Steps 1 to 4 come before the new portal serves traffic; step 7 is optional and
comes last.
[CONFIGURATION.md](../CONFIGURATION.md) describes every setting written here.

---

## 1. Settle the payments still in flight

The previous release tracked a payment in progress as a payment context. This
release completes none of them: the addresses the previous release gave its
payments, under `/<tenant>/api/payment/`, are gone, a buyer returning from one
is not recorded, and a provider's notification for one is refused. While the previous release is still running, run this against each
tenant's database:

```sql
SELECT
  id,
  status,
  created_on
FROM
  portal_payment_context
WHERE
  status = 'pending';
```

The upgrade may go ahead once it returns no rows. For each row it returns, look
the payment up at its provider, and either let it finish on the previous
release or settle it by hand in the ERP before upgrading. Start with HUB PISP
rows: a HUB PISP transfer can stay pending for a day, and on the previous
release only its startup resumed it.

A Stripe bank transfer can stay pending for weeks, since the payer sends it when
they choose. Settling one by hand means cancelling its payment intent in the
Stripe dashboard before the upgrade, whether or not the invoice is paid another
way: a payer who wired later would otherwise be charged, with nothing recording
the payment in the ERP.

These payments are not moved into the new payment records: a payment context
holds the provider, the payer and the priced purchase, but neither the amount
taken nor, for most providers, the provider's own reference, and the ERP already
holds what each finished payment booked.

## 2. Check the currencies

A payment is refused before it starts when the ERP gives its currency a number
of decimals other than the ISO one: every provider counts in the ISO unit, and
the ledger counts an event only at the payment's own scale. Most currencies
have 2 decimals; JPY, XOF and others have 0; BHD, KWD, TND and a few others
have 3. Run this per tenant and correct any currency the tenant takes payments
in:

```sql
SELECT
  codeiso,
  number_of_decimals
FROM
  base_currency
ORDER BY
  codeiso;
```

## 3. Migrate each tenant's schema

Stop the previous portal first. Its checkouts book their payments through AOS
endpoints this release removes — `ws/portal/orders/order`,
`ws/portal/marketplace/order`, `ws/portal/invoice/payment` and
`ws/portal/invoice/eventInvoice` — so a payment taken between the AOS upgrade and
the portal's would be charged and never booked.

AOS runs no DDL on a named tenant: schema updates and module loading at startup
reach the default database only. So bring each tenant's database up to date by
booting AOS once with that database as its default connection.
`AXELOR_CONFIG_<KEY>` sets a setting with `_` read as `.`, so no configuration
file changes:

```
AXELOR_CONFIG_DB_DEFAULT_URL=jdbc:postgresql://db.example.com:5432/acme \
  <the usual AOS start command>
```

Wait for `Ready to serve`, stop it, and repeat for the next tenant; then start
AOS normally, which does the same for the default database. Leave
`application.multi-tenancy` as it is: only the default connection is used at
startup. Each boot creates the tables below and loads the new views, selections
and menus. Do it before the new portal is deployed: the portal writes these
tables from its first payment.

The tables the module adds:

- `portal_portal_payment` — one row per payment. Its subject is a model and a
  record id, `subject_model` and `subject_id`, with `exclusive_subject_id` set
  for a subject that carries one payment only. It has a unique constraint on
  `(subject_model, exclusive_subject_id)`, an index on
  `(subject_model, subject_id)`, and unique `reference` and `checkout_token`.
- `portal_portal_payment_session` — one row per attempt at a provider, with the
  `amount`, `currency_code` and `currency_scale` it asked for, unique on
  `(gateway, session_ref)`.

- `portal_portal_payment_event` — the ledger, unique on `(gateway, event_key)`,
  with `currency_scale`.
- `portal_portal_payment_task` — outstanding work, unique on `(payment, kind)`.
- `portal_portal_payment_manual_entry` — events entered by hand in the ERP,
  unique on `event_key`.
- `portal_portal_order_request` and `portal_portal_order_request_line` — the
  shop purchases the ERP builds its sale orders from.

No existing table gains a column. The portal creates one table of its own,
`portal_payment_intent`, when it starts. Two things the previous release wrote
are left as they are, unused: the `portal_payment_context` table, which step 1
reads, and the `payment_context_id` column of `portal_marketplace_product_order`,
which a 2.3.x database carries. Step 7 says when they can go.

Then check each tenant:

```sql
SELECT
  count(*)
FROM
  information_schema.tables
WHERE
  table_schema = current_schema()
  AND table_name IN (
    'portal_portal_payment',
    'portal_portal_payment_session',
    'portal_portal_payment_event',
    'portal_portal_payment_task',
    'portal_portal_payment_manual_entry',
    'portal_portal_order_request',
    'portal_portal_order_request_line'
  );
```

It returns 7.

A tenant whose views were not reloaded — the selections of the payment form
missing, or the _Portal › Payments_ menu absent — restores them instead, with
`Administration › Views › Restore all` signed in to that tenant, or headlessly,
sending the tenant's id on both calls:

```bash
BASE=https://erp.example.com/axelor-erp
TENANT=acme

curl -s -c /tmp/aos.txt -H 'Content-Type: application/json' -H "X-Tenant-ID: $TENANT" \
  -d '{"username":"admin","password":"…"}' $BASE/callback

CSRF=$(grep CSRF-TOKEN /tmp/aos.txt | awk '{print $NF}')

curl -s -b /tmp/aos.txt -H "X-CSRF-Token: $CSRF" -H 'Content-Type: application/json' \
  -H "X-Tenant-ID: $TENANT" \
  -d '{"model":"com.axelor.meta.db.MetaView","action":"action-meta-restore-all","data":{"context":{}}}' \
  $BASE/ws/action/action-meta-restore-all
```

Restoring discards view customizations.

## 4. Configure AOS

- **Permission.** The AOS user the portal authenticates as needs WRITE on
  _Portal payment_ (`PortalPayment`): the portal asks AOS to book a captured
  payment through `ws/portal/payments/register`, which checks it.
- **No scheduler.** `quartz.enable` is not needed. The portal asks AOS to book
  each payment as it is captured; one that could not be booked then — AOS
  unreachable, a configuration to fix — waits under _Payments to resolve_ for
  _Register payment_, as does any booking that needs a person's decision.
- **One time zone.** Run the AOS JVM, the database and the portal in the same
  zone, for example UTC: `-Duser.timezone=UTC` on the JVM,
  `ALTER ROLE <role> SET timezone = 'UTC'` on the database role (or the
  database), and `TZ=UTC` on the portal's host. Payment tasks record their times
  without a zone, and each side compares them with the database's clock; with
  the zones apart, tasks fall due, become overdue and are reconciled late or early by
  exactly the difference.

## 5. Register the providers

Each provider's notification address is the tenant's own
`/<tenant>/api/webhooks/<provider>`, in the routing and base-path form the
deployment uses; CONFIGURATION.md §7.4 writes out the combinations. Register it
per tenant, with that tenant's own merchant account.

### Stripe

Add a webhook endpoint at `/<tenant>/api/webhooks/stripe` and subscribe it to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.partially_funded`
- `payment_intent.canceled`

Put its signing secret in `PORTAL_TENANT_<ID>_PAYMENTS_STRIPE_WEBHOOK_SECRET`.
Without it the webhook is refused and bank transfer is not offered.
`PORTAL_TENANT_<ID>_PAYMENTS_STRIPE_BANK_TRANSFER_COUNTRY` names, as two
letters, the country whose bank account Stripe presents for EUR bank transfers;
it defaults to `FR`.

### PayPal

Register a webhook for the tenant's PayPal app at `/<tenant>/api/webhooks/paypal`,
subscribed to:

- `CHECKOUT.ORDER.APPROVED`
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`

Put the webhook's id in `PORTAL_TENANT_<ID>_PAYMENTS_PAYPAL_WEBHOOK_ID`. PayPal
signs each notification and the portal checks the signature against this id;
without it, PayPal's notifications are refused and a payment is recorded only
when the buyer comes back to the site.

### Paybox and Up2Pay

Deploy Verifone's public key for each gateway at `certs/paybox/public-key.pem`
and `certs/up2pay/public-key.pem`, under the directory the portal is started
from, and use the key of the environment the merchant account belongs to. Every
notification's signature is checked against it.

Paybox needs no address registered: the portal sends
`/<tenant>/api/webhooks/paybox` with each payment. Register
`/<tenant>/api/webhooks/up2pay` with Up2Pay.

### HUB PISP

Register `/<tenant>/api/webhooks/hubpisp/<resourceId>` with the bank, as
CONFIGURATION.md §9.5 describes, and deploy the tenant's `client.crt` and
`private-key.pem` in its `PORTAL_TENANT_<ID>_PAYMENTS_HUBPISP_CERTS_DIR`.

## 6. Deploy the portal and verify

Deploy the new portal. Then, per tenant:

1. Pay an invoice by card. The result page at
   `/<tenant>/<workspace>/payments/<reference>` reads paid, and the payment is under _Portal › Payments › All payments_ in
   the ERP with its ERP invoice payment linked.
2. In the provider's dashboard, the webhook delivery for that payment succeeded.
   From then on, _Technical › Missed webhooks_ in the ERP lists, per
   provider, the captures a webhook left unconfirmed.

A payer who presses a payment button on a page loaded before the deploy starts
a new payment rather than resuming the one begun there; the earlier one's
provider session, if still open, expires on its own, and an invoice's open
transfer is withdrawn once the invoice is paid.

## 7. Remove the previous release's payment records (optional)

Once every tenant runs this release, nothing reads `portal_payment_context` or
`portal_marketplace_product_order.payment_context_id`. The table holds what the
previous release recorded about each payment it took — the provider, the payer
and the priced purchase — so keep it while finance may need to trace one of
those. To remove both, per tenant:

```sql
ALTER TABLE portal_marketplace_product_order
DROP COLUMN IF EXISTS payment_context_id;

DROP TABLE IF EXISTS portal_payment_context;
```

---

## Running payments

What the ERP's _Portal › Payments_ menu shows, and what finance does with it.

- _Payments to resolve_ — a payment whose delivery failed, one more captured than
  it was for, or one whose booking in the ERP needs a decision or still fails
  past its time.
  Settle it outside the portal, then press _Resolve_ on the payment with what
  was done: the purchase honoured another way, the excess given back at the
  provider, the booking made in the ERP by hand. The payment then stops
  waiting; the reason, who and when are kept on it.
- _All payments_ — every payment, with filters by status and by app. Its _No
  answer from the provider_ filter lists the payments whose provider never
  answered. The portal asks a provider that can be asked daily past the
  session's deadline, and closes the session with no answer 30 days past it; it
  closes one at once when the provider no longer holds it, names another
  payment, or was never given the provider's handle. The session's failure
  reason says which, and what to look up at the provider.
- _Technical_:
  - _Missed webhooks_ — captures the provider's webhook never confirmed,
    grouped by provider.
  - _Pending tasks_ — every payment task by kind, opened on the overdue ones,
    including the provider checks still waiting on an answer.
  - _Payment attempts_, _Provider notifications_ and _Manual entries_ — every
    payment's attempts at the provider, what the provider reported, and what a
    person entered from a back office.
- _Configuration › Payment methods_ — the payment methods a workspace offers,
  formerly _Portal › Configuration › Payment config_.

### Refunds and disputes

The portal does not track them. A refund is made, and a dispute answered, at
the provider, from its dashboard or back office; finance books the ERP side by
hand, as for any payment. Neither changes what the portal delivered.

Reverse a refunded invoice payment in the ERP promptly: until then the portal
reads the invoice as paid, refusing a new payment of it and withdrawing a bank
transfer the payer started on it.

### More captured than the payment was for

Two sessions of one payment can both take the money, a payer who paid by card
and by transfer for instance. The payment is booked in the ERP for the amount
it was for, at most, shows the excess on its form, and waits under _Needs
attention_: give the excess back at the provider, then _Resolve_ the payment.
Its booking, if still to run, runs as usual.

### A Paybox or Up2Pay notification that never came

Verifone does not retry a failed notification. If the portal is down when a
payer validates and the payer does not return to the result page, a payment
really made ends up with no answer from the provider a week later, its invoice or order still
unpaid, and the payer may pay again.

- Verifone mails "PAYBOX: WARNING!!" to the merchant address it holds whenever a
  notification fails. On receiving one, find the payment by its `GVP-` reference
  in the Paybox or Up2Pay back office and, if it was paid, record it on the
  payment in the ERP with _Record payment received_. It is then
  settled as the notification would have settled it.
- Check _All payments_ filtered on _No answer from the provider_ against the
  provider's back office weekly, for example
  every Monday, which covers the week a payment waits before it lands there.
- A payer who paid twice has one payment refunded at the provider, and the ERP
  side booked by hand.

### After changing PayPal credentials

PayPal answers "no such order" for every order when the credentials point at
another account or environment — live and sandbox swapped, an app rotated. Every
open PayPal payment is then closed with no answer on its next check. Nothing is
lost, but check _No answer from the provider_ under _All payments_ for a burst
after changing them.

### Confirmations sent twice

The portal always confirms a payment to the payer. The ERP sends its own mails
where these switches are on, in addition to the portal's:

- _Goovee Portal_ app configuration, `registrationTemplate`: the ERP's template
  mail for a paid event registration, on top of the portal's registration mail.
- The customer's accounting situation, `invoiceAutomaticMail` with
  `invoiceMessageTemplate` (defaulted from the account configuration): the ERP's
  customer invoice mail at ventilation; `invoiceAutomaticMailOnValidate` with
  `invoiceMessageTemplateOnValidate`: the same at validation. Both on top of the
  portal's shop and marketplace confirmations; never for an event or an invoice
  paid from the portal.
- Supply chain, `customerStockMoveGenerationAuto`, with the partner's stock
  settings `plannedStockMoveAutomaticMail` and its template: the planned stock
  move mail when a shop or marketplace sale order is confirmed.

Leave them off, or accept the second mail.

### ERP mails sent while booking

The ERP sends the mails above from inside the booking of the payment. With the
planned stock move mail switched on but no template set, the mail fails and the
whole booking of a shop or marketplace payment fails with it; it waits under
_Payments to resolve_ until the template is set and _Register payment_ is pressed.
A booking that fails after its mails were queued may send them again when
retried.

### A bank transfer the payer did not complete

A Stripe bank transfer stays open for 14 days from its start; the payer is told
so with its bank details. At the end, the portal cancels it at Stripe, whatever
part of it arrived, and the payment reads cancelled. Money that had arrived was
never in the account's balance: Stripe returns it to the payer's cash balance
there, and finance refunds it from the Stripe dashboard, as any refund. The
portal's log names each one (`[PAYMENT][RECONCILE] … went back to the payer's
Stripe cash balance`); check the customers' cash balances in Stripe weekly
besides.

Check the customer's cash balance in Stripe before refunding: Stripe applies it
to the payer's next open transfer by itself, so money returned by one cancelled
transfer may already have paid another. Refund only what the balance still
holds.

### Money for a withdrawn bank transfer

Stripe keeps one customer per payer address per tenant and applies money
received to that customer's open transfers. A payer with open transfers on two
invoices who wires the first one's amount after its transfer was withdrawn may
see it applied to the second, where the amounts match. Check the customer's
cash balance in Stripe when a wire arrives for an invoice already paid.
