# Phase 1: Server Guard

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-00-05, US-01-01

---

## Objective

Move onboarding eligibility checks to server-side execution to prevent client cache redirect loops and ensure consistent auth flow.

---

## Modules

### Module 1A: Server tRPC Caller Helper

**User Story:** `US-00-05`  
**Reference:** `19-01-server-guard.md`

#### Directory Structure

```
src/shared/infra/trpc/
├── server.ts
```

#### API Endpoints

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `appRouter.createCaller` | Query/Mutation | `Context` | `Caller` |

#### Implementation Steps

1. Create `server.ts` to export `createServerCaller()`
2. Build a synthetic `Request` for `createContext({ req })`
3. Return `appRouter.createCaller(ctx)`

#### Testing Checklist

- [ ] Caller returns `organization.my()` results in server components

---

### Module 1B: Onboarding Server Redirect Logic

**User Story:** `US-01-01`  
**Reference:** `19-01-server-guard.md`

#### Flow Diagram

```
/owner/onboarding
  ├─ no session ──► /login?redirect=/owner/onboarding
  ├─ has org ─────► /owner/places/new
  └─ no org ──────► render onboarding UI
```

#### Implementation Steps

1. Convert onboarding page to server component
2. Add `export const dynamic = "force-dynamic"`
3. Add `checkOnboardingRedirect()` with try/catch
4. Redirect on org presence or missing session

#### Testing Checklist

- [ ] No org → onboarding renders
- [ ] Has org → redirects to `/owner/places/new`
- [ ] No session → redirects to `/login?redirect=/owner/onboarding`

---

## Phase Completion Checklist

- [ ] Server caller helper added
- [ ] Onboarding redirect logic is server-side
- [ ] No client-side auth/org checks on onboarding page
