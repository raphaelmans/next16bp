# [00-00] Server-Side Auth & Convention Compliance

> Date: 2025-01-06
> Previous: None (initial)

## Summary

Implemented complete server-side authentication with Supabase following layered architecture conventions. Fixed circular dependencies, migrated to Next.js 16 proxy convention, and aligned documentation with implementation.

## Changes Made

### Implementation - Auth Module

| File | Change |
|------|--------|
| `src/modules/auth/repositories/auth.repository.ts` | Added `IAuthRepository` interface |
| `src/modules/auth/services/auth.service.ts` | Added `IAuthService` interface |
| `src/modules/auth/errors/auth.errors.ts` | Added unique error codes (`AUTH_*`) |
| `src/modules/auth/use-cases/register-user.use-case.ts` | Use domain error instead of generic `Error` |
| `src/modules/auth/factories/auth.factory.ts` | Request-scoped factories for Supabase |
| `src/modules/auth/auth.router.ts` | tRPC router with login, register, magic-link, logout, me |
| `src/modules/auth/dtos/` | Login, Register, MagicLink schemas |

### Implementation - User Role Module

| File | Change |
|------|--------|
| `src/modules/user-role/errors/user-role.errors.ts` | Added unique error codes (`USER_ROLE_*`) |
| `src/modules/user-role/services/user-role.service.ts` | Added business event logging (`user_role.created`) |
| `src/modules/user-role/repositories/user-role.repository.ts` | `IUserRoleRepository` interface |
| `src/modules/user-role/factories/user-role.factory.ts` | Lazy singleton factory (DB-backed) |

### Implementation - Infrastructure

| File | Change |
|------|--------|
| `src/shared/kernel/errors.ts` | Changed `readonly code` to `readonly code: string` for subclass override |
| `src/shared/infra/trpc/trpc.ts` | Inline middleware (logger + auth) to avoid circular deps, added `requestId` to error logs |
| `src/shared/infra/trpc/context.ts` | Session extraction from Supabase + role enrichment from DB |
| `src/shared/infra/logger/index.ts` | Pino configuration with request logger |
| `src/shared/infra/supabase/create-client.ts` | SSR-compatible Supabase client |
| `src/proxy.ts` | **Renamed from middleware.ts** - Next.js 16 convention |

### Implementation - Cleanup

| File | Change |
|------|--------|
| `src/shared/infra/trpc/middleware/auth.middleware.ts` | **Deleted** - orphaned file causing circular deps |
| `src/shared/infra/trpc/middleware/` | **Deleted** - empty directory |
| `src/modules/health/health.router.ts` | Removed direct logging (handled by middleware) |

### Client-Side Auth

| File | Change |
|------|--------|
| `src/hooks/auth/` | `useSession`, `useLogin`, `useRegister`, `useMagicLink`, `useLogout` |
| `src/components/auth/` | `LoginForm`, `RegisterForm`, `MagicLinkForm` |
| `src/app/(auth)/` | `/login`, `/register`, `/magic-link` pages |
| `src/app/(protected)/dashboard/` | Protected dashboard page |

### Documentation Updates (node-architecture)

| File | Change |
|------|--------|
| `server/core/overview.md` | Updated folder structure (no `lib/` nesting, added `proxy.ts`) |
| `server/core/logging.md` | Inline middleware pattern, log format convention |
| `server/core/transaction.md` | Updated to postgres.js driver |
| `server/core/conventions.md` | Fixed import paths, layer checklist |
| `server/core/error-handling.md` | Error class checklist |
| `server/trpc/integration.md` | postgres.js driver, inline middleware |
| `server/supabase/auth.md` | Complete Supabase auth docs, proxy convention |
| `server/skills/backend-auth/SKILL.md` | Auth checklist, proxy naming |

## Key Decisions

1. **No browser Supabase client** - All client auth goes through tRPC for security
2. **Request-scoped auth factories** - Supabase client needs request-specific cookies
3. **Lazy singleton for DB modules** - User-role uses lazy singleton (not request-scoped)
4. **Inline tRPC middleware** - Avoid circular dependencies by defining logger/auth middleware inline in `trpc.ts`
5. **User roles in separate table** - `user_roles` table with FK to `auth.users`, allows custom roles
6. **Unique error codes** - Format: `<MODULE>_<ERROR_TYPE>` (e.g., `AUTH_INVALID_CREDENTIALS`)
7. **Next.js 16 proxy** - Renamed `middleware.ts` to `proxy.ts`, export `proxy` not `middleware`
8. **postgres.js driver** - Better serverless compatibility than node-postgres

## Architecture

```
Request Flow:
Browser → proxy.ts (session refresh) → tRPC route → context.ts (session + role) → router → service → repository
                                                            ↓
                                                    Supabase Auth + user_roles DB
```

## Files Structure

```
src/
├── proxy.ts                    # Session refresh, route protection
├── shared/
│   ├── kernel/
│   │   ├── auth.ts            # Session, UserRole types
│   │   ├── errors.ts          # Base error classes
│   │   └── ...
│   └── infra/
│       ├── trpc/
│       │   ├── trpc.ts        # tRPC init + inline middleware
│       │   ├── context.ts     # Session extraction
│       │   └── root.ts        # Root router
│       ├── supabase/
│       │   └── create-client.ts
│       └── logger/
│           └── index.ts
├── modules/
│   ├── auth/                  # Request-scoped (needs cookies)
│   │   ├── auth.router.ts
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── factories/
│   │   ├── use-cases/
│   │   ├── dtos/
│   │   └── errors/
│   ├── user-role/             # Lazy singleton (DB-backed)
│   │   └── ...
│   └── health/
│       └── health.router.ts
└── hooks/auth/                # Client hooks
```

## Next Steps

- [ ] Test auth flow end-to-end (login, register, logout, magic-link)
- [ ] Fix pre-existing `resizable.tsx` TypeScript error (unrelated)
- [ ] Consider adding password reset flow
- [ ] Add OAuth providers if needed

## Commands to Continue

```bash
# Start dev server
pnpm dev

# Type check
pnpm tsc --noEmit

# Copy updated guides to boilerplate
/Users/raphaelm/Documents/Coding/node-architecture/copy-guides.sh /Users/raphaelm/Documents/Coding/boilerplates/next16bp

# Install skills to OpenCode
cp -r /Users/raphaelm/Documents/Coding/node-architecture/opencode-skills/* ~/.config/opencode/skill/
```
