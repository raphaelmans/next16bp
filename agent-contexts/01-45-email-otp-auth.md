# [01-45] Email OTP Auth

> Date: 2026-02-02
> Previous: 01-44-notification-system-test-tools.md

## Summary

Implemented an email OTP (code-based) sign-in flow as a reliable alternative to magic links. Added server-side OTP request/verify endpoints, a two-step UI, and new routing while keeping magic links available.

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/lib/modules/auth/dtos/email-otp.dto.ts` | Added request/verify schemas for email OTP. |
| `src/lib/modules/auth/dtos/index.ts` | Exported email OTP DTOs. |
| `src/lib/modules/auth/repositories/auth.repository.ts` | Added `requestEmailOtp` + `verifyEmailOtp` methods. |
| `src/lib/modules/auth/services/auth.service.ts` | Added email OTP request/verify service methods + logging. |
| `src/lib/modules/auth/auth.router.ts` | Added `requestEmailOtp` (rate-limited) and `verifyEmailOtp` endpoints. |
| `src/features/auth/hooks.ts` | Added hooks for request/verify email OTP; invalidates `auth.me` on verify. |
| `src/features/auth/components/email-otp-form.tsx` | New two-step email OTP form with resend + change email. |
| `src/features/auth/components/index.ts` | Exported `EmailOtpForm`. |
| `src/app/(auth)/otp/page.tsx` | New OTP route page. |
| `src/common/app-routes.ts` | Added `/otp` guest route. |
| `src/features/auth/components/login-form.tsx` | Added link to OTP flow; kept magic link alternative. |

## Key Decisions

- Auto-create users for OTP (`shouldCreateUser: true`) to match existing magic-link behavior.
- Keep magic link route, but promote OTP from the login page.

## Next Steps (if applicable)

- [ ] Update Supabase “Magic Link” email template to send `{{ .Token }}` (OTP code).
- [ ] Run `pnpm lint` and `TZ=UTC pnpm build`.
- [ ] Manual test: `/otp?redirect=/post-login` request + verify code, confirm redirect + session.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
