# Server Developer Checklist - UI User Stories Implementation

**Focus Area:** Backend endpoints and server-side logic  
**Estimated Time:** 1 day  
**Can Parallel With:** UI Dev (most tasks)

---

## Overview

Server work required to support the UI user stories implementation. Most server work can run in parallel with UI development.

---

## Timeline & Coordination

### Your Schedule

| Time | Task | Blocks UI? |
|------|------|------------|
| Day 1 AM | S1: Verify org endpoints | No |
| Day 1 AM | S2: Create court endpoint | Yes - U4A |
| Day 1 PM | S3: Pending count endpoint | Partial - U1B |
| Day 1 PM | S4: Reservations filter | Partial - U1B |
| Day 2 AM | S5: Claims pending count | Partial - U2E |
| Day 2 PM | Integration testing | - |

### Sync Points with UI Dev

| When | What to Communicate |
|------|---------------------|
| S2 Complete | Notify UI dev: "createCourt endpoint ready" with schema |
| S3 Complete | Notify UI dev: "pending count endpoint ready" |
| S5 Complete | Notify UI dev: "claims count endpoint ready" |
| Day 2 PM | Joint integration testing |

### What UI Dev is Doing (For Context)

| Day | UI Tasks | Your Related Task |
|-----|----------|-------------------|
| Day 1 | Auth wiring, Home page | S3, S4 feed into Home page |
| Day 1-2 | Navigation, PageHeader | S5 feeds into Admin sidebar |
| Day 2 | Organization onboarding | Uses existing endpoints |
| Day 2-3 | Court creation form | Needs S2 to submit |

---

## Module S1: Organization Endpoints (Verify/Enhance)

**Reference:** `02-03-phase-organization.md`  
**Estimated Time:** 1-2 hours  
**Parallel:** Yes - UI can mock while this is built

### Verify Existing

- [ ] `organization.create` - Creates organization with auto-slug
- [ ] `organization.my` - Returns user's organizations
- [ ] `organization.get` - Public get by ID
- [ ] `organization.getBySlug` - Public get by slug

### Testing

- [ ] Create organization with name only (slug auto-generates)
- [ ] Create organization with custom slug
- [ ] Slug conflict appends number
- [ ] Rate limiting works on create

---

## Module S2: Court Management - Create Court Endpoint (NEW)

**Reference:** `02-04-phase-court-creation.md`  
**Estimated Time:** 2-3 hours  
**Parallel:** Yes - UI can mock while this is built  
**Blocks:** UI Module 4A (form submission)

### Setup

- [ ] Create `src/modules/court-management/dtos/create-court.dto.ts`

```typescript
import { z } from "zod";

export const CreateCourtSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1).max(150),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  defaultPrice: z.number().min(0).optional().nullable(),
  currency: z.string().default("PHP"),
});

export type CreateCourtDTO = z.infer<typeof CreateCourtSchema>;
```

### Implementation

- [ ] Add to `src/modules/court-management/services/court-management.service.ts`:

```typescript
async createCourt(ownerId: string, data: CreateCourtDTO): Promise<Court> {
  // 1. Verify owner owns this organization
  const org = await this.organizationRepo.findById(data.organizationId);
  if (!org) {
    throw new OrganizationNotFoundError();
  }
  if (org.ownerUserId !== ownerId) {
    throw new NotOrganizationOwnerError();
  }

  // 2. Create court as RESERVABLE
  const court = await this.courtRepo.create({
    organizationId: data.organizationId,
    name: data.name,
    address: data.address,
    city: data.city,
    description: data.description ?? null,
    courtType: "RESERVABLE",
    claimStatus: "CLAIMED",
    isActive: true,
  });

  return court;
}
```

- [ ] Add to `src/modules/court-management/court-management.router.ts`:

```typescript
createCourt: protectedProcedure
  .input(CreateCourtSchema)
  .mutation(async ({ ctx, input }) => {
    const service = makeCourtManagementService();
    return service.createCourt(ctx.userId, input);
  }),
```

- [ ] Add necessary imports and factory updates

### Testing

- [ ] Rejects unauthenticated requests
- [ ] Rejects if user doesn't own organization
- [ ] Creates court with `courtType: RESERVABLE`
- [ ] Creates court with `claimStatus: CLAIMED`
- [ ] Links court to organization
- [ ] Returns created court object
- [ ] TypeScript compiles without errors

---

## Module S3: Pending Reservations Count Endpoint (NEW)

**Reference:** `02-01-phase-foundation.md` (Home page org stats)  
**Estimated Time:** 1 hour  
**Parallel:** Yes  
**Blocks:** UI Home page org section

### Implementation

- [ ] Add to `src/modules/reservation/reservation-owner.router.ts`:

```typescript
getPendingCount: protectedProcedure
  .input(z.object({ organizationId: z.string().uuid() }))
  .query(async ({ ctx, input }) => {
    const service = makeReservationOwnerService();
    return service.getPendingCount(ctx.userId, input.organizationId);
  }),
```

- [ ] Add to reservation-owner service:

```typescript
async getPendingCount(ownerId: string, organizationId: string): Promise<number> {
  // Verify owner
  const org = await this.organizationRepo.findById(organizationId);
  if (!org || org.ownerUserId !== ownerId) {
    throw new NotOrganizationOwnerError();
  }
  
  // Count pending reservations
  return this.reservationRepo.countByOrganizationAndStatus(
    organizationId,
    ["PAYMENT_MARKED_BY_USER"]
  );
}
```

- [ ] Add repository method if not exists

### Testing

- [ ] Returns count of PAYMENT_MARKED_BY_USER reservations
- [ ] Only counts for owned organization
- [ ] Returns 0 if no pending

---

## Module S4: Upcoming Reservations Filter (Verify/Enhance)

**Reference:** `02-01-phase-foundation.md` (Home page)  
**Estimated Time:** 30 min  
**Parallel:** Yes

### Verify Existing

- [ ] `reservation.getMyReservations` supports filtering by:
  - [ ] `limit` parameter
  - [ ] Future reservations only (startTime > now)
  - [ ] Status filter (CONFIRMED, AWAITING_PAYMENT, PAYMENT_MARKED_BY_USER)

### Enhancement (if needed)

```typescript
// Add to getMyReservations input schema if not present
upcoming: z.boolean().optional(), // Filter for future only
limit: z.number().min(1).max(50).optional(),
```

### Testing

- [ ] Can fetch only upcoming reservations
- [ ] Can limit results to 3
- [ ] Returns correct statuses

---

## Module S5: Admin Claims Pending Count (Verify)

**Reference:** `02-02-phase-navigation.md` (Admin sidebar badge)  
**Estimated Time:** 30 min  
**Parallel:** Yes

### Verify Existing

- [ ] Endpoint exists: `claimAdmin.getPendingCount` or similar
- [ ] Returns count of PENDING claim requests

### Implementation (if not exists)

```typescript
// Add to claim-admin.router.ts
getPendingCount: adminProcedure
  .query(async ({ ctx }) => {
    const service = makeClaimAdminService();
    return service.getPendingCount();
  }),
```

### Testing

- [ ] Returns correct count
- [ ] Only accessible by admin

---

## Final Checklist

### Build Verification

- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] No new ESLint errors

### Integration Points

- [ ] Document new endpoints for UI dev
- [ ] Confirm input/output schemas match UI expectations

---

---

## Completion Notification Templates

When you complete a task, notify UI dev with these details:

### S2 Complete Notification

```
✅ S2: courtManagement.createCourt endpoint complete

Endpoint: courtManagement.createCourt (mutation)
Input Schema:
{
  organizationId: string (uuid),
  name: string (1-150 chars),
  address: string (1-200 chars),
  city: string (1-100 chars),
  description?: string (max 1000 chars),
  defaultPrice?: number (min 0),
  currency: string (default "PHP")
}

Output: Court object with id, name, address, city, courtType, claimStatus, etc.

Ready for UI integration in U4A.
```

### S3 Complete Notification

```
✅ S3: reservationOwner.getPendingCount endpoint complete

Endpoint: reservationOwner.getPendingCount (query)
Input: { organizationId: string (uuid) }
Output: number (count of PAYMENT_MARKED_BY_USER reservations)

Ready for UI integration in Home page org section.
```

### S5 Complete Notification

```
✅ S5: claimAdmin.getPendingCount endpoint complete

Endpoint: claimAdmin.getPendingCount (query)
Input: none
Output: number (count of PENDING claim requests)

Ready for UI integration in Admin sidebar badge.
```

---

## Reference: What UI Dev Needs

| UI Component | Data Needed | Your Endpoint |
|--------------|-------------|---------------|
| Home page - Org stats | Pending reservation count | S3 |
| Home page - Reservations | Upcoming reservations (limit 3) | S4 |
| Admin sidebar | Pending claims badge | S5 |
| Court creation form | Create court mutation | S2 |
