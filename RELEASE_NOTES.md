# 1.11.1 (2026-09-15)

## Fixes

### Core Platform

- Connect each tenant once and keep its database client for the life of the process – #118511
  <details>
    <summary>Details</summary>

  Requests that addressed a tenant at the same time each opened a database client, only one of which was kept, and each of them synchronised the schema, so concurrent openings could deadlock in PostgreSQL and fail with "Error connecting tenant". Route handlers and page renders also held separate clients, connecting every tenant twice, and past twenty tenants the hourly upload sweep evicted clients that requests were still using. A tenant is now connected once per process however many requests arrive together and from whichever part of the server; the schema is brought up to date once per database, at startup or on the first request for it, and one server at a time when several run against the same database; no client is disconnected while in use; a tenant whose database is unreachable is retried at most once every ten seconds; and startup prepares databases five at a time, so one that is unreachable holds up only the databases queued behind it.
  </details>

- Declare the manifest's dependency on the request host – #118493
  <details>
    <summary>Details</summary>

  The per-tenant manifest builds its scope, start_url and id from the host the request was addressed to, but is sent as publicly cacheable for an hour under an address that is the same on every origin. A shared cache keyed without the host could therefore serve one origin's manifest on another, where the scope falls outside the page's service worker and the app silently stops being installable. The response now sends Vary: Host, X-Forwarded-Host.
  </details>

- Keep the base path on browser addresses when a tenant or workspace is named after it – #118542
  <details>
    <summary>Details</summary>

  Under a base path, a tenant or workspace whose name matched the base path segment lost it from the addresses the app builds for the browser: the tenant's manifest link and its start address, redirects set after sign-in and account changes, and the page a push notification opens. The base path is now always added.
  </details>

- Keep what is typed on the sign-in and sign-up screens across a tab switch – #118322
  <details>
    <summary>Details</summary>

  The tenant shell renders nothing while the translations load, and it treated a session that is merely being rechecked as a session it was still waiting for. The session is rechecked on every window refocus, and on the authentication screens there is no session to hold on to while that request is in flight, so leaving the tab and coming back unmounted the whole tree and took the half-filled sign-in, sign-up and password-reset forms down with it. The tree is now held back only until the translations first land, and the bundle is no longer reloaded on a refocus that changes no locale.
  </details>

## Changes

### Core Platform

- Import every lib/core module through its alias – #118517
  <details>
    <summary>Details</summary>

  Every module under lib/core has an import alias and is imported through it, from application code and from other modules alike, and a lint rule refuses the long path so the two spellings cannot drift apart again. The Better Auth server instance and browser client live under lib/core/auth as server and client, beside the rest of the authentication code.
  </details>

## Security

### Core Platform

- Comment attachments are served only for the record they belong to – #118497
  <details>
    <summary>Details</summary>

  A comment attachment was matched to its record by the record's number alone, without the model that number belongs to. A visitor able to open one record could download attachments of comments on a record of any other model carrying the same number, including records of workspaces they have no access to. The file is now matched on model and number together, and served only when the comment carrying it is one the subapp shows.
  </details>

- Reject upload purposes that name a prototype property – #118489
  <details>
    <summary>Details</summary>

  The upload purpose registry was looked up by indexing an object, so a purpose of `constructor`, `__proto__`, `toString` or `valueOf` returned a truthy non-policy and passed every check the policy exists to enforce: the route's unknown-purpose guard, the size cap and the mime/content schema. An authenticated request could stage unbounded, untyped bytes into the tenant's storage. The registry is now a Map, so a lookup cannot reach `Object.prototype`.
  </details>

- The authentication error screen no longer links wherever its query string says – #118487
  <details>
    <summary>Details</summary>

  The "Back to Workspace" button on the authentication error screen took its destination from a query parameter and used it as given, so a crafted link showed the portal's own error screen — its wording and styling intact — above a prominent button leading to another site. An address that does not land on the portal itself is now refused, and the button falls back to the entry of the tenant whose screen it is.
  </details>
