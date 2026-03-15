# Google OAuth (Server tRPC) - Master Plan

## Overview

Add Google OAuth sign-in using the existing server-only auth flow: client -> tRPC -> Supabase. This includes a new tRPC mutation to start OAuth, callback hardening for PKCE code exchange, and Google login buttons on both login and register pages using shadcn UI.

### Completed Work (if any)

- None yet.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Story | `agent-plans/user-stories/00-onboarding/00-01-user-authentication-flow.md` |
| Design System | See `agent-plans/context.md` |
| Supabase OAuth PKCE Docs | `https://supabase.com/docs/guides/auth/social-login/auth-google` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Server OAuth start + callback hardening | 1A, 1B | Partial |
| 2 | Client buttons + hooks | 2A, 2B | Yes |

---

## Module Index

### Phase 1: Server OAuth Start + Callback Hardening

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | tRPC mutation + auth service/repo | Agent 1 | `43-01-backend-google-oauth.md` |
| 1B | Callback exchange + user role ensure | Agent 1 | `43-01-backend-google-oauth.md` |

### Phase 2: Client Buttons + Hooks

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Login form Google button | Agent 1 | `43-02-frontend-google-oauth.md` |
| 2B | Register form Google button | Agent 1 | `43-02-frontend-google-oauth.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B, 2A, 2B | Server OAuth + client buttons |

---

## Dependencies Graph

```
Phase 1 ─────┬───── Phase 2
             │
            1A ─── 2A, 2B
            1B ─── 2A, 2B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| OAuth start location | tRPC mutation (server) | Enforces client -> tRPC -> Supabase flow and keeps PKCE cookies server-managed |
| Redirect handling | `redirectTo` points to `/auth/callback?next=...` | Aligns with Supabase PKCE flow and preserves app redirects |
| User role seeding | Create `user_roles` after code exchange | Ensures role-based access works for OAuth users |

---

## Document Index

| Document | Description |
|----------|-------------|
| `43-00-overview.md` | This file |
| `43-01-backend-google-oauth.md` | Server OAuth + callback setup |
| `43-02-frontend-google-oauth.md` | Login/register UI + hooks |
| `google-oauth-auth-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] `auth.loginWithGoogle` returns a provider redirect URL from the server.
- [ ] Callback exchanges code and redirects to safe `next` path.
- [ ] OAuth users get `user_roles` rows (default member) when missing.
- [ ] Login and register pages show Google sign-in button using shadcn Button.
- [ ] `pnpm lint` and `pnpm build` pass.
