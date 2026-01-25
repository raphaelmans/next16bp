# 2) Creating A Venue (Place)

## What the owner experiences

```text
/owner/venues
   |
   | “Add New Venue”
   v
/owner/venues/new
   |
   | fill venue form (name, address, city, timezone, contacts)
   | submit
   v
/owner/venues/:placeId/courts/new   (prompt to add first court)
```

## Routes (UI)

- Venues list: `src/app/(owner)/owner/places/page.tsx` (re-exported by `src/app/(owner)/owner/venues/page.tsx`)
- Venue create: `src/app/(owner)/owner/places/new/page.tsx` (re-exported by `src/app/(owner)/owner/venues/new/page.tsx`)
- Venue edit: `src/app/(owner)/owner/places/[placeId]/edit/page.tsx` (also has a `/owner/venues/...` re-export)

Notes:
- Canonical route prefix is `/owner/venues/*` (see `src/shared/lib/app-routes.ts`).
- Some pages live under `.../places/...` and are re-exported from `.../venues/...` for compatibility.

## APIs (tRPC)

- `placeManagement.create` / `placeManagement.update` / `placeManagement.getById` / `placeManagement.list`

Router/service:
- `src/modules/place/place-management.router.ts`
- `src/modules/place/services/place-management.service.ts`

## Data model (DB)

Core:
- `place` (this is what the UI calls a “venue”)
- `place_contact_detail` (upserted alongside create/update)
- `place_photo` (upload/reorder/remove)

Creation defaults (current behavior in `PlaceManagementService.createPlace`):
- `placeType = RESERVABLE`
- `claimStatus = CLAIMED`
- `isActive = true`
- `country = PH`
- `timeZone = Asia/Manila` if not provided

## Verification tie-in

Creating a venue does not make it “bookable” yet. Bookability depends on verification:
- verification status must be `VERIFIED`
- `reservationsEnabled` must be toggled on by the owner

See `docs/court-owner-onboarding/05-availability.md` for how this affects availability.
