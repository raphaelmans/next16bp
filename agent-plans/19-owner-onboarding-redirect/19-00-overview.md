# Owner Onboarding Redirect Hardening - Master Plan

## Overview

Stabilize `/owner` and `/owner/onboarding` redirects by moving org checks to the server, removing client-side validation loops, and standardizing onboarding navigation to the create-place flow.

### Completed Work

- None

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/00-onboarding/` |
| User Stories | `agent-plans/user-stories/01-organization/` |
| Auth Routing Guide | `guides/client/nextjs/skills/nextjs-auth-routing/SKILL.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Server-side guard + tRPC caller | 1A, 1B | Yes |
| 2 | Client cleanup + onboarding wrapper | 2A, 2B | Yes |

---

## Module Index

### Phase 1: Server Guard

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Server tRPC caller helper | Agent 1 | `19-01-server-guard.md` |
| 1B | Onboarding server redirect logic | Agent 1 | `19-01-server-guard.md` |

### Phase 2: Client Cleanup

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Client wrapper for org form nav | Agent 1 | `19-02-client-cleanup.md` |
| 2B | Remove client redirect loops | Agent 1 | `19-02-client-cleanup.md` |

---

## Developer Assignments

| Developer | Modules | Focus Area |
|-----------|---------|------------|
| Dev 1 | 1A, 1B, 2A, 2B | Redirect flow + onboarding UX |

---

## Dependencies Graph

```
Phase 1 ───────► Phase 2
    1A ─┐         2A
    1B ─┴──────►  2B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Onboarding redirect target | `/owner/places/new` | Aligns onboarding with first place creation step |
| Redirect guard location | Server component | Avoids client cache loops and stale data |
| Rendering policy | `dynamic = "force-dynamic"` | Ensures per-request auth/org checks |

---

## Document Index

| Document | Description |
|----------|-------------|
| `19-00-overview.md` | This overview |
| `19-01-server-guard.md` | Server guard + tRPC caller |
| `19-02-client-cleanup.md` | Client wrapper + redirect cleanup |

---

## Success Criteria

- [ ] `/owner/onboarding` uses server-side org checks
- [ ] Users with org redirect to `/owner/places/new`
- [ ] Unauthenticated users redirect to `/login?redirect=/owner/onboarding`
- [ ] No client-side redirect loops between owner routes
- [ ] Lint/build pass
