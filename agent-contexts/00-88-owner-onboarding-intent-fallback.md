# [00-88] Owner Onboarding Intent Fallback

> Date: 2026-01-21
> Previous: 00-87-owner-partner-landing.md

## Summary

Implemented a React Query-backed localStorage fallback that preserves owner onboarding intent when auth flows land on `/home`. The intent is set on the “Start onboarding” CTA, redirects `/home` to owner onboarding when no org exists, and is cleared after org creation, logout, or any owner page visit.

## Changes Made

### Owner Onboarding Intent

| File | Change |
| --- | --- |
| `src/shared/lib/owner-onboarding-intent.ts` | Added React Query hooks to read/write the localStorage intent flag. |
| `src/app/(public)/list-your-venue/page.tsx` | Sets intent flag on CTA click. |
| `src/app/(auth)/home/page.tsx` | Redirects to onboarding when intent is set and no org exists; clears flag when org exists. |
| `src/app/(auth)/owner/onboarding/organization-form-client.tsx` | Clears intent flag after organization creation. |
| `src/features/auth/hooks/use-auth.ts` | Clears intent on logout. |
| `src/features/owner/components/owner-onboarding-intent-clearer.tsx` | Clears intent when any owner page loads. |
| `src/app/(owner)/layout.tsx` | Mounts the intent clearer for all owner routes. |

### Planning Artifacts

| File | Change |
| --- | --- |
| `agent-plans/56-auth-redirect-continuity/56-00-overview.md` | Added Module 2C for owner intent fallback. |
| `agent-plans/56-auth-redirect-continuity/56-01-redirect-standardization.md` | Documented localStorage fallback module. |
| `agent-plans/56-auth-redirect-continuity/56-02-qa.md` | Added QA item for the intent redirect. |

### Tooling / Validation

| Command | Result |
| --- | --- |
| `pnpm lint` | Passed (Biome check) |
| `pnpm build` | Passed (Next.js build) |

## Key Decisions

- Use React Query hooks as the single interface to localStorage for onboarding intent.
- Clear intent on any owner route to avoid stale onboarding redirects after org creation.

## Commands to Continue

```bash
pnpm dev
```
