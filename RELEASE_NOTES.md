# 2.2.1 (2026-08-26)

## Fixes

### User Accounts

- Show the address book on an Axelor Portal 9.1 backend – #117361
  <details>
    <summary>Details</summary>

  The addresses page returned an error and listed nothing when the backend ran on the Axelor Portal 9.1 line, because it read a field Axelor Open Suite removed from addresses in 9.1. The address label is now held in the sub department field, which exists on both the 9.0 and the 9.1 line, so listing, creating and editing an address work on either. A label saved before this change stays on the removed field and is no longer shown; retyping it on the address restores it.
  </details>
