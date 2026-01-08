# [00-02] UI Backend Integration

> Date: 2025-01-07
> Previous: 00-01-kudoscourts-server.md
> Next: 00-03-ui-dev2-checklist-complete.md

## Summary

Connected frontend hooks to real tRPC backend endpoints across discovery, reservation, and admin features. Fixed type mismatches, updated API call parameters, and marked UI Dev 1 & 2 checklists as complete. Build passes with no TypeScript errors.

**See also:**
- [00-06-feature-implementation-status.md](./00-06-feature-implementation-status.md) - Detailed user story coverage for reservations and court features

## Changes Made

### Implementation - Discovery Hooks

| File | Change |
|------|--------|
| `src/features/discovery/hooks/use-discovery.ts` | Connected to `court.search` tRPC endpoint, added `useDiscoveryCourts()` with data transformation |
| `src/features/discovery/hooks/use-court-detail.ts` | Connected to `court.getById` and `timeSlot.getAvailable` endpoints |
| `src/features/discovery/hooks/index.ts` | Exported new `useDiscoveryCourts` hook |

### Implementation - Reservation Hooks

| File | Change |
|------|--------|
| `src/features/reservation/hooks/use-my-reservations.ts` | Connected to `reservation.getMy` with status filtering |
| `src/features/reservation/hooks/use-create-reservation.ts` | Connected to `reservation.create` mutation |
| `src/features/reservation/hooks/use-mark-payment.ts` | Connected to `reservation.markPayment` mutation |

### Implementation - Admin Hooks

| File | Change |
|------|--------|
| `src/features/admin/hooks/use-admin-dashboard.ts` | Connected to `admin.claim.getPending` and `admin.court.list` for stats |
| `src/features/admin/hooks/use-claims.ts` | Connected to claim CRUD: `getPending`, `getById`, `approve`, `reject` |

### Bug Fixes - Pages

| File | Change |
|------|--------|
| `src/app/(public)/courts/page.tsx` | Use `useDiscoveryCourts` instead of `useDiscovery` |
| `src/app/(public)/courts/[id]/page.tsx` | Added null check for `court.organization` |
| `src/app/(auth)/courts/[id]/book/[slotId]/page.tsx` | Changed `courtId, slotId` to `timeSlotId`, fixed result properties |
| `src/app/(auth)/reservations/[id]/payment/page.tsx` | Changed params to `reservationId, termsAccepted: true` |
| `src/app/(admin)/admin/claims/[id]/page.tsx` | Changed `claimId` to `requestId`, `notes/reason` to `reviewNotes` |

### Documentation Updates

| File | Change |
|------|--------|
| `agent-plans/ui-dev1-checklist.md` | Already marked complete in previous session |
| `agent-plans/ui-dev2-checklist.md` | Marked all items as complete |

## Key Decisions

- **Hook Transformation Layer**: Added data transformation in hooks to map backend response shapes to UI-expected formats (e.g., `CourtListItem` → `CourtCardCourt`)
- **Status Mapping**: Created mapping functions for backend statuses (uppercase) to frontend statuses (lowercase) - e.g., `AVAILABLE` → `available`
- **Placeholder Data**: Some hooks still use placeholder data where backend doesn't return enriched data (e.g., court/org names in claim list) - backend enhancement needed
- **Owner Hooks**: Left using mock data as there's no aggregate dashboard endpoint - would need backend changes

## Technical Notes

### Backend API Patterns

```typescript
// Discovery: uses offset/limit pagination
trpc.court.search.queryOptions({ limit, offset, city?, courtType?, isFree? })

// Reservations: returns array, client wraps in pagination structure
trpc.reservation.getMy.queryOptions({ status?, limit, offset })

// Admin claims: uses requestId, not claimId
trpc.admin.claim.approve.mutationOptions() // expects { requestId, reviewNotes? }
```

### Data Transformation Example

```typescript
// Transform backend court to UI format
function transformCourtListItem(item): CourtCardCourt {
  return {
    id: item.court.id,
    name: item.court.name,
    address: item.court.address,
    city: item.court.city,
    type: item.court.courtType,
    coverImageUrl: item.photoUrl,
    isFree: item.isFree ?? item.court.courtType === "CURATED",
  };
}
```

## Next Steps

- [ ] Google Maps Integration - Install `@react-google-maps/api`, add API key, implement real map
- [ ] Backend Enhancement - Add enriched list endpoints (claims with court/org names, reservations with slot details)
- [ ] Owner Dashboard - Create aggregate endpoint or composite frontend queries
- [ ] Manual Testing - Test all user flows end-to-end
- [ ] Responsiveness Testing - Verify mobile/tablet layouts

## Commands to Continue

```bash
# Run development server
npm run dev

# Build to verify no errors
npm run build

# Check for type errors
npx tsc --noEmit

# Install Google Maps (when ready)
npm install @react-google-maps/api
```

## Files Structure Reference

```
src/features/
├── discovery/
│   └── hooks/
│       ├── use-discovery.ts       # court.search
│       ├── use-court-detail.ts    # court.getById, timeSlot.getAvailable
│       └── use-discovery-filters.ts # nuqs URL state
├── reservation/
│   └── hooks/
│       ├── use-my-reservations.ts # reservation.getMy
│       ├── use-create-reservation.ts # reservation.create
│       └── use-mark-payment.ts    # reservation.markPayment
├── owner/
│   └── hooks/
│       └── use-owner-dashboard.ts # (mock data - needs backend)
└── admin/
    └── hooks/
        ├── use-admin-dashboard.ts # admin.claim.getPending, admin.court.list
        └── use-claims.ts          # admin.claim.* endpoints
```
