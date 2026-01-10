# [00-09] P2P + Asset Uploads
# [00-09] P2P + Asset Uploads

> Date: 2026-01-10
> Previous: 00-08-client-profile-fix.md

## Summary

Implemented the P2P reservation confirmation flow (payment details, proof submission, owner proof review, expired states) alongside asset upload UX integrations for courts and organizations. Cleaned repo linting issues with Biome and removed unsafe assertions flagged by lint.

## Changes Made

### Backend/Data

| File | Change |
| --- | --- |
| `src/modules/time-slot/repositories/time-slot.repository.ts` | Added payment details to slot response. |
| `src/modules/reservation/repositories/reservation.repository.ts` | Included payment proof in owner reservation query. |
| `src/modules/reservation/dtos/reservation-owner.dto.ts` | Added payment proof fields to owner DTO. |
| `src/modules/time-slot/services/time-slot.service.ts` | Exposed slot response with payment details. |

### Reservation Flow UI

| File | Change |
| --- | --- |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Added countdown, instructions, proof form, T&C checkbox, expired handling. |
| `src/features/reservation/components/countdown-timer.tsx` | New TTL countdown component. |
| `src/features/reservation/components/payment-instructions.tsx` | Payment details display with copy actions. |
| `src/features/reservation/components/payment-proof-form.tsx` | Proof inputs with optional upload. |
| `src/features/reservation/components/terms-checkbox.tsx` | Explicit T&C acceptance UI. |
| `src/features/reservation/components/reservation-expired.tsx` | Expired reservation state card. |
| `src/features/reservation/components/status-banner.tsx` | Updated payment link routing. |

### Owner Review & Uploads

| File | Change |
| --- | --- |
| `src/features/owner/components/payment-proof-card.tsx` | Owner proof display with image preview. |
| `src/features/owner/components/image-preview.tsx` | Click-to-zoom proof image. |
| `src/features/owner/components/court-photo-upload.tsx` | Court photo uploader wired to storage. |
| `src/app/(owner)/owner/settings/page.tsx` | Organization logo upload wiring. |
| `src/app/(owner)/owner/courts/[id]/slots/page.tsx` | Embedded court photo upload in slot management. |

### Lint/Infrastructure

| File | Change |
| --- | --- |
| `src/components/ui/*` | Biome formatting and a11y cleanups. |
| `src/components/ui/sidebar.tsx` | Switched to Cookie Store API. |
| `drizzle.config.ts` | Removed non-null env assertions. |
| `src/proxy.ts` | Guarded Supabase env vars. |

## Key Decisions

- Added payment details to `timeSlot.getById` to avoid extra fetches.
- Displayed owner proof in reservation owner list to simplify review workflow.
- Applied Biome formatting repo-wide to clear lint errors before final validation.

## Next Steps (if applicable)

- [ ] Verify upload buckets and RLS policies in Supabase.
- [ ] Optional: add unit coverage for new payment proof helpers.

## Commands to Continue

```bash
pnpm lint
```
