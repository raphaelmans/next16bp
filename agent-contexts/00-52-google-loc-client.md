# [00-52] Google Loc Client

> Date: 2026-01-16
> Previous: 00-51-schedule-default-open.md

## Summary

Standardized non-tRPC HTTP response types and error handling, added a ky-based Google Maps location client with Query Key Factory keys, and refactored admin/owner/PoC forms to use the new React Query mutation. Admin city fields now match owner (free-text input).

## Changes Made

### Implementation

| File | Change |
| --- | --- |
| `src/shared/kernel/response.ts` | Added `ApiResponse` + `ApiErrorResponse` types and response schema helper. |
| `src/shared/infra/http/error-handler.ts` | Added shared HTTP error handler with structured logging. |
| `src/shared/utils/response.ts` | Added `wrapResponse` helper for envelope responses. |
| `src/shared/lib/clients/google-loc-client/index.ts` | Added ky client, `ApiClientError`, and React Query mutation hook. |
| `src/shared/lib/clients/google-loc-client/query-keys.ts` | Added Query Key Factory keys for non-tRPC cache. |
| `src/app/api/poc/google-loc/route.ts` | Updated to envelope responses and standardized errors. |
| `src/app/api/public/countries/route.ts` | Switched to `globalThis.crypto.randomUUID()`. |
| `src/shared/infra/trpc/context.ts` | Switched to `globalThis.crypto.randomUUID()`. |
| `src/app/(admin)/admin/courts/new/page.tsx` | Use google-loc mutation + free-text city input. |
| `src/app/(admin)/admin/courts/batch/page.tsx` | Use free-text city input. |
| `src/features/owner/components/place-form.tsx` | Use google-loc mutation for preview. |
| `src/app/(public)/poc/google-loc/page.tsx` | Use google-loc mutation for preview. |

### Documentation

| File | Change |
| --- | --- |
| `guides/server/core/api-response.md` | Added `ApiErrorResponse` and route handler guidance. |
| `guides/server/core/error-handling.md` | Standardized error handler types for `route.ts`. |
| `guides/server/nextjs/route-handlers.md` | Added Next.js route handler template. |
| `guides/client/core/folder-structure.md` | Documented shared non-tRPC clients path. |
| `guides/client/core/data-fetching.md` | Added non-tRPC HTTP client guidance. |
| `guides/client/nextjs/ky-fetch.md` | Added ky + error envelope conventions. |
| `guides/client/nextjs/query-keys.md` | Added Query Key Factory conventions. |
| `guides/client/nextjs/README.md` | Linked new client docs. |
| `AGENTS.md` | Added non-tRPC HTTP conventions + guide links. |

## Key Decisions

- Adopted `ApiResponse<T>`/`ApiErrorResponse` in `shared/kernel/response.ts` for all non-tRPC HTTP and ky client parsing.
- Centralized non-tRPC error formatting via `shared/infra/http/error-handler.ts` and reused across route handlers.
- Standardized non-tRPC caching with Query Key Factory (`query-keys.ts`) and React Query mutation hooks.
- Aligned admin city inputs to free-text to match owner form behavior.

## Next Steps

- [ ] Remove unrelated untracked files that were not part of this change set.
- [ ] Commit changes if desired.

## Commands to Continue

```bash
pnpm lint
TZ=UTC pnpm build
```
