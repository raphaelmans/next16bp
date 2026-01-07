# Developer 2 Checklist (Full-Stack)

**Focus Area:** Owner Journey + Admin + Claims  
**Backend:** 0B, 1B, 2B, 3B, 4A, 4B, 5A, 5B  
**Frontend:** UI-3 (Owner Dashboard), UI-4 (Admin Dashboard)

---

## Estimated Timeline: 8-10 days

| Day | Backend | Frontend |
|-----|---------|----------|
| 1 | 0B: Admin Role System | UI-3A: Owner Layout |
| 2 | 1B: Organization Module | UI-3B: Owner Dashboard |
| 3 | 2B: Time Slot Module | UI-3C: Courts List |
| 4 | 3B: Reservation Owner | UI-3D: Court Form |
| 5 | 4A: Claim Request | UI-3E: Slot Management |
| 6 | 4B: Claim Admin | UI-3F: Owner Reservations |
| 7 | 5A: Admin Court | UI-4A: Admin Layout + Dashboard |
| 8 | 5B: Audit Log | UI-4B: Claims Management |
| 9 | Integration | UI-4C: Courts Management |
| 10 | Testing | Polish & Testing |

---

## Day 1: Admin Roles + Owner Layout

### Backend 0B: Admin Role System
**Reference:** `00-server/01-server-infrastructure.md`

- [ ] Extend `user_roles` enum to include `ADMIN`
- [ ] Create `src/shared/infra/trpc/middleware/admin.middleware.ts`
  - [ ] Check session has ADMIN role
  - [ ] Throw `FORBIDDEN` if not admin
- [ ] Update `trpc.ts` with `adminProcedure`
- [ ] Create helper `isAdmin(session)` function
- [ ] Test admin middleware rejects non-admins

### Frontend UI-3A: Owner Layout
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/layout.tsx`
  - [ ] Auth protection
  - [ ] Organization check
- [ ] Create `src/features/owner/components/owner-sidebar.tsx`
  - [ ] Dashboard, Courts, Reservations, Settings links
  - [ ] Organization switcher (if multiple)
- [ ] Create `src/features/owner/components/owner-navbar.tsx`
- [ ] Create `src/shared/components/layout/dashboard-layout.tsx`
  - [ ] Sidebar + main content
  - [ ] Mobile drawer

---

## Day 2: Organization + Owner Dashboard

### Backend 1B: Organization Module
**Reference:** `00-server/02-server-foundation.md`

- [ ] Create `src/modules/organization/` structure
- [ ] Create DTOs: `create-org.dto.ts`, `update-org.dto.ts`
- [ ] Create `organization.errors.ts`
- [ ] Create `organization.repository.ts`
  - [ ] `create(data)` - with slug generation
  - [ ] `findByOwner(userId)`
  - [ ] `findBySlug(slug)`
  - [ ] `update(id, data)`
- [ ] Create `organization.service.ts`
  - [ ] Slug uniqueness validation
  - [ ] Auto-generate slug from name
- [ ] Create `organization.router.ts`
  - [ ] `create` - Create organization
  - [ ] `getMyOrganizations` - List user's orgs
  - [ ] `getBySlug` - Public profile
  - [ ] `update` - Update org profile
- [ ] Register in app router
- [ ] Test organization CRUD

### Frontend UI-3B: Owner Dashboard
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/owner/page.tsx`
- [ ] Create `src/features/owner/components/stats-card.tsx`
  - [ ] Active Courts, Pending Bookings, Today's Bookings, Revenue
- [ ] Create `src/features/owner/components/pending-actions.tsx`
- [ ] Create `src/features/owner/components/recent-activity.tsx`
- [ ] Create `src/features/owner/hooks/use-owner-dashboard.ts`
- [ ] Implement today's bookings timeline

---

## Day 3: Time Slots + Courts List

### Backend 2B: Time Slot Module
**Reference:** `00-server/03-server-court-management.md`

- [ ] Create `src/modules/time-slot/` structure
- [ ] Create DTOs: `create-slots.dto.ts`, `update-slot.dto.ts`
- [ ] Create `time-slot.errors.ts` (overlap errors)
- [ ] Create `time-slot.repository.ts`
  - [ ] `create(data)` - single slot
  - [ ] `createBulk(data[])` - multiple slots
  - [ ] `getByCourt(courtId, dateRange)`
  - [ ] `getAvailable(courtId, dateRange)`
  - [ ] `updateStatus(id, status)`
  - [ ] `checkOverlap(courtId, start, end)`
- [ ] Create `time-slot.service.ts`
  - [ ] Overlap prevention logic
  - [ ] Bulk slot generation (recurring)
- [ ] Create `time-slot.router.ts`
  - [ ] `create` - Create slot(s)
  - [ ] `createBulk` - Bulk creation
  - [ ] `getByCourt` - Owner view
  - [ ] `getAvailable` - Public view
  - [ ] `block` / `unblock`
  - [ ] `delete`
- [ ] Register in app router

### Frontend UI-3C: Owner Courts List
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/owner/courts/page.tsx`
- [ ] Create courts table with columns:
  - [ ] Image, Name, Location, Status, Open Slots, Actions
- [ ] Create action dropdown (Edit, Manage Slots, View Bookings, Deactivate)
- [ ] Create empty state with "Add Court" CTA
- [ ] Create `src/features/owner/hooks/use-owner-courts.ts`

---

## Day 4: Reservation Owner + Court Form

### Backend 3B: Reservation Owner Module
**Reference:** `00-server/04-server-reservations.md`

- [ ] Create `src/modules/reservation-owner/` structure
- [ ] Create DTOs: `get-pending.dto.ts`, `confirm.dto.ts`, `reject.dto.ts`
- [ ] Create `reservation-owner.repository.ts`
  - [ ] `getPendingForOwner(organizationId)`
  - [ ] `getByCourtForOwner(courtId, filters)`
- [ ] Create `reservation-owner.service.ts`
  - [ ] Verify owner has access to reservation
  - [ ] Handle confirm/reject logic
  - [ ] Update slot status on confirm
- [ ] Create `reservation-owner.router.ts`
  - [ ] `getPending` - Pending confirmations
  - [ ] `getByCourt` - Court's reservations
  - [ ] `confirm` - Confirm payment
  - [ ] `reject` - Reject with reason
- [ ] Register in app router

### Frontend UI-3D: Court Form (Create/Edit)
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/owner/courts/new/page.tsx`
- [ ] Create `src/app/(owner)/owner/courts/[id]/edit/page.tsx`
- [ ] Create `src/features/owner/components/court-form.tsx`
  - [ ] Tabbed form (Basic Info, Location, Photos, Amenities, Payment)
- [ ] Create `src/features/owner/schemas/court-form.schema.ts`
- [ ] Implement photo upload with drag-and-drop reordering
- [ ] Implement amenities checkbox grid
- [ ] Implement map location picker
- [ ] Implement payment settings (free/paid, GCash, bank)
- [ ] Create `src/features/owner/hooks/use-court-form.ts`

---

## Day 5: Claim Request + Slot Management

### Backend 4A: Claim Request Module
**Reference:** `00-server/05-server-claims.md`

- [ ] Create `src/modules/claim-request/` structure
- [ ] Create DTOs: `submit-claim.dto.ts`, `get-claims.dto.ts`
- [ ] Create `claim-request.errors.ts`
- [ ] Create `claim-request.repository.ts`
  - [ ] `create(data)` - Submit claim
  - [ ] `getByOrganization(orgId)`
  - [ ] `getByCourt(courtId)`
  - [ ] `updateStatus(id, status, notes)`
- [ ] Create `claim-request.service.ts`
  - [ ] Validate court is claimable (UNCLAIMED)
  - [ ] Update court claim_status
  - [ ] Create claim request event
- [ ] Create `claim-request.router.ts`
  - [ ] `submit` - Submit claim request
  - [ ] `getMyClaims` - Owner's claims
  - [ ] `requestRemoval` - Request listing removal (PRD 6.3)
- [ ] Register in app router

### Frontend UI-3E: Slot Management
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/owner/courts/[id]/slots/page.tsx`
- [ ] Create `src/features/owner/components/calendar-navigation.tsx`
- [ ] Create `src/features/owner/components/slot-list.tsx`
- [ ] Create `src/features/owner/components/slot-item.tsx`
  - [ ] Status display (Available, Booked, Blocked, Pending)
  - [ ] Actions (Block, Unblock, Delete, View Booking)
- [ ] Create `src/features/owner/components/bulk-slot-modal.tsx`
  - [ ] Date range picker
  - [ ] Days of week selection
  - [ ] Start/end time
  - [ ] Duration
  - [ ] Pricing options
  - [ ] Preview of slots to create
- [ ] Create `src/features/owner/hooks/use-slots.ts`

---

## Day 6: Claim Admin + Owner Reservations

### Backend 4B: Claim Admin Module
**Reference:** `00-server/05-server-claims.md`

- [ ] Create `src/modules/claim-admin/` structure
- [ ] Create DTOs: `list-claims.dto.ts`, `review-claim.dto.ts`
- [ ] Create `claim-admin.repository.ts`
  - [ ] `getPending(pagination)`
  - [ ] `getAll(filters, pagination)`
  - [ ] `getById(id)` - with court and org details
- [ ] Create `claim-admin.service.ts`
  - [ ] Approve claim flow:
    - [ ] Update claim status → APPROVED
    - [ ] Update court claim_status → CLAIMED
    - [ ] Update court type → RESERVABLE
    - [ ] Assign court to organization
    - [ ] Create claim event
  - [ ] Reject claim flow:
    - [ ] Update claim status → REJECTED
    - [ ] Update court claim_status → UNCLAIMED
    - [ ] Create claim event
  - [ ] Process removal request (PRD 6.3):
    - [ ] Deactivate court or return to curated
    - [ ] Cancel pending reservations
- [ ] Create `claim-admin.router.ts` (adminProcedure)
  - [ ] `getPending` - Pending claims
  - [ ] `getAll` - All claims with filters
  - [ ] `getById` - Single claim details
  - [ ] `approve` - Approve claim
  - [ ] `reject` - Reject with reason
  - [ ] `processRemoval` - Handle removal request (PRD 6.3)
- [ ] Register in app router

### Frontend UI-3F: Owner Reservations
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/owner/reservations/page.tsx`
- [ ] Create filters (Court, Status, Date Range, Search)
- [ ] Create tabs (Pending Action, Upcoming, Past, Cancelled)
- [ ] Create reservations table with columns:
  - [ ] Court, Player, Date/Time, Amount, Status, Actions
- [ ] Create expandable row with:
  - [ ] Player details (name, email, phone)
  - [ ] Payment proof (reference, receipt image)
  - [ ] Notes
- [ ] Create confirm/reject action buttons
- [ ] Create `src/features/owner/components/reject-modal.tsx` (requires reason)
- [ ] Create `src/features/owner/hooks/use-owner-reservations.ts`

---

## Day 7: Admin Court + Admin Layout

### Backend 5A: Admin Court Module
**Reference:** `00-server/06-server-admin.md`

- [ ] Create `src/modules/admin-court/` structure
- [ ] Create DTOs: `create-curated.dto.ts`, `admin-update.dto.ts`
- [ ] Create `admin-court.repository.ts`
  - [ ] `getAll(filters, pagination)` - All courts
  - [ ] `createCurated(data)` - Create curated court
  - [ ] `update(id, data)` - Admin update
  - [ ] `activate(id)` / `deactivate(id)`
- [ ] Create `admin-court.service.ts`
- [ ] Create `admin-court.router.ts` (adminProcedure)
  - [ ] `list` - List all courts with filters
  - [ ] `createCurated` - Create curated court
  - [ ] `update` - Admin update court
  - [ ] `activate` / `deactivate`
- [ ] Register in app router

### Frontend UI-4A: Admin Layout + Dashboard
**Reference:** `00-ui/05-ui-admin.md`

- [ ] Create `src/app/(admin)/layout.tsx`
  - [ ] Admin role check
  - [ ] Redirect non-admins
- [ ] Create `src/features/admin/components/admin-sidebar.tsx`
  - [ ] Dashboard, Claims, Courts links
  - [ ] Badge for pending claims count
- [ ] Create `src/app/(admin)/admin/page.tsx`
- [ ] Create stats cards (Pending Claims, Total Courts, Reservable, Active Orgs)
- [ ] Create pending claims preview list
- [ ] Create recent activity feed
- [ ] Create `src/features/admin/hooks/use-admin-dashboard.ts`

---

## Day 8: Audit Log + Claims Management

### Backend 5B: Audit Log Module
**Reference:** `00-server/06-server-admin.md`

- [ ] Create `src/modules/audit-log/` structure
- [ ] Create `audit-log.repository.ts`
  - [ ] `getByReservation(reservationId)`
  - [ ] `getByClaimRequest(claimRequestId)`
- [ ] Create `audit-log.service.ts`
  - [ ] Helper to log reservation events
  - [ ] Helper to log claim events
- [ ] Create `audit-log.router.ts` (adminProcedure)
  - [ ] `getByReservation`
  - [ ] `getByClaimRequest`
- [ ] Integrate with reservation and claim services

### Frontend UI-4B: Claims Management
**Reference:** `00-ui/05-ui-admin.md`

- [ ] Create `src/app/(admin)/admin/claims/page.tsx`
- [ ] Create filters (Type, Status, Search)
- [ ] Create tabs (Pending, Approved, Rejected)
- [ ] Create claims table with columns:
  - [ ] Type (CLAIM/REMOVAL), Court, Organization, Submitted, Actions
- [ ] Create `src/app/(admin)/admin/claims/[id]/page.tsx`
- [ ] Create claim detail view:
  - [ ] Court information card
  - [ ] Organization information card
  - [ ] Request notes display
  - [ ] Timeline of claim events
- [ ] Create `src/features/admin/components/claim-review-actions.tsx`
  - [ ] Radio: Approve / Reject
  - [ ] Textarea for notes/reason
  - [ ] Confirmation dialog
- [ ] Handle removal requests (PRD 6.3)
- [ ] Create `src/features/admin/hooks/use-claims.ts`

---

## Day 9: Integration + Courts Management

### Integration Testing

- [ ] Test full owner journey: Create Org → Create Court → Add Slots → Receive Booking → Confirm
- [ ] Test claim flow: Find Curated → Submit Claim → Admin Approve → Court becomes Reservable
- [ ] Test removal flow (PRD 6.3): Owner requests removal → Admin processes

### Frontend UI-4C: Admin Courts Management
**Reference:** `00-ui/05-ui-admin.md`

- [ ] Create `src/app/(admin)/admin/courts/page.tsx`
- [ ] Create filters (Type, Status, City, Claim Status)
- [ ] Create courts table with columns:
  - [ ] Image, Name, Type, Owner, Status, Actions
- [ ] Create action dropdown (View, Edit, Activate/Deactivate, View History)
- [ ] Create `src/app/(admin)/admin/courts/new/page.tsx`
- [ ] Create curated court form:
  - [ ] Basic info (name, address, city)
  - [ ] Location map picker
  - [ ] Contact info (Facebook, Instagram, Viber, Website)
  - [ ] Photos
  - [ ] Amenities
- [ ] Create `src/app/(admin)/admin/courts/[id]/page.tsx` (edit)
- [ ] Create `src/features/admin/schemas/curated-court.schema.ts`
- [ ] Create `src/features/admin/hooks/use-admin-courts.ts`

---

## Day 10: Owner Settings + Polish + Testing

### Frontend UI-3G: Organization Settings
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/owner/settings/page.tsx`
- [ ] Create organization profile form:
  - [ ] Logo upload
  - [ ] Name, Slug
  - [ ] Description
  - [ ] Contact info (email, phone, address)
- [ ] Create `src/features/owner/schemas/organization.schema.ts`
- [ ] Create slug validation (uniqueness check)
- [ ] Add Danger Zone section (PRD 6.3):
  - [ ] "Request Listing Removal" button
  - [ ] Removal request modal with:
    - [ ] Reason textarea
    - [ ] Understanding checkboxes
    - [ ] Submit action
- [ ] Create `src/features/owner/components/removal-request-modal.tsx`
- [ ] Create `src/features/owner/hooks/use-organization.ts`

### Frontend UI-3H: Claim Court Page
**Reference:** `00-ui/04-ui-owner.md`

- [ ] Create `src/app/(owner)/owner/claim/[courtId]/page.tsx`
- [ ] Show court preview (image, name, address)
- [ ] List benefits of claiming
- [ ] Organization selector dropdown
- [ ] Notes textarea
- [ ] Confirmation checkbox
- [ ] Submit claim button
- [ ] Create `src/features/owner/hooks/use-claim-court.ts`

### Testing & Polish

- [ ] Test full owner journey end-to-end
- [ ] Test full admin journey end-to-end
- [ ] Test claim approval transitions court type
- [ ] Test removal request flow (PRD 6.3)
- [ ] Verify mobile responsiveness for dashboards
- [ ] Test keyboard accessibility
- [ ] Verify loading/error states

---

## Coordination with Dev 1

### Dependencies on Dev 1:
- [ ] Rate limiting middleware (0A) → needed for admin procedures
- [ ] Profile module (1A) → reservation player snapshots
- [ ] Reservation core (3A) → owner confirmation features
- [ ] Court discovery (1C) → organization profile pages

### What Dev 2 Provides to Dev 1:
- [ ] Organization module → for court ownership
- [ ] Time slot module → for booking flow
- [ ] Admin procedures → for any admin features

---

## Files Created

### Backend
```
src/shared/infra/trpc/middleware/admin.middleware.ts
src/modules/organization/
src/modules/time-slot/
src/modules/reservation-owner/
src/modules/claim-request/
src/modules/claim-admin/
src/modules/admin-court/
src/modules/audit-log/
```

### Frontend
```
src/features/owner/
src/features/admin/
src/app/(owner)/
src/app/(admin)/
```

---

## PRD Requirements Covered

- [ ] PRD 6.3: Removal Request Flow (Owner Settings + Admin Claims)
- [ ] PRD 8.5: Player Snapshot (via Reservation Core from Dev 1)
- [ ] PRD 12: Organization Management (Organization Module)
- [ ] PRD 15: Audit & Compliance (Audit Log Module)
- [ ] PRD 17: Legal Requirements (via Reservation from Dev 1)
