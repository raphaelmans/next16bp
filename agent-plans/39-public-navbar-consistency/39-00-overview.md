# Public Navbar Consistency - Master Plan

## Overview

Unify public navbar behavior across all public routes. Ensure the brand logo always returns to the landing page and search works from any public route, including detail pages. Introduce a shared URL query builder helper for consistent query string construction in public navigation.

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| User Stories | `agent-plans/user-stories/11-ui-revamp/11-01-unified-navigation-shells.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Public navbar routing + search reliability | 1A, 1B | Partial |

---

## Module Index

### Phase 1: Public navbar routing + search reliability

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | URL query builder foundation | Agent | `39-01-public-navbar-consistency.md` |
| 1B | Navbar search routing updates | Agent | `39-01-public-navbar-consistency.md` |

---

## Dependencies Graph

```
Phase 1 ───── 1A ───── 1B
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Query string helper | `URLQueryBuilder` in shared lib | Reduce ad-hoc `URLSearchParams` usage in public navigation |
| Logo target on public routes | Always `/` | Matches expectation for public browsing and landing access |
| Search reliability | GET form + SPA routing | Works with or without client hydration |

---

## Document Index

| Document | Description |
|----------|-------------|
| `39-00-overview.md` | Master plan |
| `39-01-public-navbar-consistency.md` | Phase 1 details |
| `public-navbar-consistency-dev1-checklist.md` | Developer checklist |

---

## Success Criteria

- [ ] Navbar logo routes to landing page on all public pages.
- [ ] Public search works on `/courts/[id]`, `/terms`, `/privacy`, and `/`.
- [ ] Query string construction uses `URLQueryBuilder` for public search routing.
- [ ] Lint/build pass.
