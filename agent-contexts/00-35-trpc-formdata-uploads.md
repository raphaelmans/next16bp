# [00-35] tRPC FormData Uploads

> Date: 2026-01-13
> Previous: 00-34-booking-price-format-fix.md

## Summary

Fixed tRPC file uploads by sending `FormData` as the top-level mutation input (instead of JSON objects containing `File`). This prevents Zod (`zod-form-data`) from receiving serialized `{}` objects and resolves the “Invalid input: expected File” error.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/features/reservation/components/profile-form.tsx` | Build `FormData` and call `profile.uploadAvatar` with multipart input. |
| `src/features/reservation/components/payment-proof-upload.tsx` | Build `FormData` and call `paymentProof.upload` with multipart input; append optional strings only when non-empty. |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Use `FormData` for `paymentProof.upload` (`mutateAsync(formData)`); remove invalid `slot.paymentDetails` usage that broke TypeScript builds. |
| `src/app/(owner)/owner/settings/page.tsx` | Build `FormData` and call `organization.uploadLogo` with multipart input. |

## Key Decisions

- Kept the fix at the mutation call sites (explicit `FormData`) to reliably trigger `splitLink` → `httpLink` for multipart.
- Appended files with explicit filename (`formData.append("image", file, file.name)`) and omitted empty optional string fields to preserve prior `|| undefined` behavior.

## Next Steps

- [ ] (Optional) Add a shared `FormData` builder helper to reduce repetition across upload call sites.
- [ ] (Optional) Consider a custom tRPC link that detects nested `File` values (if you want to keep object-shaped inputs).

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
