# [01-01] React Best Practice Fixes

> Date: 2026-01-23
> Previous: 01-00-org-public-landing.md

## Summary

Hardened redirect handling to prevent guest-route loops, moved render-phase state updates into effects, memoized expensive derived data, and removed mixed client/server barrel imports to align with Vercel React best practices.

## Changes Made

### Redirect Safety

| File | Change |
| --- | --- |
| `src/shared/lib/redirects.ts` | Added route policy checks and disallowed guest/self redirects in safe redirect helper. |
| `src/proxy.ts` | Prevented guest-route redirect loops for authenticated users. |
| `src/app/auth/callback/route.ts` | Disallowed guest-route redirects after OAuth callback. |
| `src/app/auth/confirm/route.ts` | Disallowed guest-route redirects after magic link/OTP confirm. |
| `src/modules/auth/services/auth.service.ts` | Enforced guest-route block on redirect URLs for auth flows. |
| `src/features/auth/components/login-form.tsx` | Sanitized client redirect param before navigation. |
| `src/features/auth/components/register-form.tsx` | Sanitized client redirect param before navigation. |
| `src/features/auth/components/magic-link-form.tsx` | Sanitized client redirect param before navigation. |

### Rerender and Render Safety

| File | Change |
| --- | --- |
| `src/app/(admin)/admin/courts/page.tsx` | Moved filter page reset into an effect. |
| `src/app/(admin)/admin/claims/page.tsx` | Moved filter page reset into an effect. |
| `src/app/(public)/places/[placeId]/page.tsx` | Memoized organization options and time slot mapping; stabilized slot select handler. |
| `src/app/(auth)/home/page.tsx` | Memoized reservation derivations to avoid repeated work per render. |
| `src/features/owner/hooks/use-owner-places.ts` | Memoized court data array to reduce downstream rerenders. |

### Client/Server Import Hygiene

| File | Change |
| --- | --- |
| `src/shared/components/layout/public-shell.tsx` | Switched to direct imports for navbar/footer modules. |
| `src/features/discovery/components/footer.tsx` | Switched Container import to direct module. |
| `src/app/(public)/layout.tsx` | Switched PublicShell import to direct module. |
| `src/app/(auth)/layout.tsx` | Switched PlayerShell/PublicShell imports to direct modules. |
| `src/app/(public)/org/[slug]/page.tsx` | Switched layout imports to direct modules. |
| `src/app/(public)/contact-us/page.tsx` | Switched Container import to direct module. |

## Key Decisions

- Centralized redirect policy checks in `getSafeRedirectPath` and applied consistent disallow rules across server and client.
- Preferred direct module imports over mixed barrels to avoid client boundary leakage.

## Next Steps (if applicable)

- [ ] Run `pnpm lint`.
- [ ] Run `TZ=UTC pnpm build`.
- [ ] Smoke-test auth redirects for login/register/magic-link/OAuth flows.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
