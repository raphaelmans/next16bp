# Phase 1: Unified Setup Route

**Dependencies:** None  
**Parallelizable:** Yes  
**User Stories:** US-14-07 (Court setup wizard)

---

## Objective

Provide a single owner court setup route that supports create and edit flows using URL query state, and redirect legacy setup URLs to the new route.

---

## Modules

### Module 1A: Unified setup page

**User Story:** `US-14-07`  
**Reference:** `21-01-unified-setup-route.md`

#### Directory Structure

```
src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx
```

#### URL State

| Key | Type | Required | Validation |
|-----|------|----------|------------|
| `courtId` | string | No | UUID format |
| `step` | string | No | `details`, `hours`, `pricing`, `publish` |

#### UI Layout

```
┌─────────────────────────────────────────────┐
│ Court Setup · {place/court}                 │
│ Setup wizard stepper                        │
│                                             │
│ [Details Form]                              │
│                                             │
│ If courtId exists:                           │
│   ├─ Hours editor                           │
│   ├─ Pricing editor                         │
│   └─ Publish actions                         │
└─────────────────────────────────────────────┘
```

#### Flow Diagram

```
/courts/setup
    │
    ├─ Create court → set courtId + step=hours
    │
    └─ Setup Wizard link → /courts/setup?courtId=...&step=details
```

#### Implementation Steps

1. Swap route to use `useQueryState` for `courtId` + `step`.
2. Render create form when `courtId` is missing.
3. Render wizard flow when `courtId` exists.

---

### Module 1B: Route helpers + links

**User Story:** `US-14-07`  
**Reference:** `21-01-unified-setup-route.md`

#### Files

- `src/shared/lib/app-routes.ts`
- `src/features/owner/components/courts-table.tsx`
- `src/app/(owner)/owner/courts/setup/page.tsx`

#### Implementation Steps

1. Update `appRoutes.owner.places.courts.setup` to use query params.
2. Replace callsites to pass `step` where needed.

---

### Module 1C: Legacy redirect

**User Story:** `US-14-07`  
**Reference:** `21-01-unified-setup-route.md`

#### File

- `src/app/(owner)/owner/places/[placeId]/courts/[courtId]/setup/page.tsx`

#### Implementation Steps

1. Replace client page with server `redirect()` to new route.

---

## Testing Checklist

- [ ] `pnpm lint`
- [ ] `TZ=UTC pnpm build`

---

## Phase Completion Checklist

- [ ] Unified setup route working for create + edit
- [ ] Legacy redirects verified
- [ ] Links updated and no TS errors
