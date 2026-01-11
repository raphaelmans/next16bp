# [00-11] Auth Routing Refactor

> Date: 2026-01-11
> Previous: 00-10-storage-bucket-seed.md

## Summary

Implemented a type-safe route registry and proxy-based auth guarding for Next.js 16 while consolidating public/authenticated navigation shells. Updated layout guards to server-side session checks and migrated route literals to the new route registry.

## Changes Made

### Implementation

| File | Change |
|------|--------|
| `src/shared/lib/app-routes.ts` | Added centralized route registry with access types and helpers. |
| `src/proxy.ts` | Replaced hardcoded route arrays with `appRoutes` and injected `x-pathname`. |
| `src/shared/infra/auth/server-session.ts` | Added server session helpers and admin guard. |
| `src/app/(auth)/layout.tsx` | Converted to server-side auth guard using headers + route types. |
| `src/app/(owner)/layout.tsx` | Switched to server session guard + org checks via factory. |
| `src/app/(admin)/layout.tsx` | Switched to admin server guard. |
| `src/shared/components/layout/*` | Added public/app/player shells and unified sidebar/nav usage. |
| `src/features/**` | Replaced literal routes with `appRoutes` in navs, CTAs, and redirects. |

### Planning Artifacts

| File | Change |
|------|--------|
| `agent-plans/user-stories/11-ui-revamp/*` | Captured UI revamp user stories. |
| `agent-plans/11-ui-revamp/*` | Created implementation plan and checklist. |

### External Skill Update

| Location | Change |
|----------|--------|
| `/Users/raphaelm/Documents/Coding/node-architecture/opencode-skills/nextjs-auth-routing/SKILL.md` | Added skill for Next.js 16 auth + routing. |
| `/Users/raphaelm/Documents/Coding/node-architecture/opencode-skills/context.md` | Registered new skill entry. |

## Key Decisions

- Centralized route definitions in `appRoutes` for type safety and access control metadata.
- Used `proxy.ts` (Next.js 16) to enforce auth/guest redirects and pass `x-pathname` to server layouts.
- Replaced client-only auth guards with server session helpers to avoid public client usage in layouts.

## Next Steps

- [ ] Run a smoke test through auth/guest redirects and owner/admin routes.

## Commands to Continue

```bash
# Typecheck / lint if desired
pnpm lint
pnpm typecheck
```
