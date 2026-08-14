# 2.1.1 (2026-08-14)

## Features

### Core Platform

- Open documents without waiting for the whole file – #116828
  <details>
    <summary>Details</summary>

  Documents are streamed, so one appears from its first page while the rest is still arriving. An interrupted transfer resumes where it stopped, and a document that has not changed is confirmed as unchanged rather than sent again. A name containing a space, a comma or an accent is no longer altered when the file is saved, and more kinds of file can be read in the browser instead of only downloaded: .txt, .md, .xml and .csv, video, and images such as .webp, .gif, .bmp and .tiff.
  </details>

### Documents

- Open documents without waiting for the whole file – #116828
  <details>
    <summary>Details</summary>

  Documents are streamed, so one appears from its first page while the rest is still arriving. An interrupted transfer resumes where it stopped, and a document that has not changed is confirmed as unchanged rather than sent again. A name containing a space, a comma or an accent is no longer altered when the file is saved, and more kinds of file can be read in the browser instead of only downloaded: .txt, .md, .xml and .csv, video, and images such as .webp, .gif, .bmp and .tiff.
  </details>

## Fixes

### Core Platform

- Deliver notifications to every recipient of a large audience – #116857
  <details>
    <summary>Details</summary>

  A notification sent to a large audience reached only part of it. Mail servers refuse more than a handful of simultaneous connections from one sender, and the portal opened a separate one for every message, so the rest were rejected and lost. Every recipient now receives them. The new optional MAIL_MAX_CONNECTIONS sets how many the portal may open; the default is ten, and some mail servers accept as few as three. A message that fails temporarily is retried for several minutes, so mail that was lost now arrives late; one that cannot be delivered is reported with its recipient. Whether mail can be reached is reported at startup.
  </details>

- Deliver push notifications that were previously dropped – #116883
  <details>
    <summary>Details</summary>

  A notification with a long text was refused by the push service and lost; it is now shortened and delivered. One that failed for a temporary reason — the service rate-limiting the sender, or being briefly unavailable — is retried instead of discarded, and a service that accepts a connection then stops answering no longer holds the send open. When notifying a large audience, a device that is slow to answer no longer delays anyone else's notification from appearing in the portal. A device coming online after several notifications about the same subject now raises only the latest rather than each one. Whether push notifications can be sent is reported at startup, and the new optional PUSH_MAX_CONNECTIONS sets how many are delivered at once; the default is ten.
  </details>

- Keep memory steady as server secrets are used – #116884
  <details>
    <summary>Details</summary>

  Server memory grew a little every time a secret was used — each notification sent, payment authorised, webhook received, and chat token read — and was never released, so a long-running portal used steadily more of it. Memory use no longer grows with the work handled. Separately, switching on Google or Keycloak sign-in without setting its secret stopped the portal serving any request; it now runs, with that provider unusable until the secret is set.
  </details>

- Keep the translation cache keyed on the resolved tenant – #114494
  <details>
    <summary>Details</summary>

  The translation bundle cache was keyed on the tenant identifier taken straight from the URL, which no route validates. Every distinct value minted its own cache entry holding the same translations, so a hundred requests carrying made-up identifiers evicted the bundles of the real tenants and forced them to be rebuilt from the database. The cache is now keyed on the tenant the identifier actually resolves to, so identifiers that resolve to nothing all share a single entry and unknown values can no longer push real tenants out of the cache. Translation lookups behave as before: an unknown tenant still serves the general translations only.
  </details>

- Serve avatars and post images at the size they are shown – #116763
  <details>
    <summary>Details</summary>

  Profile pictures and forum post images were downloaded at their stored resolution, so a photo uploaded at full camera resolution was fetched whole to fill a small circle in a list. They are now resized to the size they are drawn at, converted to a modern format and cached. The forum image viewer also keeps one size while stepping between pictures instead of resizing around each one.
  </details>

- Use the message body from AOS in notification emails – #114532
  <details>
    <summary>Details</summary>

  A notification email always used the portal's own template, even when the linked message in AOS had its own content set. That content is now used as the email body. The subject was already taken from the message and is unchanged.
  </details>

### Forum

- Serve avatars and post images at the size they are shown – #116763
  <details>
    <summary>Details</summary>

  Profile pictures and forum post images were downloaded at their stored resolution, so a photo uploaded at full camera resolution was fetched whole to fill a small circle in a list. They are now resized to the size they are drawn at, converted to a modern format and cached. The forum image viewer also keeps one size while stepping between pictures instead of resizing around each one.
  </details>

### News

- Serve avatars and post images at the size they are shown – #116763
  <details>
    <summary>Details</summary>

  Profile pictures and forum post images were downloaded at their stored resolution, so a photo uploaded at full camera resolution was fetched whole to fill a small circle in a list. They are now resized to the size they are drawn at, converted to a modern format and cached. The forum image viewer also keeps one size while stepping between pictures instead of resizing around each one.
  </details>

## Changes

### Core Platform

- Prefill the attachment name with the original file name – #116862
  <details>
    <summary>Details</summary>

  Forms that ask for a name alongside an upload started that field empty, so the name had to be typed by hand even though the original file name was almost always the one wanted. Picking a file now fills the name with the original file name, without its extension, and the field stays editable so a different name can still be typed. Leaving the prefilled value alone stores the file under its original name. This applies to the resources form and to the comment box used by ticketing, quotations, news and events.
  </details>

- Serve images through a custom image loader – #116777
  <details>
    <summary>Details</summary>

  Images are resized as they are served, in place of a separate optimisation step. An image that has already been seen is confirmed as unchanged rather than being sent again.
  </details>

- Upload files in resumable parts – #116720
  <details>
    <summary>Details</summary>

  Files are sent in parts rather than in one request, so a large file no longer fails part-way and an interrupted upload resumes from where it stopped instead of starting again. Each file shows its own progress and can be paused, resumed, retried or removed, and a form cannot be sent until its attachments have finished uploading.
  </details>

### Documents

- Prefill the attachment name with the original file name – #116862
  <details>
    <summary>Details</summary>

  Forms that ask for a name alongside an upload started that field empty, so the name had to be typed by hand even though the original file name was almost always the one wanted. Picking a file now fills the name with the original file name, without its extension, and the field stays editable so a different name can still be typed. Leaving the prefilled value alone stores the file under its original name. This applies to the resources form and to the comment box used by ticketing, quotations, news and events.
  </details>

## Security

### Core Platform

- Confine file downloads to the storage directory – #114500
  <details>
    <summary>Details</summary>

  The location of an uploaded file is recorded relative to the tenant storage directory, and the absolute location was rebuilt from it without checking that the result stayed inside that directory. A record whose location pointed outside storage had that file served as a normal attachment to any user authorised for the record. The location is now verified before a file is read, and a record that fails the check is answered as a missing file; the abandoned-upload cleanup applies the same check before deleting.
  </details>
