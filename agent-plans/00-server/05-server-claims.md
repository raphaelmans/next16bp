# Phase 4: Claim Request Modules

**Prerequisites:** Phase 1B (Organization), Phase 1C (Court Discovery)  
**Can run in parallel with Phase 3**  
**Module 4B requires Pre-Phase 0B (Admin Role System)**

---

## Module 4A: Claim Request Module

**Assigned to:** Agent 4  
**Complexity:** Medium  
**Dependencies:** Phase 1B (Organization), Phase 1C (Court Discovery)

### Overview

Allows organization owners to submit claims for curated courts they own, initiating the process to convert them to reservable courts.

### Directory Structure

```
src/modules/claim-request/
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

### Database Schema Reference

```typescript
// claim_request table
claimRequest: {
  id: uuid,
  courtId: uuid (FK → court),
  organizationId: uuid (FK → organization),
  requestType: enum('CLAIM', 'REMOVAL'),
  status: enum('PENDING', 'APPROVED', 'REJECTED'),
  requestedByUserId: uuid (FK → auth.users),
  reviewerUserId: uuid (FK → auth.users, nullable),
  reviewedAt: timestamptz (nullable),
  requestNotes: text,
  reviewNotes: text,
  createdAt: timestamptz,
  updatedAt: timestamptz,
}

// claim_request_event table (audit log)
claimRequestEvent: {
  id: uuid,
  claimRequestId: uuid (FK → claim_request),
  fromStatus: varchar(20),
  toStatus: varchar(20),
  triggeredByUserId: uuid (FK → auth.users),
  notes: text,
  createdAt: timestamptz,
}
```

### State Machine

```
CLAIM REQUEST:
PENDING ──► APPROVED (court becomes RESERVABLE)
    │
    └──► REJECTED

REMOVAL REQUEST:
PENDING ──► APPROVED (court deactivated)
    │
    └──► REJECTED
```

### Repository Interfaces

#### Claim Request Repository

```typescript
interface IClaimRequestRepository {
  findById(id: string, ctx?: RequestContext): Promise<ClaimRequestRecord | null>;
  findByIdForUpdate(id: string, ctx: RequestContext): Promise<ClaimRequestRecord | null>;
  findByCourtId(courtId: string): Promise<ClaimRequestRecord[]>;
  findPendingByCourtId(courtId: string): Promise<ClaimRequestRecord | null>;
  findByOrganizationId(orgId: string): Promise<ClaimRequestRecord[]>;
  findPending(pagination: PaginationDTO): Promise<{ requests: ClaimRequestRecord[]; total: number }>;
  create(data: InsertClaimRequest, ctx?: RequestContext): Promise<ClaimRequestRecord>;
  update(id: string, data: Partial<InsertClaimRequest>, ctx?: RequestContext): Promise<ClaimRequestRecord>;
}
```

#### Claim Request Event Repository

```typescript
interface IClaimRequestEventRepository {
  findByClaimRequestId(claimRequestId: string): Promise<ClaimRequestEventRecord[]>;
  create(data: InsertClaimRequestEvent, ctx?: RequestContext): Promise<ClaimRequestEventRecord>;
}
```

### Service Interface

```typescript
interface IClaimRequestService {
  submitClaimRequest(userId: string, data: SubmitClaimRequestDTO): Promise<ClaimRequestRecord>;
  submitRemovalRequest(userId: string, data: SubmitRemovalRequestDTO): Promise<ClaimRequestRecord>;
  cancelRequest(userId: string, requestId: string): Promise<ClaimRequestRecord>;
  getMyClaimRequests(userId: string): Promise<ClaimRequestWithCourt[]>;
  getClaimRequestById(userId: string, requestId: string): Promise<ClaimRequestWithDetails>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `claimRequest.submitClaim` | protected + rateLimited(sensitive) | `SubmitClaimRequestSchema` | Submit claim for curated court |
| `claimRequest.submitRemoval` | protected + rateLimited(sensitive) | `SubmitRemovalRequestSchema` | Request removal from listing |
| `claimRequest.cancel` | protected | `{ requestId: string }` | Cancel pending request |
| `claimRequest.getMy` | protected | - | List user's claim requests |
| `claimRequest.getById` | protected | `{ id: string }` | Get claim request details |

### DTOs

#### SubmitClaimRequestSchema

```typescript
const SubmitClaimRequestSchema = z.object({
  courtId: z.string().uuid(),
  organizationId: z.string().uuid(),
  requestNotes: z.string().max(1000).optional(),
});
```

#### SubmitRemovalRequestSchema

```typescript
const SubmitRemovalRequestSchema = z.object({
  courtId: z.string().uuid(),
  organizationId: z.string().uuid(),
  requestNotes: z.string().min(1).max(1000), // Required for removal
});
```

### Response Types

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

### Errors

| Error | HTTP | Description |
|-------|------|-------------|
| `ClaimRequestNotFoundError` | 404 | Claim request doesn't exist |
| `CourtAlreadyClaimedError` | 409 | Court is already claimed |
| `PendingClaimExistsError` | 409 | A pending claim already exists for this court |
| `NotCuratedCourtError` | 400 | Court is not a curated court |
| `CourtNotUnclaimedError` | 400 | Court is not in UNCLAIMED status |
| `NotClaimRequestOwnerError` | 403 | User doesn't own this claim request |

### Business Logic

#### Submit Claim Request

```typescript
async submitClaimRequest(
  userId: string,
  data: SubmitClaimRequestDTO
): Promise<ClaimRequestRecord> {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Verify user owns the organization
    const org = await this.orgRepo.findById(data.organizationId);
    if (!org || org.ownerUserId !== userId) {
      throw new NotOrganizationOwnerError();
    }
    
    // 2. Get court and verify it's claimable
    const court = await this.courtRepo.findByIdForUpdate(data.courtId, ctx);
    if (!court) {
      throw new CourtNotFoundError();
    }
    
    if (court.courtType !== "CURATED") {
      throw new NotCuratedCourtError();
    }
    
    if (court.claimStatus !== "UNCLAIMED") {
      throw new CourtNotUnclaimedError();
    }
    
    // 3. Check for existing pending claim
    const pendingClaim = await this.claimRequestRepo.findPendingByCourtId(data.courtId);
    if (pendingClaim) {
      throw new PendingClaimExistsError();
    }
    
    // 4. Create claim request
    const claimRequest = await this.claimRequestRepo.create({
      courtId: data.courtId,
      organizationId: data.organizationId,
      requestType: "CLAIM",
      status: "PENDING",
      requestedByUserId: userId,
      requestNotes: data.requestNotes,
    }, ctx);
    
    // 5. Update court claim status
    await this.courtRepo.update(data.courtId, {
      claimStatus: "CLAIM_PENDING",
    }, ctx);
    
    // 6. Create audit event
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

#### Cancel Request

```typescript
async cancelRequest(
  userId: string,
  requestId: string
): Promise<ClaimRequestRecord> {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Get claim request
    const request = await this.claimRequestRepo.findByIdForUpdate(requestId, ctx);
    if (!request) {
      throw new ClaimRequestNotFoundError();
    }
    
    // 2. Verify ownership (user must be the requester)
    if (request.requestedByUserId !== userId) {
      throw new NotClaimRequestOwnerError();
    }
    
    // 3. Verify status is PENDING
    if (request.status !== "PENDING") {
      throw new InvalidClaimStatusError(
        `Cannot cancel claim request in ${request.status} status`
      );
    }
    
    // 4. Soft delete (we don't actually delete, just mark somehow)
    // For MVP, we'll reject it ourselves
    const updated = await this.claimRequestRepo.update(requestId, {
      status: "REJECTED",
      reviewNotes: "Cancelled by requester",
    }, ctx);
    
    // 5. Revert court claim status
    await this.courtRepo.update(request.courtId, {
      claimStatus: "UNCLAIMED",
    }, ctx);
    
    // 6. Create audit event
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

### Testing Checklist

- [ ] Can submit claim for curated court
- [ ] Cannot claim non-curated court
- [ ] Cannot claim already claimed court
- [ ] Cannot submit duplicate pending claim
- [ ] Court status updates to CLAIM_PENDING
- [ ] Can cancel own pending request
- [ ] Court status reverts on cancellation
- [ ] Can list my claim requests
- [ ] Audit events created

---

## Module 4B: Claim Admin Module

**Assigned to:** Agent 4  
**Complexity:** High  
**Dependencies:** Module 4A (Claim Request), Pre-Phase 0B (Admin Role)

### Overview

Admin operations for reviewing and processing claim requests, including the complex approval flow that converts curated courts to reservable.

### Directory Structure

```
src/modules/claim-request/
├── admin/
│   └── claim-admin.router.ts
├── dtos/
│   ├── approve-claim-request.dto.ts
│   └── reject-claim-request.dto.ts
├── services/
│   └── claim-admin.service.ts
└── use-cases/
    └── approve-claim-request.use-case.ts
```

### Service Interface

```typescript
interface IClaimAdminService {
  getPendingClaimRequests(pagination: PaginationDTO): Promise<PaginatedResult<ClaimRequestWithDetails>>;
  getClaimRequestById(requestId: string): Promise<ClaimRequestWithDetails>;
  approveClaimRequest(adminUserId: string, requestId: string, notes?: string): Promise<ClaimRequestRecord>;
  rejectClaimRequest(adminUserId: string, requestId: string, reason: string): Promise<ClaimRequestRecord>;
}
```

### Router Endpoints

| Endpoint | Procedure | Input | Description |
|----------|-----------|-------|-------------|
| `admin.claim.getPending` | admin | `PaginationSchema` | List pending claims |
| `admin.claim.getById` | admin | `{ id: string }` | Get claim details |
| `admin.claim.approve` | admin + rateLimited(mutation) | `ApproveClaimRequestSchema` | Approve claim |
| `admin.claim.reject` | admin + rateLimited(mutation) | `RejectClaimRequestSchema` | Reject claim |

### DTOs

#### ApproveClaimRequestSchema

```typescript
const ApproveClaimRequestSchema = z.object({
  requestId: z.string().uuid(),
  reviewNotes: z.string().max(1000).optional(),
});
```

#### RejectClaimRequestSchema

```typescript
const RejectClaimRequestSchema = z.object({
  requestId: z.string().uuid(),
  reviewNotes: z.string().min(1).max(1000), // Required for rejection
});
```

### Use Case: ApproveClaimRequestUseCase

This is a complex transaction with multiple steps:

```typescript
class ApproveClaimRequestUseCase {
  async execute(
    adminUserId: string,
    requestId: string,
    reviewNotes?: string
  ): Promise<ClaimRequestRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx = { tx };
      
      // 1. Lock and fetch claim request
      const claimRequest = await this.claimRequestRepo.findByIdForUpdate(requestId, ctx);
      if (!claimRequest) {
        throw new ClaimRequestNotFoundError();
      }
      
      if (claimRequest.status !== "PENDING") {
        throw new InvalidClaimStatusError(
          `Cannot approve claim request in ${claimRequest.status} status`
        );
      }
      
      // 2. Lock and fetch court
      const court = await this.courtRepo.findByIdForUpdate(claimRequest.courtId, ctx);
      if (!court) {
        throw new CourtNotFoundError();
      }
      
      // 3. Fetch curated court details (to potentially copy contact info)
      const curatedDetail = await this.curatedDetailRepo.findByCourtId(court.id);
      
      // 4. Update claim request
      const updatedRequest = await this.claimRequestRepo.update(requestId, {
        status: "APPROVED",
        reviewerUserId: adminUserId,
        reviewedAt: new Date(),
        reviewNotes,
      }, ctx);
      
      // 5. Update court
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
        // Could copy website URL or other info from curated detail
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

### Reject Claim Request

```typescript
async rejectClaimRequest(
  adminUserId: string,
  requestId: string,
  reason: string
): Promise<ClaimRequestRecord> {
  return this.transactionManager.run(async (tx) => {
    const ctx = { tx };
    
    // 1. Lock and fetch claim request
    const claimRequest = await this.claimRequestRepo.findByIdForUpdate(requestId, ctx);
    if (!claimRequest) {
      throw new ClaimRequestNotFoundError();
    }
    
    if (claimRequest.status !== "PENDING") {
      throw new InvalidClaimStatusError(
        `Cannot reject claim request in ${claimRequest.status} status`
      );
    }
    
    // 2. Update claim request
    const updated = await this.claimRequestRepo.update(requestId, {
      status: "REJECTED",
      reviewerUserId: adminUserId,
      reviewedAt: new Date(),
      reviewNotes: reason,
    }, ctx);
    
    // 3. Revert court claim status
    await this.courtRepo.update(claimRequest.courtId, {
      claimStatus: "UNCLAIMED",
    }, ctx);
    
    // 4. Create audit event
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

### Testing Checklist

- [ ] Only admins can access endpoints
- [ ] Can list pending claim requests
- [ ] Can view claim request details
- [ ] Approval converts court to RESERVABLE
- [ ] Approval creates ReservableCourtDetail
- [ ] Approval deletes CuratedCourtDetail
- [ ] Approval updates organization_id on court
- [ ] Rejection reverts court status
- [ ] Audit events created for all actions
- [ ] Cannot approve/reject non-PENDING requests

---

## Completion Criteria (Phase 4)

- [ ] Both modules complete and tested
- [ ] Full claim flow works (submit → approve → court becomes reservable)
- [ ] Rejection flow works correctly
- [ ] Admin authorization working
- [ ] All audit events logged
- [ ] Court type transitions correctly handled
