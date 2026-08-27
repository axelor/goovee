# 1.10.1 (2026-08-27)

## Fixes

### Core Platform

- Lighter images, and accessibility improvements – #117431
  <details>
    <summary>Details</summary>

  The default banner is 25 times smaller. Vector images are requested once rather than at several widths. The footer logo appears with the rest of the page instead of after it. The Keycloak sign-in icon keeps its proportions, whatever icon is configured. Several dialogs are more accessible to a screen reader.
  </details>

- Stop translations erroring on a locale that ships no file – #117403
  <details>
    <summary>Details</summary>

  A visitor whose locale ships no file of its own — a browser reporting en_GB or de — made the sign-in page and the other pages outside a workspace request an address that was read as a workspace, which failed with a server error and returned a page that was then absorbed into the translations as tens of thousands of stray entries. Those pages now read their translations from the application. A locale naming a region also falls back to its language for the translations shipped with the application, which INCLUDE_LANGUAGE no longer withholds — that setting governs the translations a tenant holds.
  </details>
