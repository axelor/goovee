# 2.0.0 (2026-06-17)

## Features

### Core Platform

- Record storage type on uploaded files for AOP 8 / AOS 9 support – #114307
  <details>
    <summary>Details</summary>

  Files uploaded through the portal now record their storage type (local), which AOP 8 / AOS 9 requires; without it those backends reject the upload. No change on AOP 7 / AOS 8.
  </details>
