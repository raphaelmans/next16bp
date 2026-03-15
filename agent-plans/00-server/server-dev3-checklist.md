# Developer 3 Checklist

**Focus Area:** Discovery + Utilities + Reservation Management UI  
**Backend Modules:** 1C → 3C → 5B  
**UI Modules:** UI-2C → UI-2D → UI-2E → UI-2F

---

## Module 1C: Court Discovery Module (Read-Only)
**Reference:** `02-phase1-foundation.md`  
**Estimated Time:** 2 days  
**Dependencies:** 0A complete (for rate limiting)

### Directory Setup
- [ ] Create `src/modules/court/` directory structure:
  ```
  court/
  ├── court.router.ts
  ├── dtos/
  │   ├── index.ts
  │   └── search-courts.dto.ts
  ├── errors/
  │   └── court.errors.ts
  ├── factories/
  │   └── court.factory.ts
  ├── repositories/
  │   └── court.repository.ts
  └── services/
      └── court-discovery.service.ts
  ```

### Implementation
- [ ] Create `court.errors.ts`
  - [ ] `CourtNotFoundError` extends NotFoundError
- [ ] Create DTOs
  - [ ] `SearchCourtsSchema`
    - [ ] `city` - optional string
    - [ ] `courtType` - optional enum (CURATED, RESERVABLE)
    - [ ] `isFree` - optional boolean (only for RESERVABLE)
    - [ ] `amenities` - optional array of strings
    - [ ] `limit` - default 20, max 100
    - [ ] `offset` - default 0
  - [ ] `GetCourtByIdSchema` - uuid validation
- [ ] Define response types
  ```typescript
  interface CourtWithDetails {
    court: CourtRecord;
    detail: CuratedCourtDetailRecord | ReservableCourtDetailRecord;
    photos: CourtPhotoRecord[];
    amenities: CourtAmenityRecord[];
    organization?: OrganizationRecord; // Only for reservable
  }
  
  interface CourtListItem {
    court: CourtRecord;
    photoUrl?: string; // First photo only
    amenityCount: number;
    isFree?: boolean; // Only for reservable
  }
  ```
- [ ] Create `court.repository.ts` (read methods only)
  - [ ] `ICourtRepository` interface
  - [ ] `findById(id)` - basic court record
  - [ ] `findWithDetails(id)` - court with joined detail, photos, amenities
  - [ ] `search(filters)` - search with filters, return list items + total
  - [ ] `listByCity(city, pagination)` - simple city filter
- [ ] Create `court-discovery.service.ts`
  - [ ] `ICourtDiscoveryService` interface
  - [ ] `getCourtById(id)` - returns CourtWithDetails
  - [ ] `searchCourts(filters)` - returns paginated CourtListItem[]
  - [ ] `listCourtsByCity(city, pagination)` - simplified search
- [ ] Create `court.factory.ts`
  - [ ] Lazy singleton factories
- [ ] Create `court.router.ts`
  - [ ] `court.getById` - public
  - [ ] `court.search` - public
  - [ ] `court.listByCity` - public
- [ ] Register router in `src/shared/infra/trpc/root.ts`

### Query Logic for Search
```typescript
async search(filters: SearchCourtsDTO) {
  let query = db.select().from(court).where(eq(court.isActive, true));
  
  if (filters.city) {
    query = query.where(eq(court.city, filters.city));
  }
  
  if (filters.courtType) {
    query = query.where(eq(court.courtType, filters.courtType));
  }
  
  if (filters.isFree !== undefined) {
    // Join with reservable_court_detail
    query = query
      .innerJoin(reservableCourtDetail, eq(court.id, reservableCourtDetail.courtId))
      .where(eq(reservableCourtDetail.isFree, filters.isFree));
  }
  
  // Amenities filter requires subquery or EXISTS
  if (filters.amenities?.length) {
    // Filter courts that have ALL specified amenities
    // Implementation depends on exact requirements
  }
  
  // Apply pagination
  query = query.limit(filters.limit).offset(filters.offset);
  
  return query;
}
```

### Query Logic for getWithDetails
```typescript
async findWithDetails(id: string): Promise<CourtWithDetails | null> {
  const courtRecord = await db.select().from(court).where(eq(court.id, id)).limit(1);
  if (!courtRecord[0]) return null;
  
  const c = courtRecord[0];
  
  // Get detail based on court type
  let detail;
  if (c.courtType === "CURATED") {
    detail = await db.select().from(curatedCourtDetail)
      .where(eq(curatedCourtDetail.courtId, id)).limit(1);
  } else {
    detail = await db.select().from(reservableCourtDetail)
      .where(eq(reservableCourtDetail.courtId, id)).limit(1);
  }
  
  // Get photos ordered by displayOrder
  const photos = await db.select().from(courtPhoto)
    .where(eq(courtPhoto.courtId, id))
    .orderBy(courtPhoto.displayOrder);
  
  // Get amenities
  const amenities = await db.select().from(courtAmenity)
    .where(eq(courtAmenity.courtId, id));
  
  // Get organization if reservable
  let organization;
  if (c.courtType === "RESERVABLE" && c.organizationId) {
    organization = await db.select().from(org)
      .where(eq(org.id, c.organizationId)).limit(1);
  }
  
  return {
    court: c,
    detail: detail[0],
    photos,
    amenities,
    organization: organization?.[0],
  };
}
```

### Testing
- [ ] Can get court by ID with all details
- [ ] Returns correct detail type (curated vs reservable)
- [ ] Photos returned in display order
- [ ] Amenities included in response
- [ ] Organization included for reservable courts
- [ ] Search by city works
- [ ] Search by court type works
- [ ] Search by isFree works (for reservable)
- [ ] Pagination works correctly
- [ ] Only returns active courts (isActive = true)
- [ ] Returns 404 for non-existent court
- [ ] No TypeScript errors

### Handoff
- [ ] Court Discovery ready for Court Management (2A) and Claim Request (4A)
- [ ] Notify Dev 1 and Dev 4
- [ ] Update `00-overview.md` to mark 1C complete

---

## Module 3C: Payment Proof Module
**Reference:** `04-phase3-reservations.md`  
**Estimated Time:** 1 day  
**Dependencies:** 3A (Reservation Core) complete

### Directory Setup
- [ ] Create `src/modules/payment-proof/` directory structure:
  ```
  payment-proof/
  ├── payment-proof.router.ts
  ├── dtos/
  │   ├── index.ts
  │   ├── add-payment-proof.dto.ts
  │   └── update-payment-proof.dto.ts
  ├── errors/
  │   └── payment-proof.errors.ts
  ├── factories/
  │   └── payment-proof.factory.ts
  ├── repositories/
  │   └── payment-proof.repository.ts
  └── services/
      └── payment-proof.service.ts
  ```

### Implementation
- [ ] Create `payment-proof.errors.ts`
  - [ ] `PaymentProofAlreadyExistsError` extends ConflictError
  - [ ] `PaymentProofNotFoundError` extends NotFoundError
- [ ] Create DTOs
  - [ ] `AddPaymentProofSchema`
    - [ ] `reservationId` - uuid
    - [ ] `fileUrl` - optional URL
    - [ ] `referenceNumber` - optional string, max 100
    - [ ] `notes` - optional string, max 500
    - [ ] Refinement: either fileUrl or referenceNumber required
  - [ ] `UpdatePaymentProofSchema`
    - [ ] `reservationId` - uuid
    - [ ] All fields optional for update
- [ ] Create `payment-proof.repository.ts`
  - [ ] `IPaymentProofRepository` interface
  - [ ] `findByReservationId(reservationId)` - returns proof or null
  - [ ] `create(data, ctx?)` - create new proof
  - [ ] `update(id, data, ctx?)` - update existing proof
- [ ] Create `payment-proof.service.ts`
  - [ ] `IPaymentProofService` interface
  - [ ] `addPaymentProof(userId, data)`
    - [ ] Verify reservation exists
    - [ ] Verify user owns the reservation (via profile)
    - [ ] Verify reservation status allows proof (AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER)
    - [ ] Check no existing proof
    - [ ] Create proof
  - [ ] `updatePaymentProof(userId, data)`
    - [ ] Verify ownership
    - [ ] Verify proof exists
    - [ ] Update proof
  - [ ] `getPaymentProof(userId, reservationId)`
    - [ ] Verify user has access (player or court owner)
    - [ ] Return proof
- [ ] Create `payment-proof.factory.ts`
  - [ ] Lazy singleton factories
- [ ] Create `payment-proof.router.ts`
  - [ ] `paymentProof.add` - protected
  - [ ] `paymentProof.update` - protected
  - [ ] `paymentProof.get` - protected
- [ ] Register router in root.ts

### Validation Logic
```typescript
async addPaymentProof(userId: string, data: AddPaymentProofDTO) {
  // 1. Get reservation
  const reservation = await this.reservationRepo.findById(data.reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError();
  }
  
  // 2. Verify ownership
  const profile = await this.profileRepo.findByUserId(userId);
  if (reservation.playerId !== profile?.id) {
    throw new NotReservationOwnerError();
  }
  
  // 3. Verify status
  const allowedStatuses = ["AWAITING_PAYMENT", "PAYMENT_MARKED_BY_USER"];
  if (!allowedStatuses.includes(reservation.status)) {
    throw new InvalidReservationStatusError(
      `Cannot add payment proof for reservation in ${reservation.status} status`
    );
  }
  
  // 4. Check existing
  const existing = await this.paymentProofRepo.findByReservationId(data.reservationId);
  if (existing) {
    throw new PaymentProofAlreadyExistsError();
  }
  
  // 5. Create
  return this.paymentProofRepo.create({
    reservationId: data.reservationId,
    fileUrl: data.fileUrl,
    referenceNumber: data.referenceNumber,
    notes: data.notes,
  });
}
```

### Testing
- [ ] Can add payment proof with URL only
- [ ] Can add payment proof with reference number only
- [ ] Can add payment proof with both
- [ ] Rejects when neither URL nor reference provided
- [ ] Cannot add duplicate proof for same reservation
- [ ] Only reservation owner can add proof
- [ ] Can only add proof when status is AWAITING_PAYMENT or PAYMENT_MARKED_BY_USER
- [ ] Can update existing proof
- [ ] Can retrieve proof
- [ ] No TypeScript errors

### Handoff
- [ ] Payment Proof module complete
- [ ] Update `00-overview.md` to mark 3C complete

---

## Module 5B: Audit Log Module
**Reference:** `06-phase5-admin.md`  
**Estimated Time:** 1 day  
**Dependencies:** 3A (Reservation) + 4A (Claim Request) complete

### Directory Setup
- [ ] Create `src/modules/audit/` directory structure:
  ```
  audit/
  ├── audit.router.ts
  ├── dtos/
  │   └── get-audit-log.dto.ts
  ├── factories/
  │   └── audit.factory.ts
  └── services/
      └── audit.service.ts
  ```

### Implementation
- [ ] Create DTOs
  - [ ] `GetReservationHistorySchema` - reservationId uuid
  - [ ] `GetClaimHistorySchema` - claimRequestId uuid
- [ ] Create `audit.service.ts`
  - [ ] `IAuditService` interface
  - [ ] `getReservationHistory(userId, reservationId)`
    - [ ] Verify reservation exists
    - [ ] Verify access: player OR court owner OR admin
    - [ ] Return events ordered by createdAt
  - [ ] `getClaimRequestHistory(adminUserId, claimRequestId)`
    - [ ] Admin-only (enforced by procedure)
    - [ ] Verify claim request exists
    - [ ] Return events ordered by createdAt
- [ ] Create `audit.factory.ts`
  - [ ] Lazy singleton factory for service
- [ ] Create `audit.router.ts`
  - [ ] `audit.reservationHistory` - protected
  - [ ] `audit.claimHistory` - admin

### Access Control for Reservation History
```typescript
async getReservationHistory(userId: string, reservationId: string) {
  // Get reservation
  const reservation = await this.reservationRepo.findById(reservationId);
  if (!reservation) {
    throw new ReservationNotFoundError();
  }
  
  // Check access
  const profile = await this.profileRepo.findByUserId(userId);
  const isPlayer = reservation.playerId === profile?.id;
  
  // Check if court owner
  const slot = await this.timeSlotRepo.findById(reservation.timeSlotId);
  const court = await this.courtRepo.findById(slot.courtId);
  const org = court.organizationId 
    ? await this.orgRepo.findById(court.organizationId)
    : null;
  const isOwner = org?.ownerUserId === userId;
  
  // Check if admin
  const userRole = await this.userRoleRepo.findByUserId(userId);
  const isAdmin = userRole?.role === "admin";
  
  if (!isPlayer && !isOwner && !isAdmin) {
    throw new AuthorizationError("Not authorized to view this reservation history");
  }
  
  // Get events
  return this.reservationEventRepo.findByReservationId(reservationId);
}
```

### Testing
- [ ] Player can view own reservation history
- [ ] Court owner can view reservation history for their courts
- [ ] Admin can view any reservation history
- [ ] Non-authorized users get FORBIDDEN
- [ ] Only admin can view claim request history
- [ ] Events returned in chronological order
- [ ] Returns 404 for non-existent reservation/claim
- [ ] No TypeScript errors

### Handoff
- [ ] Audit Log module complete
- [ ] Update `00-overview.md` to mark 5B complete

---

---

## UI-2C: My Reservations Page
**Reference:** `00-ui/ui-dev3-checklist.md`, `00-ui/03-ui-reservation.md`  
**Estimated Time:** 2 days  
**Dependencies:** Backend 3A complete  
**Can parallelize with:** UI Dev 2 (Book Slot Page)

### KudosStatusBadge Component
**File:** `src/shared/components/kudos/status-badge.tsx`
- [ ] Status mapping:
  - [ ] CREATED → primary, "Processing"
  - [ ] AWAITING_PAYMENT → warning, "Awaiting Payment"
  - [ ] PAYMENT_MARKED_BY_USER → primary, "Payment Pending"
  - [ ] CONFIRMED → success, "Confirmed"
  - [ ] EXPIRED → destructive, "Expired"
  - [ ] CANCELLED → secondary, "Cancelled"
- [ ] Size variants (sm, md, lg)
- [ ] Export from kudos index

### My Reservations Page
**File:** `src/app/(auth)/reservations/page.tsx`
- [ ] Auth-protected route
- [ ] Page header with title
- [ ] Tab navigation (Upcoming, Past, Cancelled)
- [ ] Reservation list
- [ ] URL state integration (nuqs)

### Reservation List Item
**File:** `src/features/reservation/components/reservation-list-item.tsx`
- [ ] Horizontal card layout
- [ ] Court image (80px square)
- [ ] Court name and location
- [ ] Date and time
- [ ] Status badge
- [ ] Price
- [ ] Actions (View, Pay Now, Cancel)
- [ ] Mobile: Stacked layout

### Data Hooks
- [ ] `useMyReservations(filters)` hook
- [ ] `useReservationsTabs()` hook with nuqs

### Testing
- [ ] Tabs switch correctly
- [ ] URL state persists
- [ ] Reservations load
- [ ] Actions navigate correctly
- [ ] Empty states show
- [ ] Mobile responsive

---

## UI-2D: Reservation Detail Page
**Reference:** `00-ui/ui-dev3-checklist.md`, `00-ui/03-ui-reservation.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-2C complete

### Reservation Detail Page
**File:** `src/app/(auth)/reservations/[id]/page.tsx`
- [ ] Auth-protected route
- [ ] Breadcrumb navigation
- [ ] Status banner (conditional)
- [ ] Two-column layout

### Status Banner Component
**File:** `src/features/reservation/components/status-banner.tsx`
- [ ] AWAITING_PAYMENT: Warning, countdown, Pay Now CTA
- [ ] PAYMENT_MARKED_BY_USER: Primary, "Waiting for confirmation"
- [ ] CONFIRMED: Success, checkmark, confirmation message
- [ ] EXPIRED: Destructive, error message
- [ ] CANCELLED: Muted, cancellation reason

### KudosTimeline Component
**File:** `src/shared/components/kudos/timeline.tsx`
- [ ] Vertical timeline layout
- [ ] Dot colors by status
- [ ] Line connecting dots
- [ ] Timestamp formatting

### Booking Details Card
- [ ] Court photo
- [ ] Court name and address
- [ ] Date and time range
- [ ] Price
- [ ] Get Directions link

### Cancel Reservation Dialog
**File:** `src/features/reservation/components/cancel-dialog.tsx`
- [ ] Confirmation dialog
- [ ] Optional reason textarea
- [ ] Loading state

### Data Hooks
- [ ] `useReservation(id)` hook
- [ ] `useCancelReservation()` mutation

### Testing
- [ ] Status banner shows correctly per status
- [ ] Timeline displays events
- [ ] Cancel dialog works
- [ ] Mobile responsive

---

## UI-2E: Profile Page
**Reference:** `00-ui/ui-dev3-checklist.md`, `00-ui/03-ui-reservation.md`  
**Estimated Time:** 1 day  
**Dependencies:** None (can start early)

### Profile Page
**File:** `src/app/(auth)/profile/page.tsx`
- [ ] Auth-protected route
- [ ] Page header
- [ ] Profile form

### Profile Form
**File:** `src/features/reservation/components/profile-form.tsx`
- [ ] Avatar upload section
- [ ] Display name input (required)
- [ ] Email input
- [ ] Phone number input
- [ ] Info note about data sharing
- [ ] Save button

### Profile Schema
**File:** `src/features/reservation/schemas/profile.schema.ts`
- [ ] Zod schema validation
- [ ] displayName: required, max 100
- [ ] email: optional, email format
- [ ] phoneNumber: optional, max 20

### Data Hooks
- [ ] `useProfile()` - fetch current profile
- [ ] `useUpdateProfile()` - mutation

### Testing
- [ ] Form loads with current data
- [ ] Validation works
- [ ] Save updates profile
- [ ] Success toast shows

---

## UI-2F: Shared Reservation Components
**Reference:** `00-ui/ui-dev3-checklist.md`, `00-ui/06-ui-components.md`  
**Estimated Time:** 1 day  
**Dependencies:** None

### Format Utilities
**File:** `src/shared/lib/format.ts`
- [ ] `formatCurrency(cents, currency)` - "₱200.00"
- [ ] `formatDate(date)` - "Wednesday, January 15, 2025"
- [ ] `formatTime(date)` - "6:00 AM"
- [ ] `formatTimeRange(start, end)` - "6:00 AM - 7:00 AM"
- [ ] `formatRelative(date)` - "2 hours ago"

### Loading Skeletons
**File:** `src/features/reservation/components/skeletons/`
- [ ] ReservationListSkeleton
- [ ] ReservationDetailSkeleton
- [ ] ProfileFormSkeleton

### Error States
**File:** `src/features/reservation/components/error-states/`
- [ ] ReservationNotFound
- [ ] SlotNoLongerAvailable
- [ ] PaymentExpired

### Testing
- [ ] Utilities work correctly
- [ ] Skeletons match final layout
- [ ] Error states display properly

---

## Final Checklist

### Backend
- [ ] All backend modules complete and tested (1C, 3C, 5B)
- [ ] No TypeScript errors in codebase
- [ ] All routers registered in root.ts
- [ ] Court discovery returns correct data shapes
- [ ] Payment proof integrates with reservation flow
- [ ] Audit logs accessible with proper authorization
- [ ] Integration tested with other developers' modules

### UI
- [ ] My Reservations page complete (UI-2C)
- [ ] Reservation Detail page complete (UI-2D)
- [ ] Profile page complete (UI-2E)
- [ ] Shared components complete (UI-2F)
- [ ] Status badges work correctly
- [ ] Timeline component works
- [ ] All format utilities work
- [ ] Loading skeletons implemented
- [ ] Error states implemented
- [ ] No TypeScript errors
- [ ] Responsive at all breakpoints
- [ ] Accessibility checked

### Documentation
- [ ] `00-overview.md` updated with completion status
- [ ] Handoffs documented

---

## Parallelization Summary

| Day | Backend Task | UI Task |
|-----|--------------|---------|
| 1 | 1C: Court Discovery | UI-2E: Profile Page (no deps) |
| 2 | 1C: Court Discovery (cont.) | UI-2F: Shared Components |
| 3 | Wait for 3A | UI-2F: Shared Components (cont.) |
| 4 | 3C: Payment Proof | UI-2C: My Reservations |
| 5 | 5B: Audit Log | UI-2C: My Reservations (cont.) |
| 6 | Testing | UI-2D: Reservation Detail |
| 7 | Integration | UI-2D: Reservation Detail (cont.) |
| 8 | Handoff | Polish & Handoff |
