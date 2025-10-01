# 1.0.0 (2025-09-11)

## Features

### Core Platform

- Add environment configuration to show/hide Google Oauth option – #98313
- Add PWA support to the application – #94548
  <details>
    <summary>Details</summary>

  Implemented Progressive Web App (PWA) support including service worker registration, manifest setup.
  </details>

### Events

- Show category image in event list – #100009
  <details>
    <summary>Details</summary>

  Shows the category image in event list if available, if not show the event image
  </details>

### Content

- Add demo content for Wiki 1 – #98844

## Fixes

### Core Platform

- Fix banner search selection appearance – #98628
- Make DATA_STORAGE variable optional during build – #99538

### Events

- Fix image alignment for events html description – #98430
- Fix margin for paragraph in html description – #98433
  <details>
    <summary>Details</summary>

  Display paragraph to have line break by providing appropriate bottom margin
  </details>

### News

- Fix image alignment for events html description – #98430
- Fix margin for paragraph in html description – #98433
  <details>
    <summary>Details</summary>

  Display paragraph to have line break by providing appropriate bottom margin
  </details>

- Resolve crash on hero search – #98434

### Content

- Fix wiki content not being saved – #98835
- Update proper type for component during template seed – #98836

## Changes

### Core Platform

- Improve Shop App styling for visual consistency and responsiveness – #98635

### E-Shop

- Improve Shop App styling for visual consistency and responsiveness – #98635
- Refactor routing by replacing router.push with Next.js <Link> component – #98637
- Replace native <textarea> with cire <Textarea/> component – #98638

## Security

### Helpdesk

- Restrict access to ticket details – #98497
  <details>
    <summary>Details</summary>

  Only allow access to ticket details if the user has access to the project.
  </details>
