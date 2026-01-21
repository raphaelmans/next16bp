# Auth Redirect Continuity + Landing Metadata - Master Plan

## Overview

Standardize authentication return paths across password, Google OAuth, signup confirmation, and magic link flows using a single `redirect` parameter. Add dedicated metadata for the public `/list-your-venue` landing page.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/00-onboarding/` |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Metadata + routing helpers | 1A, 1B | Yes |
| 2 | Auth redirect standardization | 2A, 2B | Yes |
| 3 | QA + regression checks | 3A | No |

---

## Module Index

### Phase 1: Metadata + Helpers

| ID | Module | Plan File |
|----|--------|----------|
| 1A | Add `/list-your-venue` metadata layout | `56-01-redirect-standardization.md` |
| 1B | Add safe redirect helper | `56-01-redirect-standardization.md` |

### Phase 2: Auth Redirect Standardization

| ID | Module | Plan File |
|----|--------|----------|
| 2A | Standardize `redirect` param across auth flows | `56-01-redirect-standardization.md` |
| 2B | Update email + OAuth callbacks to respect `redirect` | `56-01-redirect-standardization.md` |

### Phase 3: QA

| ID | Module | Plan File |
|----|--------|----------|
| 3A | QA checklist | `56-02-qa.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Redirect param | `redirect` | Matches proxy + guest route convention and removes split between `next`/`redirect` |
| Safety | Internal-only redirect | Prevents open redirect vulnerabilities |
| Metadata scope | Page-level layout | `/list-your-venue` is client-only, so metadata must be in server layout |

---

## Success Criteria

- [ ] `/list-your-venue` has correct page-level metadata and canonical URL
- [ ] Password login, Google OAuth, magic link, and signup confirmation return to intended page
- [ ] Redirect parameters are sanitized and internal-only
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
