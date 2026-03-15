# Phase 1: Server OAuth Start + Callback Hardening

**Dependencies:** None  
**Parallelizable:** Partial  
**User Stories:** `US-00-01`

---

## Objective

Introduce a server-only OAuth start flow via tRPC and harden the PKCE callback to safely redirect while ensuring role records exist for OAuth users.

---

## Module 1A: tRPC Mutation + Auth Service/Repository

### Files

- `src/modules/auth/dtos/oauth.dto.ts` (new)
- `src/modules/auth/dtos/index.ts`
- `src/modules/auth/repositories/auth.repository.ts`
- `src/modules/auth/services/auth.service.ts`
- `src/modules/auth/auth.router.ts`
- `src/modules/auth/errors/auth.errors.ts` (optional new error)

### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `auth.loginWithGoogle` | Mutation | `{ next?: string }` | `{ url: string }` |

### Flow

```
Login/Register UI
    │
    ▼
trpc.auth.loginWithGoogle({ next })
    │
    ▼
AuthService.startGoogleOAuth(baseUrl, next)
    │
    ▼
Supabase signInWithOAuth({ provider: "google", redirectTo })
    │
    ▼
Return data.url to client
```

### Implementation Steps

1. Add `StartGoogleOAuthSchema` in `oauth.dto.ts` with optional `next`.
2. Add `signInWithGoogleOAuth(redirectTo)` in repository to call `signInWithOAuth` and return `data.url`.
3. Add `startGoogleOAuth(baseUrl, next)` in service to build redirect URL to `/auth/callback?next=...` and call repo.
4. Add new tRPC mutation `auth.loginWithGoogle` using `ctx.cookies` and `ctx.origin`.
5. Add an auth domain error for missing redirect URL (optional but recommended).

---

## Module 1B: Callback Exchange + User Role Ensure

### Files

- `src/app/auth/callback/route.ts`
- `src/modules/user-role/factories/user-role.factory.ts`
- `src/modules/user-role/errors/user-role.errors.ts`

### Flow

```
OAuth callback /auth/callback?code=...&next=/home
    │
    ▼
exchangeCodeForSession(code)
    │
    ├─ ensure user_roles row exists (default member)
    ▼
redirect to safe next path
```

### Implementation Steps

1. Guard `next` to only allow relative paths (fallback to `/`).
2. After successful `exchangeCodeForSession`, check for `data.user` and create `user_roles` if missing.
3. Ignore UserRoleAlreadyExists conflicts to keep flow idempotent.

---

## Testing Checklist

- [ ] Start Google OAuth returns `url` from server.
- [ ] Callback with invalid `next` defaults to `/`.
- [ ] OAuth user gets `user_roles` if missing.
- [ ] Existing user role does not error.
