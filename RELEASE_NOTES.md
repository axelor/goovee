# 1.7.2 (2026-06-02)

## Fixes

### Core Platform

- Up2Pay: Incorrect country code sent in billing information – #113469
  <details>
    <summary>Details</summary>

  Up2Pay's PBX_BILLING expects the ISO 3166-1 numeric country code (e.g. "250" for France) in the &lt;CountryCode&gt; field, but the invoice billing payload was sending the alpha-2 code (e.g. "FR").
  </details>

### Invoices

- Up2Pay: Incorrect country code sent in billing information – #113469
  <details>
    <summary>Details</summary>

  Up2Pay's PBX_BILLING expects the ISO 3166-1 numeric country code (e.g. "250" for France) in the &lt;CountryCode&gt; field, but the invoice billing payload was sending the alpha-2 code (e.g. "FR").
  </details>
