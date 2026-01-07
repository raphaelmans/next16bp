# Developer 4 Checklist

**Focus Area:** Claims + Admin Tools + Owner & Admin Dashboards UI  
**Backend Modules:** 4A → 4B → 5A  
**UI Modules:** UI-3 (Owner Dashboard) → UI-4 (Admin Dashboard)

---

## Module 4A: Claim Request Module
**Reference:** `05-phase4-claims.md`  
**Estimated Time:** 2 days  
**Dependencies:** 1B (Organization) + 1C (Court Discovery) complete

### Directory Setup
- [ ] Create `src/modules/claim-request/` directory structure:
  ```
  claim-request/
  ├── claim-request.router.ts
  ├── dtos/
  │   ├── index.ts
  │   ├── submit-claim-request.dto.ts
  │   └── submit-removal-request.dto.ts
  ├── errors/
  │   └── claim-request.errors.ts
  ├── factories/
  │   └── claim-request.factory.ts
  ├── repositories/
  │   ├── claim-request.repository.ts
  │   └── claim-request-event.repository.ts
  └── services/
      └── claim-request.service.ts
  ```

### Implementation
- [ ] Create `claim-request.errors.ts`
  - [ ] `ClaimRequestNotFoundError` extends NotFoundError
  - [ ] `CourtAlreadyClaimedError` extends ConflictError
  - [ ] `PendingClaimExistsError` extends ConflictError
  - [ ] `NotCuratedCourtError` extends ValidationError
  - [ ] `CourtNotUnclaimedError` extends ValidationError
  - [ ] `NotClaimRequestOwnerError` extends AuthorizationError
  - [ ] `InvalidClaimStatusError` extends ValidationError
- [ ] Create DTOs
  - [ ] `SubmitClaimRequestSchema`
    - [ ] `courtId` - uuid
    - [ ] `organizationId` - uuid
    - [ ] `requestNotes` - optional string, max 1000
  - [ ] `SubmitRemovalRequestSchema`
    - [ ] `courtId` - uuid
    - [ ] `organizationId` - uuid
    - [ ] `requestNotes` - **required** string, min 1, max 1000
- [ ] Define response types
  ```typescript
  interface ClaimRequestWithCourt {
    claimRequest: ClaimRequestRecord;
    court: CourtRecord;
  }
  
  interface ClaimRequestWithDetails extends ClaimRequestWithCourt {
    organization: OrganizationRecord;
    events: ClaimRequestEventRecord[];
  }
  ```
- [ ] Create `claim-request.repository.ts`
  - [ ] `IClaimRequestRepository` interface
  - [ ] `findById(id, ctx?)` - basic record
  - [ ] `findByIdForUpdate(id, ctx)` - SELECT FOR UPDATE
  - [ ] `findByCourtId(courtId)` - all claims for a court
  - [ ] `findPendingByCourtId(courtId)` - single pending claim or null
  - [ ] `findByOrganizationId(orgId)` - all claims for an org
  - [ ] `findPending(pagination)` - all pending claims (for admin)
  - [ ] `create(data, ctx?)`, `update(id, data, ctx?)`
- [ ] Create `claim-request-event.repository.ts`
  - [ ] `IClaimRequestEventRepository` interface
  - [ ] `findByClaimRequestId(claimRequestId)`
  - [ ] `create(data, ctx?)`
- [ ] Create `claim-request.service.ts`
  - [ ] `IClaimRequestService` interface
  - [ ] `submitClaimRequest(userId, data)` - see logic below
  - [ ] `submitRemovalRequest(userId, data)` - similar logic
  - [ ] `cancelRequest(userId, requestId)` - cancel own pending request
  - [ ] `getMyClaimRequests(userId)` - list user's claims
  - [ ] `getClaimRequestById(userId, requestId)` - with authorization
- [ ] Create `claim-request.factory.ts`
  - [ ] Lazy singleton factories
- [ ] Create `claim-request.router.ts`
  - [ ] `claimRequest.submitClaim` - protected + rateLimited(sensitive)
  - [ ] `claimRequest.submitRemoval` - protected + rateLimited(sensitive)
  - [ ] `claimRequest.cancel` - protected
  - [ ] `claimRequest.getMy` - protected
  - [ ] `claimRequest.getById` - protected
- [ ] Register router in root.ts

### Submit Claim Request Logic
```typescript
async submitClaimRequest(userId: string, data: SubmitClaimRequestDTO) {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Verify user owns the organization
    const org = await this.orgRepo.findById(data.organizationId);
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }
    
    // 2. Get court with lock
    const court = await this.courtRepo.findByIdForUpdate(data.courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError();
    }
    
    // 3. Verify court is curated
    if (court.courtType !== "CURATED") {
      throw new NotCuratedCourtError();
    }
    
    // 4. Verify court is unclaimed
    if (court.claimStatus !== "UNCLAIMED") {
      throw new CourtNotUnclaimedError();
    }
    
    // 5. Check for existing pending claim
    const pending = await this.claimRequestRepo.findPendingByCourtId(data.courtId);
    if (pending) {
      throw new PendingClaimExistsError();
    }
    
    // 6. Create claim request
    const claimRequest = await this.claimRequestRepo.create({
      courtId: data.courtId,
      organizationId: data.organizationId,
      requestType: "CLAIM",
      status: "PENDING",
      requestedByUserId: userId,
      requestNotes: data.requestNotes,
    }, ctx);
    
    // 7. Update court claim status
    await this.courtRepo.update(data.courtId, {
      claimStatus: "CLAIM_PENDING",
    }, ctx);
    
    // 8. Create audit event
    await this.claimRequestEventRepo.create({
      claimRequestId: claimRequest.id,
      fromStatus: null,
      toStatus: "PENDING",
      triggeredByUserId: userId,
    }, ctx);
    
    return claimRequest;
  });
}
```

### Cancel Request Logic
```typescript
async cancelRequest(userId: string, requestId: string) {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    const request = await this.claimRequestRepo.findByIdForUpdate(requestId, ctx);
    if (!request) {
      throw new ClaimRequestNotFoundError();
    }
    
    // Only requester can cancel
    if (request.requestedByUserId !== userId) {
      throw new NotClaimRequestOwnerError();
    }
    
    // Can only cancel PENDING
    if (request.status !== "PENDING") {
      throw new InvalidClaimStatusError(`Cannot cancel in ${request.status} status`);
    }
    
    // Update request (treat as rejected by self)
    const updated = await this.claimRequestRepo.update(requestId, {
      status: "REJECTED",
      reviewNotes: "Cancelled by requester",
    }, ctx);
    
    // Revert court status
    await this.courtRepo.update(request.courtId, {
      claimStatus: "UNCLAIMED",
    }, ctx);
    
    // Audit event
    await this.claimRequestEventRepo.create({
      claimRequestId: requestId,
      fromStatus: "PENDING",
      toStatus: "REJECTED",
      triggeredByUserId: userId,
      notes: "Cancelled by requester",
    }, ctx);
    
    return updated;
  });
}
```

### Testing
- [ ] Can submit claim for curated court
- [ ] Cannot claim non-curated court (RESERVABLE)
- [ ] Cannot claim already claimed court
- [ ] Cannot submit duplicate pending claim for same court
- [ ] Only organization owner can submit claim
- [ ] Court status updates to CLAIM_PENDING
- [ ] Can cancel own pending request
- [ ] Cannot cancel others' requests
- [ ] Court status reverts to UNCLAIMED on cancellation
- [ ] Can list my claim requests
- [ ] Can view claim request details
- [ ] Audit events created for submit and cancel
- [ ] No TypeScript errors

### Handoff
- [ ] Claim Request module ready for Claim Admin (4B)
- [ ] Update `00-overview.md` to mark 4A complete

---

## Module 4B: Claim Admin Module
**Reference:** `05-phase4-claims.md`  
**Estimated Time:** 2 days  
**Dependencies:** 4A (Claim Request) + 0B (Admin Role) complete

### Directory Setup
- [ ] Extend `src/modules/claim-request/` with:
  ```
  claim-request/
  ├── admin/
  │   └── claim-admin.router.ts     # New
  ├── dtos/
  │   ├── approve-claim-request.dto.ts  # New
  │   └── reject-claim-request.dto.ts   # New
  ├── services/
  │   └── claim-admin.service.ts    # New
  └── use-cases/
      └── approve-claim-request.use-case.ts  # New
  ```

### Implementation
- [ ] Create additional DTOs
  - [ ] `ApproveClaimRequestSchema`
    - [ ] `requestId` - uuid
    - [ ] `reviewNotes` - optional string, max 1000
  - [ ] `RejectClaimRequestSchema`
    - [ ] `requestId` - uuid
    - [ ] `reviewNotes` - **required** string, min 1, max 1000
- [ ] Create `claim-admin.service.ts`
  - [ ] `IClaimAdminService` interface
  - [ ] `getPendingClaimRequests(pagination)` - list all pending
  - [ ] `getClaimRequestById(requestId)` - full details for admin
  - [ ] `approveClaimRequest(adminUserId, requestId, notes?)` - delegate to use case
  - [ ] `rejectClaimRequest(adminUserId, requestId, reason)` - see logic below
- [ ] Create `approve-claim-request.use-case.ts` - **complex transaction**
  - [ ] See detailed logic below
- [ ] Create `claim-admin.router.ts`
  - [ ] `admin.claim.getPending` - admin procedure
  - [ ] `admin.claim.getById` - admin procedure
  - [ ] `admin.claim.approve` - admin + rateLimited(mutation)
  - [ ] `admin.claim.reject` - admin + rateLimited(mutation)
- [ ] Update factories
- [ ] Register router in root.ts (under `admin` namespace)

### Approve Claim Request Use Case (Complex Transaction)
```typescript
class ApproveClaimRequestUseCase {
  async execute(adminUserId: string, requestId: string, reviewNotes?: string) {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };
      
      // 1. Lock claim request
      const claimRequest = await this.claimRequestRepo.findByIdForUpdate(requestId, ctx);
      if (!claimRequest) {
        throw new ClaimRequestNotFoundError();
      }
      
      if (claimRequest.status !== "PENDING") {
        throw new InvalidClaimStatusError(
          `Cannot approve claim in ${claimRequest.status} status`
        );
      }
      
      // 2. Lock court
      const court = await this.courtRepo.findByIdForUpdate(claimRequest.courtId, ctx);
      if (!court) {
        throw new CourtNotFoundError();
      }
      
      // 3. Get curated detail (to potentially preserve data)
      const curatedDetail = await this.curatedDetailRepo.findByCourtId(court.id);
      
      // 4. Update claim request
      const updatedRequest = await this.claimRequestRepo.update(requestId, {
        status: "APPROVED",
        reviewerUserId: adminUserId,
        reviewedAt: new Date(),
        reviewNotes,
      }, ctx);
      
      // 5. Update court - THIS IS THE KEY TRANSFORMATION
      await this.courtRepo.update(court.id, {
        claimStatus: "CLAIMED",
        courtType: "RESERVABLE",
        organizationId: claimRequest.organizationId,
      }, ctx);
      
      // 6. Create reservable court detail
      await this.reservableDetailRepo.create({
        courtId: court.id,
        isFree: false,
        defaultCurrency: "PHP",
        // Could copy website from curated if desired
        // websiteUrl could become paymentInstructions link
      }, ctx);
      
      // 7. Delete curated court detail
      if (curatedDetail) {
        await this.curatedDetailRepo.delete(court.id, ctx);
      }
      
      // 8. Create audit event
      await this.claimRequestEventRepo.create({
        claimRequestId: requestId,
        fromStatus: "PENDING",
        toStatus: "APPROVED",
        triggeredByUserId: adminUserId,
        notes: reviewNotes,
      }, ctx);
      
      return updatedRequest;
    });
  }
}
```

### Reject Claim Request Logic
```typescript
async rejectClaimRequest(adminUserId: string, requestId: string, reason: string) {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    const claimRequest = await this.claimRequestRepo.findByIdForUpdate(requestId, ctx);
    if (!claimRequest) {
      throw new ClaimRequestNotFoundError();
    }
    
    if (claimRequest.status !== "PENDING") {
      throw new InvalidClaimStatusError(
        `Cannot reject claim in ${claimRequest.status} status`
      );
    }
    
    // Update claim request
    const updated = await this.claimRequestRepo.update(requestId, {
      status: "REJECTED",
      reviewerUserId: adminUserId,
      reviewedAt: new Date(),
      reviewNotes: reason,
    }, ctx);
    
    // Revert court status
    await this.courtRepo.update(claimRequest.courtId, {
      claimStatus: "UNCLAIMED",
    }, ctx);
    
    // Audit event
    await this.claimRequestEventRepo.create({
      claimRequestId: requestId,
      fromStatus: "PENDING",
      toStatus: "REJECTED",
      triggeredByUserId: adminUserId,
      notes: reason,
    }, ctx);
    
    return updated;
  });
}
```

### Testing
- [ ] Only admins can access all endpoints (non-admin gets FORBIDDEN)
- [ ] Can list pending claim requests with pagination
- [ ] Can view claim request details
- [ ] **Approval flow:**
  - [ ] Claim request status → APPROVED
  - [ ] Court type → RESERVABLE
  - [ ] Court claim_status → CLAIMED
  - [ ] Court organization_id set to claiming org
  - [ ] ReservableCourtDetail created
  - [ ] CuratedCourtDetail deleted
  - [ ] Audit event created
- [ ] **Rejection flow:**
  - [ ] Claim request status → REJECTED
  - [ ] Court claim_status → UNCLAIMED (reverted)
  - [ ] Audit event created
- [ ] Cannot approve/reject non-PENDING requests
- [ ] Reason required for rejection
- [ ] No TypeScript errors

### Handoff
- [ ] Claim Admin module complete
- [ ] Full claim flow working end-to-end
- [ ] Update `00-overview.md` to mark 4B complete

---

## Module 5A: Admin Court Module
**Reference:** `06-phase5-admin.md`  
**Estimated Time:** 1 day  
**Dependencies:** 2A (Court Management) complete

### Directory Setup
- [ ] Extend `src/modules/court/` with:
  ```
  court/
  ├── admin/
  │   └── admin-court.router.ts     # New
  ├── dtos/
  │   ├── create-curated-court.dto.ts   # New
  │   └── admin-update-court.dto.ts     # New
  └── services/
      └── admin-court.service.ts    # New
  ```

### Implementation
- [ ] Create additional DTOs
  - [ ] `CreateCuratedCourtSchema`
    - [ ] `name`, `address`, `city`, `latitude`, `longitude` - required
    - [ ] `facebookUrl`, `viberInfo`, `instagramUrl`, `websiteUrl`, `otherContactInfo` - optional
    - [ ] `photos` - optional array of { url, displayOrder }
    - [ ] `amenities` - optional array of strings
  - [ ] `AdminUpdateCourtSchema`
    - [ ] `courtId` - required
    - [ ] All other fields optional
  - [ ] `DeactivateCourtSchema`
    - [ ] `courtId` - required
    - [ ] `reason` - required string
  - [ ] `AdminCourtFiltersSchema`
    - [ ] `isActive`, `courtType`, `claimStatus`, `city`, `search`
    - [ ] Pagination (limit, offset)
- [ ] Create `admin-court.service.ts`
  - [ ] `IAdminCourtService` interface
  - [ ] `createCuratedCourt(adminUserId, data)` - create court + detail + photos + amenities
  - [ ] `updateCourt(adminUserId, courtId, data)` - update any court
  - [ ] `deactivateCourt(adminUserId, courtId, reason)` - set isActive = false
  - [ ] `activateCourt(adminUserId, courtId)` - set isActive = true
  - [ ] `listAllCourts(filters)` - admin view of all courts
- [ ] Create `admin-court.router.ts`
  - [ ] `admin.court.createCurated` - admin + rateLimited(mutation)
  - [ ] `admin.court.update` - admin
  - [ ] `admin.court.deactivate` - admin
  - [ ] `admin.court.activate` - admin
  - [ ] `admin.court.list` - admin
- [ ] Register router in root.ts

### Create Curated Court Logic
```typescript
async createCuratedCourt(adminUserId: string, data: CreateCuratedCourtDTO) {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Create court (no organization - admin-created)
    const court = await this.courtRepo.create({
      organizationId: null,
      name: data.name,
      address: data.address,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      courtType: "CURATED",
      claimStatus: "UNCLAIMED",
      isActive: true,
    }, ctx);
    
    // 2. Create curated detail
    const detail = await this.curatedDetailRepo.create({
      courtId: court.id,
      facebookUrl: data.facebookUrl,
      viberInfo: data.viberInfo,
      instagramUrl: data.instagramUrl,
      websiteUrl: data.websiteUrl,
      otherContactInfo: data.otherContactInfo,
    }, ctx);
    
    // 3. Create photos
    const photos = [];
    if (data.photos?.length) {
      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        const created = await this.courtPhotoRepo.create({
          courtId: court.id,
          url: photo.url,
          displayOrder: photo.displayOrder ?? i,
        }, ctx);
        photos.push(created);
      }
    }
    
    // 4. Create amenities
    const amenities = [];
    if (data.amenities?.length) {
      for (const name of data.amenities) {
        const created = await this.courtAmenityRepo.create({
          courtId: court.id,
          name,
        }, ctx);
        amenities.push(created);
      }
    }
    
    return { court, detail, photos, amenities };
  });
}
```

### Testing
- [ ] Only admins can access all endpoints
- [ ] Can create curated court with all details
- [ ] Can create curated court with photos
- [ ] Can create curated court with amenities
- [ ] Created courts have correct type (CURATED) and status (UNCLAIMED)
- [ ] Can update any court (not just own)
- [ ] Can deactivate court (isActive = false)
- [ ] Can reactivate court
- [ ] Can list all courts with filters
- [ ] Search by name works
- [ ] Filter by isActive, courtType, claimStatus works
- [ ] No TypeScript errors

### Handoff
- [ ] Admin Court module complete
- [ ] Update `00-overview.md` to mark 5A complete

---

---

## UI-3A: Owner Dashboard - Layout & Navigation
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/04-ui-owner.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-0B (Layout Components) complete  
**Can parallelize with:** Backend 4A

### Owner Layout
**File:** `src/app/(owner)/owner/layout.tsx`
- [ ] Auth-protected route
- [ ] Organization ownership check
- [ ] DashboardLayout integration
- [ ] Sidebar navigation

### Owner Sidebar
**File:** `src/features/owner/components/owner-sidebar.tsx`
- [ ] Navigation items: Dashboard, My Courts, Reservations (with badge), Settings
- [ ] Organization switcher (if multiple orgs)
- [ ] Active state styling
- [ ] Mobile: Sheet drawer

### Organization Context
**File:** `src/features/owner/contexts/organization-context.tsx`
- [ ] Current organization state
- [ ] Organization list
- [ ] Switch organization function

### Testing
- [ ] Layout renders correctly
- [ ] Sidebar navigation works
- [ ] Organization switcher works
- [ ] Mobile sidebar works

---

## UI-3B: Owner Dashboard - Home
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/04-ui-owner.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-3A complete

### Dashboard Page
**File:** `src/app/(owner)/owner/page.tsx`
- [ ] Welcome message
- [ ] Stats cards (Active Courts, Pending Bookings, Today's Bookings, Revenue)
- [ ] Pending actions alert
- [ ] Recent activity feed
- [ ] Today's bookings timeline

### Stats Card Component
**File:** `src/features/owner/components/stats-card.tsx`
- [ ] Icon, title, value
- [ ] Optional trend indicator
- [ ] Hover state

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-dashboard.ts`
- [ ] Stats data
- [ ] Recent activity
- [ ] Today's bookings
- [ ] Pending count

### Testing
- [ ] Stats load correctly
- [ ] Pending alert shows/hides
- [ ] Activity feed loads

---

## UI-3C: Owner Dashboard - Courts Management
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/04-ui-owner.md`  
**Estimated Time:** 2.5 days  
**Dependencies:** UI-3B complete, Backend 2A ready

### My Courts Page
**File:** `src/app/(owner)/owner/courts/page.tsx`
- [ ] Page header with Add New Court button
- [ ] Courts table
- [ ] Empty state

### Courts Table
**File:** `src/features/owner/components/courts-table.tsx`
- [ ] Columns: Image, Name, Location, Status, Slots, Actions
- [ ] Action dropdown: Edit, Manage Slots, View Bookings, View Public, Deactivate
- [ ] Row click → Edit

### Court Form Component
**File:** `src/features/owner/components/court-form.tsx`
- [ ] Tabs: Basic Info, Location, Photos, Amenities, Payment
- [ ] Form validation with Zod
- [ ] react-hook-form integration

### Map Location Picker
**File:** `src/features/owner/components/map-picker.tsx`
- [ ] Interactive map (Mapbox or Google Maps)
- [ ] Click to place pin
- [ ] Search address
- [ ] Output lat/lng

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-courts.ts`
- [ ] `useOwnerCourts(orgId)` - list courts
- [ ] `useOwnerCourt(courtId)` - single court
- [ ] `useCreateCourt()` - mutation
- [ ] `useUpdateCourt()` - mutation

### Testing
- [ ] Courts table loads
- [ ] Create court flow works
- [ ] Edit court flow works
- [ ] Photo management works
- [ ] Map picker works

---

## UI-3D: Owner Dashboard - Slot Management
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/04-ui-owner.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-3C complete, Backend 2B ready

### Manage Slots Page
**File:** `src/app/(owner)/owner/courts/[id]/slots/page.tsx`
- [ ] Court name in header
- [ ] Calendar navigation
- [ ] Date picker
- [ ] Slots list for selected date

### Date Grid
**File:** `src/features/owner/components/date-grid.tsx`
- [ ] Monthly calendar view
- [ ] Day cells with booking indicators
- [ ] Click to select date

### Slots List
**File:** `src/features/owner/components/slots-list.tsx`
- [ ] List of slots for selected date
- [ ] Time, duration, status, price
- [ ] Player info (if booked/held)
- [ ] Actions per slot (Block, Delete, Confirm)

### Add Slots Modal
**File:** `src/features/owner/components/add-slots-modal.tsx`
- [ ] Single day / Multiple days toggle
- [ ] Date range picker
- [ ] Time settings
- [ ] Pricing options
- [ ] Preview summary

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-slots.ts`
- [ ] `useOwnerSlots(courtId, date)`
- [ ] `useCreateSlot()`, `useCreateBulkSlots()`
- [ ] `useBlockSlot()`, `useDeleteSlot()`

### Testing
- [ ] Calendar navigation works
- [ ] Slots load for date
- [ ] Add slots works
- [ ] Block/unblock works

---

## UI-3E: Owner Dashboard - Reservations
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/04-ui-owner.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-3D complete, Backend 3B ready

### Owner Reservations Page
**File:** `src/app/(owner)/owner/reservations/page.tsx`
- [ ] Page header
- [ ] Filters bar (Court, Status, Date, Player search)
- [ ] Tabs (Pending Action, Upcoming, Past, Cancelled)
- [ ] Reservations table

### Reservations Table
**File:** `src/features/owner/components/reservations-table.tsx`
- [ ] Columns: Court, Player, Date/Time, Amount, Status, Actions
- [ ] Expandable row for details
- [ ] Inline actions (Confirm/Reject)

### Confirm/Reject Actions
- [ ] Confirm Payment dialog
- [ ] Reject with Reason dialog
- [ ] Loading states

### Data Hooks
**File:** `src/features/owner/hooks/use-owner-reservations.ts`
- [ ] `useOwnerReservations(orgId, filters)`
- [ ] `useConfirmPayment()`, `useRejectReservation()`

### Testing
- [ ] Reservations table loads
- [ ] Filters work
- [ ] Confirm/reject flows work

---

## UI-3F: Owner Dashboard - Settings
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/04-ui-owner.md`  
**Estimated Time:** 1.5 days  
**Dependencies:** UI-3B complete

### Organization Settings Page
**File:** `src/app/(owner)/owner/settings/page.tsx`
- [ ] Logo upload
- [ ] Organization name
- [ ] URL slug
- [ ] Description
- [ ] Contact info

### Claim Court Page
**File:** `src/app/(owner)/owner/claim/[courtId]/page.tsx`
- [ ] Court preview card
- [ ] Organization selector
- [ ] Notes textarea
- [ ] Submit button

### Data Hooks
- [ ] `useUpdateOrganization()`
- [ ] `useSubmitClaimRequest()`

### Testing
- [ ] Settings form works
- [ ] Claim submission works

---

## UI-4A: Admin Dashboard - Layout
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/05-ui-admin.md`  
**Estimated Time:** 1 day  
**Dependencies:** Backend 4B ready (admin role)

### Admin Layout
**File:** `src/app/(admin)/admin/layout.tsx`
- [ ] Admin role check
- [ ] Redirect non-admins
- [ ] DashboardLayout integration

### Admin Sidebar
**File:** `src/features/admin/components/admin-sidebar.tsx`
- [ ] Navigation: Dashboard, Claims (with badge), Courts
- [ ] Active state styling

### Admin Dashboard Page
**File:** `src/app/(admin)/admin/page.tsx`
- [ ] Stats overview
- [ ] Pending claims preview
- [ ] Recent activity

### Testing
- [ ] Admin access works
- [ ] Non-admin redirected

---

## UI-4B: Admin Dashboard - Claims
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/05-ui-admin.md`  
**Estimated Time:** 2.5 days  
**Dependencies:** UI-4A complete

### Claims List Page
**File:** `src/app/(admin)/admin/claims/page.tsx`
- [ ] Page header
- [ ] Tabs (Pending, Approved, Rejected)
- [ ] Claims table

### Claims Table
**File:** `src/features/admin/components/claims-table.tsx`
- [ ] Columns: Type, Court, Organization, Submitted, Actions
- [ ] Type badges (CLAIM / REMOVAL)
- [ ] Review button

### Claim Detail Page
**File:** `src/app/(admin)/admin/claims/[id]/page.tsx`
- [ ] Status banner
- [ ] Court information card
- [ ] Organization information card
- [ ] Timeline
- [ ] Review actions (Approve/Reject)

### Review Actions
**File:** `src/features/admin/components/claim-review-actions.tsx`
- [ ] Approve confirmation dialog
- [ ] Reject with reason dialog
- [ ] Loading states

### Data Hooks
**File:** `src/features/admin/hooks/use-admin-claims.ts`
- [ ] `usePendingClaims(pagination)`
- [ ] `useClaimById(id)`
- [ ] `useApproveClaim()`, `useRejectClaim()`

### Testing
- [ ] Claims list loads
- [ ] Approve flow works
- [ ] Reject flow works

---

## UI-4C: Admin Dashboard - Courts
**Reference:** `00-ui/ui-dev4-checklist.md`, `00-ui/05-ui-admin.md`  
**Estimated Time:** 2 days  
**Dependencies:** UI-4B complete

### Admin Courts Page
**File:** `src/app/(admin)/admin/courts/page.tsx`
- [ ] Page header with Add Curated Court button
- [ ] Filters (type, status, city, claim status)
- [ ] Courts table

### Admin Courts Table
**File:** `src/features/admin/components/admin-courts-table.tsx`
- [ ] Columns: Image, Name, Type, Owner, Status, Actions
- [ ] Type indicators (CURATED / RESERVABLE)
- [ ] Action menu

### Create Curated Court Page
**File:** `src/app/(admin)/admin/courts/new/page.tsx`
- [ ] Curated court form
- [ ] Contact info fields
- [ ] Photos and amenities

### Deactivate Dialog
**File:** `src/features/admin/components/deactivate-court-dialog.tsx`
- [ ] Reason input (required)
- [ ] Explanation of effects

### Data Hooks
**File:** `src/features/admin/hooks/use-admin-courts.ts`
- [ ] `useAdminCourts(filters)`
- [ ] `useCreateCuratedCourt()`
- [ ] `useActivateCourt()`, `useDeactivateCourt()`

### Testing
- [ ] Courts list loads
- [ ] Create curated court works
- [ ] Activate/deactivate works

---

## Final Checklist

### Backend
- [ ] All backend modules complete and tested (4A, 4B, 5A)
- [ ] No TypeScript errors in codebase
- [ ] All routers registered in root.ts
- [ ] Claim flow working end-to-end:
  - [ ] Submit claim → PENDING
  - [ ] Admin approve → court becomes RESERVABLE
  - [ ] Admin reject → court stays UNCLAIMED
- [ ] Admin can create curated courts
- [ ] Admin can manage all courts
- [ ] Integration tested with other developers' modules

### UI
- [ ] Owner Dashboard complete (UI-3A to UI-3F)
- [ ] Admin Dashboard complete (UI-4A to UI-4C)
- [ ] All forms work correctly
- [ ] All tables load and filter
- [ ] All mutations work
- [ ] Proper authorization in place
- [ ] No TypeScript errors
- [ ] Responsive at all breakpoints
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Accessibility checked

### Documentation
- [ ] `00-overview.md` updated with completion status
- [ ] Handoffs documented

---

## Parallelization Summary

| Day | Backend Task | UI Task |
|-----|--------------|---------|
| 1 | 4A: Claim Request | UI-3A: Owner Layout |
| 2 | 4A: Claim Request (cont.) | UI-3B: Owner Dashboard Home |
| 3 | 4B: Claim Admin | UI-3C: Courts Management |
| 4 | 4B: Claim Admin (cont.) | UI-3C: Courts Management (cont.) |
| 5 | 5A: Admin Court | UI-3D: Slot Management |
| 6 | Testing | UI-3D: Slot Management (cont.) |
| 7 | Integration | UI-3E: Owner Reservations |
| 8 | Handoff | UI-3F: Settings + UI-4A: Admin Layout |
| 9 | - | UI-4B: Admin Claims |
| 10 | - | UI-4C: Admin Courts + Polish |
