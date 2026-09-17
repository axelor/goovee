# Migrating the file storage settings

Move a Goovee deployment onto the file storage settings that let a tenant keep
its files in an S3-compatible bucket as well as on a filesystem. Follow this
runbook when upgrading:

- **2.3.x → 2.4.0 or later**

Every deployment performs step 1, whatever storage it uses: the previous
spelling of the setting is refused. Steps 2 to 5 concern a tenant moving to
object storage. [CONFIGURATION.md](../CONFIGURATION.md) describes every setting
written here.

---

## 1. Rewrite the storage setting

`aos.storage` named the storage directory with one string. Make it the
`filesystem` provider of a `storage` group:

```json
"aos": {
  "url": "https://erp.example.com/axelor-erp",
  "storage": {
    "provider": "filesystem",
    "filesystem": {"dir": "/var/lib/portal/acme/upload"}
  },
  "auth": {"apiKey": "…"}
}
```

As variables, `PORTAL_TENANT_<ID>_AOS_STORAGE` becomes two:

```
PORTAL_TENANT_<ID>_AOS_STORAGE_PROVIDER=filesystem
PORTAL_TENANT_<ID>_AOS_STORAGE_FILESYSTEM_DIR=/var/lib/portal/acme/upload
```

Write the AOS instance's `data.upload.dir`, without the tenant segment: a
tenant on a shared AOS keeps its `aos.tenantId`, and the portal joins that onto
`dir` itself.

A deployment still on the flat variables of a release before 2.3.0 runs
`pnpm config:migrate` first, as
[the per-tenant configuration runbook](./multi-tenancy.md) describes.

Then check the result before starting:

```
pnpm config:check
```

A configuration still carrying the string form is refused — as a variable,
`PORTAL_TENANT_<ID>_AOS_STORAGE names no setting`; in a document,
`tenants.<id>.aos.storage is a group of settings, not a setting`.

### Delete the part files the previous release left

The previous release gathered each upload at the top of the storage directory
under a name ending in `.part`. Those files belong to no record and can go once
it has stopped — but a file a visitor named `report.part` is stored under a key
ending the same way, and no pattern tells the two apart. Run this against the
tenant's database first, once per tenant:

```sql
SELECT
  file_path
FROM
  meta_file
WHERE
  file_path LIKE '%.part'
  AND file_path NOT LIKE '%/%';
```

With no rows, delete the leftovers. They sit at the top of the tenant's own
storage directory, so a dedicated instance has them in the storage directory and
a shared instance under each tenant's segment:

```
rm -f /var/lib/portal/acme/upload/*.part
rm -f /var/lib/portal/acme/upload/"<tenantId>"/*.part
```

Keep the quotes when substituting the tenant id: unquoted, a shell reads
`<tenantId>` as a redirection and the path left for `rm -f` is the storage
directory itself.

With rows, delete the others by hand and keep every path the query returned.

An upload that was in progress on the previous release cannot be resumed on this
one. The visitor picks the file again.

## 2. Prepare the bucket

Settle the AOS instance's `data.object-storage.*` settings, as the AOP
documentation on file storage describes; step 4 writes the same values into the
tenant. Any S3-compatible service works, addressed by its endpoint.

Create the bucket before starting the portal — AOS creates a missing bucket at
startup, the portal does not.

Point `PORTAL_UPLOAD_TEMP_DIR` at a volume that survives a restart, and an
interrupted upload resumes from the exact byte it reached. It defaults to
`portal/uploads` under the operating system's temporary directory; where that is
cleared between restarts, an upload resumes from the last whole part instead.

Grant the credential `s3:ListBucket` on the bucket, beside the object
permissions the uploads and downloads use. The portal checks the bucket as a
tenant connects and fails the tenant without that permission, although every
file operation would work.

### Give the bucket a lifecycle rule

Give the bucket a rule that aborts incomplete multipart uploads:
`AbortIncompleteMultipartUpload` on AWS, the same under its own name elsewhere.

**Set its window to at least 25 hours**; a few days is a safe figure. A shorter
window aborts an upload that is still being filled, and the next request against
it fails.

Without the rule, parts of uploads that were never completed stay in the bucket.
They are billed, and they do not show in an object listing — only
`ListMultipartUploads` shows them.

## 3. Copy the files

Stop AOS and the portal, or stop writes to them: a file uploaded after the copy
is not in the bucket.

Every file has to be in the bucket before the switch, under the key its
`meta_file` row records:

- a dedicated AOS instance (no `aos.tenantId`): the path relative to the storage
  directory — `<dir>/2026-3/report.pdf` becomes `2026-3/report.pdf`;
- a tenant on a shared AOS: the same path under the tenant's prefix —
  `<dir>/<tenantId>/2026-3/report.pdf` becomes `<tenantId>/2026-3/report.pdf`.

Copying the directory as it stands produces those keys. Leave out the staging
directory, which no record names; step 1 removed everything else that belongs to
no record, so copy the rest as it is:

```
aws s3 sync /var/lib/portal/acme/upload s3://files/ --endpoint-url https://minio.example.com:9000 \
  --exclude ".uploads-in-progress/*" --exclude "*/.uploads-in-progress/*"
```

or, with the MinIO client,

```
mc mirror --exclude ".uploads-in-progress/*" --exclude "*/.uploads-in-progress/*" \
  /var/lib/portal/acme/upload local/files
```

Both patterns are needed: a pattern is matched against the whole key, so
`.uploads-in-progress/*` reaches only a dedicated instance's staging directory
and `*/.uploads-in-progress/*` only a shared instance's.

## 4. Switch the tenant

Change the AOS instance's settings and the tenant's together, then start both:

```json
"aos": {
  "url": "https://erp.example.com/axelor-erp",
  "storage": {
    "provider": "s3",
    "s3": {
      "endpoint": "https://minio.example.com:9000",
      "region": "us-east-1",
      "bucket": "files",
      "accessKey": "…",
      "secretKey": "…",
      "pathStyle": true
    }
  },
  "auth": {"apiKey": "…"}
}
```

```
PORTAL_TENANT_<ID>_AOS_STORAGE_PROVIDER=s3
PORTAL_TENANT_<ID>_AOS_STORAGE_S3_ENDPOINT=https://minio.example.com:9000
PORTAL_TENANT_<ID>_AOS_STORAGE_S3_REGION=us-east-1
PORTAL_TENANT_<ID>_AOS_STORAGE_S3_BUCKET=files
PORTAL_TENANT_<ID>_AOS_STORAGE_S3_ACCESS_KEY=…
PORTAL_TENANT_<ID>_AOS_STORAGE_S3_SECRET_KEY=…
PORTAL_TENANT_<ID>_AOS_STORAGE_S3_PATH_STYLE=true
```

Remove the `filesystem` group at the same time: a configuration naming one
provider while carrying the settings of another is refused.

Each setting is the AOS setting of the same name: `endpoint` is
`data.object-storage.endpoint` with its scheme, `pathStyle` is
`data.object-storage.path-style`, and `encryption`, `kmsKeyId` and
`storageClass` follow `data.object-storage.encryption`,
`encryption-kms-key-id` and `storage-class`. Leave `accessKey` and `secretKey`
out to let the client find credentials where AWS tooling looks for them: the
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` variables, a shared credentials
file, or the role of the machine the portal runs on.

A tenant whose bucket the portal cannot reach fails to connect, showing
`Error connecting tenant` at the first request rather than at the first upload.
A wrong endpoint, a wrong bucket name, a bad credential and a credential
without `s3:ListBucket` all surface that way, so check all four.

### Delete the staging directory

Once the tenant is on the bucket, delete the directory the copy left out;
nothing reclaims it after the move. It sits inside the tenant's own storage
directory, so a dedicated instance has one and a shared instance has one per
tenant:

```
rm -rf /var/lib/portal/acme/upload/.uploads-in-progress
rm -rf /var/lib/portal/acme/upload/"<tenantId>"/.uploads-in-progress
```

Keep the quotes when substituting the tenant id: unquoted, a shell reads
`<tenantId>` as a redirection and the path left for `rm -rf` is the storage
directory itself.

An upload that was in progress when writes stopped is not carried over. The
visitor picks the file again.

### The `store_type` column

Optional. `meta_file.store_type` records the kind of store a file was written
to, `1` for a filesystem and `2` for object storage. Neither application reads
it back, so rows written before the switch keep `1` and are served from the
bucket all the same. Set them to `2` to keep the column truthful:

```sql
UPDATE meta_file
SET
  store_type = 2
WHERE
  store_type = 1;
```

## 5. Verify

With both applications running on the bucket:

1. Open a page that shows an image AOS uploaded — a news item, a workspace logo.
   It is served from the bucket.
2. Upload a file through the portal — a comment attachment, a resource — and
   open it again from the portal.
3. Open the same file in the AOS back office, from the record it was attached
   to. AOS reads the object the portal wrote, under the key the row records.
4. In the bucket, the objects sit under the tenant's prefix on a shared
   instance, and at the top of the bucket on a dedicated one.

A file that opens in one application and not the other means the two are not
configured for the same bucket, or one of them still names the filesystem.
