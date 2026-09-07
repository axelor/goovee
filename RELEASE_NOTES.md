# 1.10.2 (2026-09-07)

## Security

### Forum

- Joining a forum group can no longer be done on someone else's behalf – #118013
  <details>
    <summary>Details</summary>

  Joining a forum group used the member id sent by the browser, so an authenticated member could enrol any other partner or contact into any group they could see and gain them member-only visibility and notifications. The action now always uses the signed-in user, ignoring any id supplied in the request.
  </details>
