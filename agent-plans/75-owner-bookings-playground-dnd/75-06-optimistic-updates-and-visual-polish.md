# Phase 6: Optimistic Updates + Visual Polish

Objective: make the Availability Studio feel instant and calmer by (1) optimistic UI updates for drag/create/move/resizes and (2) reducing contrast on timeline blocks while preserving clarity.

## References

- Design system rules: `business-contexts/kudoscourts-design-system.md`
- Availability Studio: `src/app/(owner)/owner/bookings/page.tsx`
- tRPC utils cache helpers: `trpc.useUtils()` (supports `cancel`, `getData`, `setData`, `invalidate`)
- TanStack Query optimistic pattern (Context7): cancel -> snapshot -> setData -> rollback -> invalidate

## Workstreams

### Shared / Contract

- [ ] Define optimistic semantics for each action:
  - create: show block immediately; toast stays success-only; error rolls back
  - move/resize: update position immediately; error rolls back to previous
  - cancel: remove immediately; error restores
- [ ] Define stability rules:
  - use a stable query input object for cache writes (same `{ courtId, startTime, endTime }` used by query)
  - optimistic ids: `optimistic:<ts>` (client only)

### Server / Backend

- [ ] N/A (endpoints already exist)
- [ ] Verify `courtBlock.updateRange` returns updated pricing for walk-ins (needed to reconcile optimistic UI)

### Client / Frontend

#### 1) Optimistic updates (no “snap-back”)

Implement optimistic cache updates in `src/app/(owner)/owner/bookings/page.tsx` using `trpc.useUtils()`.

Targets:

- `courtBlock.listForCourtRange` query cache
  - create: `courtBlock.createMaintenance`, `courtBlock.createWalkIn`
  - update: `courtBlock.updateRange`
  - cancel: `courtBlock.cancel`
- import overlay cache
  - `bookingsImport.listRows`
  - `bookingsImport.getJob`
  - mutation: `bookingsImport.updateRow`

Required mutation lifecycle (per TanStack Query):

- `onMutate`: cancel + snapshot + optimistic setData
- `onError`: rollback snapshot
- `onSuccess`: reconcile optimistic item with server response
- `onSettled`: invalidate

Edge cases to handle:

- Creating blocks: insert optimistic block then replace it with server block (walk-in pricing).
- Undo: keep toast “Undo” wired to server id; keep toast only after server success (avoid canceling unknown id).
- Dragging while mutation pending:
  - allow interaction; but prevent overlapping updates to the same block by disabling drag handles for that block while it’s saving.

#### 2) Subtle styling + hierarchy

Reduce contrast in timeline blocks without losing meaning:

- Real blocks:
  - use neutral `bg-card text-foreground border-border`
  - add a thin left accent stripe (teal for walk-in, orange/amber for maintenance)
  - keep meaning in a small `Badge` (paid/warning) instead of coloring the whole block
- Draft blocks:
  - dashed border + very light tint; keep status badge for ERROR/WARNING
- Drop target:
  - prefer subtle ring/border highlight over full-row fill
- Resize handles:
  - hidden by default; show on hover/focus (`group-hover:opacity-100`)

## QA

- [ ] Create preset: block appears immediately; on server error, block disappears and error toast shows.
- [ ] Move block: position updates instantly; on conflict, block reverts.
- [ ] Resize block: size updates instantly; invalid ranges revert.
- [ ] Cancel: block disappears instantly; on failure, returns.
- [ ] Draft row drag: row time updates instantly; server response refreshes status/errors.
- [ ] Visual checks: blocks readable at a glance; no “color shouting”; drop affordances visible but subtle.
