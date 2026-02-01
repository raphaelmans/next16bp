# [01-47] Reusable Email Verification Screen with OTP + Magic Link

> Date: 2026-02-02
> Previous: 01-45-email-otp-auth.md

## Summary

Unified the post-registration and post-magic-link confirmation screens into a single reusable `EmailVerificationScreen` component that offers both a 6-digit OTP input and a "check your email for a link" hint. Removed the standalone `/otp` route since OTP verification is now inline on the confirmation screens. Updated email templates to include both the magic link button and the OTP code.

## Changes Made

### New Component

| File | Change |
|------|--------|
| `src/features/auth/components/email-verification-screen.tsx` | **New** reusable component with OTP input, 60s resend cooldown, verify button, and back-to-login link |

### Backend (verifySignUpOtp procedure)

| File | Change |
|------|--------|
| `src/lib/modules/auth/repositories/auth.repository.ts` | Added `verifySignUpOtp(email, token)` using `type: "signup"` |
| `src/lib/modules/auth/services/auth.service.ts` | Added `verifySignUpOtpCode(email, token)` with business event logging |
| `src/lib/modules/auth/auth.router.ts` | Added `verifySignUpOtp` public mutation using `VerifyEmailOtpSchema` |
| `src/features/auth/hooks.ts` | Added `useVerifySignUpOtp` hook |

### Frontend Form Updates

| File | Change |
|------|--------|
| `src/features/auth/components/register-form.tsx` | Success state now renders `EmailVerificationScreen`; OTP verify via `verifySignUpOtp`, resend via re-calling `register` |
| `src/features/auth/components/magic-link-form.tsx` | Success state now renders `EmailVerificationScreen`; OTP verify via `verifyEmailOtp`, resend via re-calling `loginWithMagicLink` |
| `src/features/auth/components/login-form.tsx` | Removed "Sign in with email code" link; renamed magic link text to "Sign in with email link" |

### Route Cleanup

| File | Change |
|------|--------|
| `src/app/(auth)/otp/page.tsx` | **Deleted** standalone OTP page |
| `src/common/app-routes.ts` | Removed `otp` route config and from `guestBases` array |
| `src/features/auth/components/index.ts` | Replaced `EmailOtpForm` export with `EmailVerificationScreen` |

### Email Templates

| File | Change |
|------|--------|
| `supabase/templates/confirmation.html` | Updated copy; added `{{ .Token }}` OTP code block in styled box |
| `supabase/templates/magic_link.html` | Updated copy; added `{{ .Token }}` OTP code block in styled box |

## Key Decisions

- Reused existing `VerifyEmailOtpSchema` for the new `verifySignUpOtp` procedure since the shape is identical (email + 6-digit token)
- The `EmailOtpForm` component is kept in the codebase but no longer exported or routed to; it can be deleted later if desired
- For register resend, we re-call the full `register` mutation (Supabase handles re-sending confirmation for existing unverified users)
- Magic link OTP uses `type: "email"` (via existing `verifyEmailOtp`), while signup OTP uses `type: "signup"` (via new `verifySignUpOtp`)

## Next Steps

- [ ] Update Supabase dashboard email template settings to match the new HTML templates
- [ ] Consider deleting `email-otp-form.tsx` if no longer needed
- [ ] Manual test: register flow with OTP verification
- [ ] Manual test: magic link flow with OTP verification
