# Phase 1-2: Public Courts Pagination

**Dependencies:** None (uses existing hooks + shadcn components)

---

## Objective

Improve discovery UX on `src/app/(public)/courts/page.tsx` by replacing the "Load more" affordance with proper pagination controls.

---

## Modules

### Module 1A: Replace "Load more" with pagination controls

**User Story:** `US-14-01` (Discovery experience)

#### UI Layout (List View)

```text
┌──────────────────────────────────────────────────────────────┐
│ [Filters...]                                  [View toggle]  │
├──────────────────────────────────────────────────────────────┤
│ [PlaceCard] [PlaceCard] [PlaceCard] [PlaceCard]              │
│ [PlaceCard] [PlaceCard] [PlaceCard] [PlaceCard]              │
├──────────────────────────────────────────────────────────────┤
│ [Ad banner]                                                  │
├──────────────────────────────────────────────────────────────┤
│ Showing 13-24 of 178                                         │
│  [Prev]  1  ...  4  5  6  ...  15  [Next]                    │
└──────────────────────────────────────────────────────────────┘
```

#### Implementation Steps

1. Update `src/app/(public)/courts/page.tsx`.
2. Remove the current "Load more" block.
3. Import shadcn pagination components from `src/components/ui/pagination.tsx`.
4. Compute pagination state from existing query result:
   - `totalPages = Math.ceil(total / limit)`
   - `startIndex = (page - 1) * limit + 1`
   - `endIndex = Math.min(page * limit, total)`
5. Render pagination only when:
   - `filters.view === "list"`
   - `!isLoading`
   - `totalPages > 1`
6. Wire up interactions using `filters.setPage(...)`.

#### UX Notes (KudosCourts DS)

- Keep controls neutral (ghost/outline), avoid heavy brand-color blocks.
- Disabled states should clearly communicate non-interactivity (`pointer-events-none opacity-50`).
- Maintain generous spacing (bento grid rhythm): keep pagination separated from the ad banner with `mt-6`/`pt-6` scale.

---

### Module 2A: Condensed page numbers + ellipsis rules

#### Goal

Avoid rendering large numbers of page buttons while still providing quick navigation.

#### Rules

- Always show first and last page.
- Show current page.
- Show one neighbor on each side (`current - 1`, `current + 1`) when in range.
- Insert ellipsis when there is a gap > 1 between two visible page numbers.

#### Suggested Helper (local to page)

```ts
type PaginationItemModel =
  | { type: "page"; page: number }
  | { type: "ellipsis"; key: string };

function buildPaginationItems(current: number, totalPages: number): PaginationItemModel[] {
  // Implementation detail: build a sorted set of visible pages
  // then emit ellipsis markers when gaps exist.
}
```

---

## Testing Checklist

- [ ] With `total <= limit`, pagination is hidden
- [ ] With many pages, ellipsis displays correctly
- [ ] Previous disabled on page 1
- [ ] Next disabled on last page
- [ ] Changing filters resets `page` to 1 (existing behavior)
- [ ] Keyboard: pagination buttons are reachable and activate (Enter/Space)
