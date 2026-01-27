# 3) Creating Courts For A Venue

## What the owner experiences

There are two primary entry points.

Note: the owner setup hub (`/owner/get-started`) is adding a dedicated “Configure venue courts” step that should route into the venue-scoped setup wizard (`/owner/venues/:placeId/courts/setup`).

### A) Venue-first (recommended in current owner UI)

```text
/owner/venues
   |
   | “Manage Courts” on a venue card
   v
/owner/venues/:placeId/courts
   |
   | “Add Court”
   v
/owner/venues/:placeId/courts/setup
   |
   | Step 1: Details (create or edit)
   | Step 2: Schedule (hours + pricing)
   | Step 3: Publish (currently: jump to Availability)
   v
/owner/venues/:placeId/courts/:courtId/availability
```

### B) Courts-first (from “Courts” global list)

```text
/owner/courts
   |
   | “Add New Court”
   v
/owner/courts/setup
   |
   | create court (must pick venue)
   v
/owner/venues/:placeId/courts/setup?courtId=:courtId&step=schedule
```

## Routes (UI)

- Venue courts list: `src/app/(owner)/owner/places/[placeId]/courts/page.tsx`
- Court setup wizard (venue-scoped): `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx`
- Global courts list: `src/app/(owner)/owner/courts/page.tsx`
- Global create court: `src/app/(owner)/owner/courts/setup/page.tsx`

Legacy (still present):
- `src/app/(owner)/owner/places/[placeId]/courts/new/page.tsx` (creates court then redirects to verification)

## Wizard state model (URL params)

Court setup wizard uses query params (nuqs):
- `courtId` (required after creation)
- `step` one of: `details | schedule | publish` (with internal aliases `hours`/`pricing` normalized back to `schedule`)

Implementation: `src/app/(owner)/owner/places/[placeId]/courts/setup/page.tsx`

## APIs (tRPC)

- `courtManagement.create` / `courtManagement.update` / `courtManagement.getById` / `courtManagement.listByPlace`
- `sport.list` (for sport selection)

Routers:
- `src/modules/court/court-management.router.ts`
- `src/modules/sport/sport.router.ts`

## Data model (DB)

- `court` (belongs to `place` via `placeId`; includes `label`, `tierLabel`, `sportId`, `isActive`)

Operational note:
- Courts can be deactivated from the owner UI (`useDeactivateCourt`), which removes them from availability.
