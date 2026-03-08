---
tags:
  - agent-context
  - frontend/root
  - frontend/auth
date: 2026-03-08
previous: 03-04-seo-index-gating.md
related_contexts:
  - "[[01-86-pwa-portal-redirect]]"
  - "[[01-86-portal-nav-pwa-redirect]]"
---

# [03-05] Root Landing No Redirect

> Date: 2026-03-08
> Previous: 03-04-seo-index-gating.md

## Summary

Removed the automatic redirect behavior from the root route so `/` always renders the landing page without a server or client bounce. The default-portal localStorage path was also removed from auth and shell plumbing, leaving portal preference routing to `/post-login`, DB preference, and the `kudos.portal-context` cookie.

## Related Contexts

- [[01-86-pwa-portal-redirect]] - This note introduced the localStorage-driven landing-page redirect that was removed in this session.
- [[01-86-portal-nav-pwa-redirect]] - This note expanded the same pattern with DB-sync and shell seeding, which this session simplified away.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/app/page.tsx` | Removed `cookies()`/`getServerSession()` root redirect gating and deleted the inline `portal-redirect` script so `/` always renders the landing page. |
| `src/components/layout/dashboard-shell.tsx` | Removed the default-portal localStorage sync path; kept only the `kudos.portal-context` cookie write for non-admin, non-portal-neutral routes. |
| `src/features/auth/hooks.ts` | Removed `PORTAL_STORAGE_KEY` and the localStorage writes/clears from logout and default-portal mutation behavior. |

### Documentation

| File | Change |
|------|--------|
| `agent-contexts/03-05-root-landing-no-redirect.md` | Logged the root-route redirect removal, the preference-source simplification, and validation notes. |

## Tag Derivation (From This Session's Changed Files)

- `frontend/root` from `src/app/page.tsx`
- `frontend/auth` from `src/features/auth/hooks.ts`

## Key Decisions

- Made `/` a stable marketing entrypoint for all users instead of an implicit app bootstrap route.
- Removed `kudos.default-portal` from routing behavior entirely rather than keeping it as a fallback hint, to avoid render-then-bounce behavior and state drift between localStorage, cookies, and DB preference.
- Kept `/post-login` as the canonical place for automatic post-auth routing, since the auth flows already default there.
- Did not add a new static/cache override for `/` in this pass; the change intentionally focuses on removing request-bound redirect work first.

## Next Steps (if applicable)

- [ ] Manually smoke-test `/` while logged out and while signed in with both player and organization preferences.
- [ ] Confirm auth success flows without an explicit `redirect` param still land on `/post-login` and then route correctly.
- [ ] Decide later whether the landing page should expose a more explicit signed-in shortcut to `/home` or `/organization`.

## Commands to Continue

```bash
pnpm exec biome check src/app/page.tsx src/components/layout/dashboard-shell.tsx src/features/auth/hooks.ts
pnpm lint
```
