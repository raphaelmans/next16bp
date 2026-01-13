# [00-25] Owner Onboarding Redirects

> Date: 2026-01-13
> Previous: 00-24-place-timezone-alignment.md

## Summary

Hardened `/owner/onboarding` to use server-side org checks, added a server tRPC caller helper, and removed client redirect loops that could cause infinite navigation. Added agent plans documenting the work and introduced a client wrapper for post-creation navigation.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/infra/trpc/server.ts` | Added server caller helper for tRPC in RSC. |
| `src/app/(auth)/owner/onboarding/page.tsx` | Converted onboarding to server component with redirect guard. |
| `src/app/(auth)/owner/onboarding/organization-form-client.tsx` | Added client wrapper for form navigation. |
| `src/app/(owner)/owner/places/new/page.tsx` | Removed client redirect loop, added CTA fallback. |
| `src/app/(owner)/owner/courts/setup/page.tsx` | Removed client redirect loop, added CTA fallback. |

### Documentation

| File | Change |
|------|--------|
| `agent-plans/19-owner-onboarding-redirect/19-00-overview.md` | Created master plan for redirect hardening. |
| `agent-plans/19-owner-onboarding-redirect/19-01-server-guard.md` | Added server guard phase details. |
| `agent-plans/19-owner-onboarding-redirect/19-02-client-cleanup.md` | Added client cleanup phase details. |
| `agent-plans/19-owner-onboarding-redirect/owner-onboarding-redirect-dev1-checklist.md` | Added dev checklist. |

## Key Decisions

- Redirect users with an organization to `/owner/places/new` to start place creation.
- Keep onboarding auth/org checks server-side to prevent client cache loops.

## Next Steps (if applicable)

- [ ] Optional: refresh editor TS server if stale diagnostic persists.

## Commands to Continue

```bash
pnpm lint
pnpm build
```
