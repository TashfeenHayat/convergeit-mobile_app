# Email module (frontend)

NestJS APIs return `{ success: true, data }`. All requests use the shared axios client (`NEXT_PUBLIC_API_BASE_URL`) with Bearer JWT.

**Never** send or display: `scope`, `transportMode`, `usePlatformMail`.

## Routes

| Path | Tab | Who |
|------|-----|-----|
| `/dashboard/email` | Hub redirect | Anyone with mail or template view |
| `/dashboard/email/connection/platform` | Mail → Platform mail | Internal (`userType=Internal`) only |
| `/dashboard/email/connection/reseller` | Mail → Reseller mail | Internal: list + add; External with `resellerId`: own form only |
| `/dashboard/email/connection/assignment` | Mail → Use platform mail | Internal only |
| `/dashboard/email/design` | Email design | Reseller-scoped (JWT `resellerId` or internal picker) |
| `/dashboard/email/form` | Wrap-up form | Placeholder (“Coming soon”) |
| `/dashboard/settings/email` | Alias | Redirects to `/dashboard/email` |

Legacy `/dashboard/smtp-email-integration` redirects to reseller mail.

## Actors

| Actor | Mail connection | Email design |
|-------|-----------------|--------------|
| **Internal** (no `resellerId`) | Platform mail, all resellers (picker), assignments table | Pick reseller via gate / `?resellerId=` |
| **External wide reseller** (`resellerId` on JWT) | Own reseller only — no UUID entry | Same `resellerId` automatically |
| **Narrow / client** | Hidden unless `smtp-email:view` / `page:smtp-email` | Hidden unless `email-template:view` / `page:email-template` |

## Permissions

| Area | Page | Operational |
|------|------|-------------|
| SMTP / API mail | `page:smtp-email` | `smtp-email:view`, `update`, `test`, `delete` |
| Templates / logo | `page:email-template` | `email-template:view`, `update`, `publish` |

## Three mail flows (separate screens)

1. **Platform mail** — `GET/PUT/DELETE /platform/email-settings`, `POST …/test`
2. **Reseller own mail** — `GET /email/reseller-mail-settings`, `GET/PUT/DELETE /resellers/:id/email-settings`
3. **Platform assignment** — `GET /email/platform-mail-assignments`, `GET/PUT/DELETE /resellers/:id/platform-mail-assignment` (reseller uses platform sender only; no per-reseller from override)

Providers: `GET /email/providers`, `GET /email/providers/:id/form-schema` (dynamic fields by `fieldKey`).

Templates: `/resellers/:id/email-templates/draft`, `…/publish`, `…/preview`, `…/published`, logo `POST/DELETE …/email-branding/logo`.

## Code layout

```
features/email/
  api/email-api.ts      # typed HTTP (re-exports api/email)
  types.ts              # API shapes
  hooks/                # React Query keys + hooks
  components/
    MailConnectionForm.tsx   # provider + from + test (schema-driven)
  pages/                # screens imported by app/dashboard/email/*
  context/              # reseller scope for design tabs
```
