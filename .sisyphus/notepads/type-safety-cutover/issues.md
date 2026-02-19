# Issues

Append-only.

## 2026-02-18
- Worktree has pre-existing uncommitted changes in `src/lib/shared/infra/auth/mobile-session.ts`, `src/lib/shared/infra/auth/server-session.ts`, `src/lib/shared/infra/trpc/context.ts`, and `src/lib/shared/kernel/auth.ts` (adds `normalizeUserRole` and removes a role assertion).

## 2026-02-19
- Root cause: mechanical rewrite left a malformed footer in `src/features/open-play/api.ts` by duplicating the singleton/getter block and injecting stray text (`i(deps);`).
- Fix: removed the duplicate footer block and stray line, leaving one module-scope `OPEN_PLAY_API_SINGLETON` and one `getOpenPlayApi()` export to preserve singleton runtime behavior.
