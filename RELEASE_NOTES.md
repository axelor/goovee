# 1.11.5 (2026-10-29)

## Features

### Documents

- List subfolders in the folder view – #121457
  <details>
    <summary>Details</summary>

  Opening a folder lists its subfolders above its documents, in both the list and the grid view.
  </details>

## Security

### Core Platform

- Password reset no longer reveals whether an email address has an account – #120052
  <details>
    <summary>Details</summary>

  On the password reset screen, a wrong, expired or missing code now always shows "Invalid or expired code", whether or not the email address has an account.
  </details>

- Stop accepting an email verification code after 5 wrong entries, so a new code must be requested – #120058
  <details>
    <summary>Details</summary>

  Applies to registration, registration through an invitation, password reset and email address change. The error shown is the same as for a wrong or expired code.
  </details>
