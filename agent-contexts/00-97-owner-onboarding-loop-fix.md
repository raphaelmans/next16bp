# [00-97] Owner Onboarding Loop Fix

> Date: 2026-01-22
> Previous: 00-96-google-place-id.md

## Summary

Fixed an infinite client-side redirect loop triggered during owner onboarding that spammed requests to `/owner/venues/new`.

## Changes Made

### Redirect + Effect Stabilization

| File | Change |
|------|--------|
| `src/app/(auth)/owner/onboarding/organization-form-client.tsx` | Removed cache-busting redirects, avoided unstable React Query deps by destructuring `mutate`, and added a one-shot `useRef` guard so redirect happens only once (also redirects on successful org creation). |
| `src/app/(auth)/owner/onboarding/page.tsx` | Prevented swallowing Next.js `redirect()` (which throws) by restructuring the org check and added a guard to disallow `next=/owner/onboarding` self-looping. |

## Key Decisions

- Avoided putting hook return objects (React Query `useMutation` result) directly in dependency arrays; this is not referentially stable and can re-trigger effects continuously.
- Removed timestamp-based cache busting (`?r=Date.now()`), since it guarantees a different URL each render and can create navigation storms when combined with re-running effects.
- Treated `redirect()` as a control-flow throw and avoided wrapping it in a `try/catch` that can swallow the redirect.

## Next Steps

- [ ] Re-check the original reproduction path from the logs (ensure `/owner/onboarding?next=/owner/venues/new` settles after org creation).
- [ ] Consider applying the same stable-deps pattern anywhere `useSetOwnerOnboardingIntent()` is used inside `useEffect` deps.

## Commands to Continue

```bash
pnpm dev
# then reproduce:
# /owner/onboarding?next=/owner/venues/new

pnpm build
```
