# Migration guide

Find every row that applies to the upgrade being made and follow those runbooks
in order. An upgrade matching no row needs no migration.

| Coming from      | Moving to      | Runbook                                                 |
| ---------------- | -------------- | ------------------------------------------------------- |
| 2.3.x or earlier | 2.4.0 or later | [File storage settings](migrations/object-storage.md)   |
| 2.3.x or earlier | 2.4.0 or later | [Payment ledger](migrations/payments.md)                |
| 2.2.x or earlier | 2.3.0 or later | [Per-tenant configuration](migrations/multi-tenancy.md) |
