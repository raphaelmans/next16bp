# Public Courts Pagination - Master Plan

## Overview

Replace the misleading "Load more" affordance on the public courts discovery page with a proper, URL-driven pagination UI using the existing shadcn Pagination components.

This is a UI/UX polish change that keeps the existing data contract (offset/limit) and uses the current `nuqs` URL state (`page`, `limit`).

### Reference Documents

| Document | Location |
|----------|----------|
| Context | `agent-plans/context.md` |
| Design System | `business-contexts/kudoscourts-design-system.md` |
| User Story (Discovery) | `agent-plans/user-stories/14-place-court-migration/14-01-player-discovers-places-with-sport-filters.md` |
| Existing Discovery Page | `src/app/(public)/courts/page.tsx` |
| shadcn Pagination | `src/components/ui/pagination.tsx` |

---

## Development Phases

| Phase | Description | Modules | Parallelizable |
|-------|-------------|---------|----------------|
| 1 | Replace "Load more" with pagination controls + range label | 1A | Yes |
| 2 | Condensed page number window + ellipsis; finalize edge cases | 2A | Yes |

---

## Module Index

### Phase 1

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 1A | Public courts pagination UI | Dev 1 | `57-01-public-courts-pagination.md` |

### Phase 2

| ID | Module | Agent | Plan File |
|----|--------|-------|-----------|
| 2A | Pagination window + ellipsis rules | Dev 1 | `57-01-public-courts-pagination.md` |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Pagination model | Offset/limit + numbered pagination | Backend already supports `offset` + `limit`; `nuqs` already stores `page` + `limit` |
| List vs map | Only render pagination in list view | Request is for place cards; avoids adding clutter under the map |
| Link semantics | Keep current in-repo pattern (`onClick` on PaginationLink) | Matches existing admin pages; minimal change; can improve later |

---

## Success Criteria

- [ ] Public `/courts` list view shows numbered pagination when `totalPages > 1`
- [ ] Previous/Next are disabled correctly at boundaries
- [ ] Changing filters resets page to 1 (already true; do not regress)
- [ ] No more "Load more" label (avoid implying infinite scroll)
- [ ] `pnpm lint` and `pnpm build` pass
