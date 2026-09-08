# 1.11.0 (2026-09-08)

## Features

### Core Platform

- Implement proper multi-tenancy with per-tenant configuration – #113733
  <details>
    <summary>Details</summary>

  Tenants are configured through `PORTAL_*` environment variables — `PORTAL_TENANT_<ID>_…` for each tenant and `PORTAL_…` for the settings bound to the single process — or through `portal.config*.json` files in the working directory holding the same settings, layered like the .env files and overridden by variables; each tenant with its own database and AOS connection, supporting both AOS topologies per tenant: a dedicated AOS instance, or a shared AOS instance with AOS multi-tenancy addressed via X-Tenant-ID. Payment providers, mail, Mattermost, OAuth applications, the web-push signing identity, file storage, the session signing key and browser-facing settings are declared per tenant, and nothing is inherited from another tenant. A variable naming no setting is refused at start-up with the settings it could have meant, and a deployment still carrying the previous release's variables is told to run the migration. A tenant is named by the first path segment of its addresses, or by its own domain where one is configured, and every address it serves sits beneath that — its pages, its sign-in screens and the addresses its payment providers and AOS post back to. Each tenant signs its sessions with its own key, so one browser can be signed in to several tenants of a deployment at once. Startup payment polling resumes for every configured tenant. A single-tenant deployment is one tenant's settings, which a script writes from the variables used before; env.example, portal.config.example.json and the JSON Schema portal.config.schema.json, generated from the schema, document every setting. An existing deployment moves onto per-tenant configuration by following the runbook at https://github.com/axelor/goovee/blob/main/migrations/multi-tenancy.md.
  </details>

## Fixes

### Core Platform

- Fix the email update row layout in My account – #118133
  <details>
    <summary>Details</summary>

  Editing the email address on the My account page revealed the OTP field and its buttons inside a column that could not shrink below the buttons' width, so the Generate OTP and Cancel buttons were pushed outside the card. The row now lays the email field, the OTP field and the buttons out side by side and wraps them onto the next line when the width is insufficient.
  </details>

## Changes

### Core Platform

- Resolve a workspace by its exact address rather than a pattern – #117842
  <details>
    <summary>Details</summary>

  A workspace address is compared with the workspace's stored URL character for character. The comparison previously honoured the characters SQL treats as pattern wildcards, so an address whose workspace segment read `franc_` resolved the workspace stored as `france`, and the page was then built for that workspace while every address on it came from the address requested. An address that is not exactly the stored value now resolves no workspace and is answered as not found.
  </details>
