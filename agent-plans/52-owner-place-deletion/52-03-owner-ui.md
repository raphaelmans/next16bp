# Phase 3: Owner UI Delete Flow

**Dependencies:** Phase 2 complete  
**Parallelizable:** No  
**User Stories:** US-02-09

---

## Objective

Expose a destructive delete flow on the owner place edit page with explicit confirmation and cache invalidation.

---

## Modules

### Module 3A: Edit Place Delete Flow

**User Story:** `US-02-09`  
**Reference:** `52-00-overview.md`

#### Directory Structure

```
src/app/(owner)/owner/places/[placeId]/edit/page.tsx
src/components/ui/alert-dialog.tsx
src/components/ui/input.tsx
```

#### Form Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Confirmation Text | text | Yes | Must match place name |

#### UI Layout

```
┌──────────────────────────────────────────────┐
│  Danger Zone                                 │
│  Delete this place and detach courts.        │
│                                              │
│  [Delete Place]                               │
└──────────────────────────────────────────────┘

Alert Dialog:
┌──────────────────────────────────────────────┐
│  Delete Place                                │
│  Type "{place name}" to confirm.             │
│  [Confirmation Input]                        │
│  [Cancel]                     [Delete Place] │
└──────────────────────────────────────────────┘
```

#### Implementation Steps

1. Add a Danger Zone card below existing sections on the edit page.
2. Implement an `AlertDialog` with place-name confirmation input.
3. Wire `trpc.placeManagement.delete.useMutation` with cache invalidation and redirect.
4. Show success toast on completion and error toast on failure.

#### Testing Checklist

- [ ] Delete button disabled until confirmation matches
- [ ] Redirects to `/owner/places` on success
- [ ] `pnpm lint`
- [ ] `pnpm build`

---

## Phase Completion Checklist

- [ ] Danger Zone section added
- [ ] Dialog confirmation implemented
- [ ] Mutation + cache invalidation wired
